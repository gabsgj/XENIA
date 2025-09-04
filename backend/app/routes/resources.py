import logging
from flask import Blueprint, request
from ..supabase_client import get_supabase
from ..errors import ApiError
from ..services.resources import get_resources
from ..utils import normalize_user_id, is_valid_uuid
from ..services.topic_store import get_topics as store_get_topics

logger = logging.getLogger('xenia')
resources_bp = Blueprint("resources", __name__)

@resources_bp.get("/topics")
def list_topics():
    raw_user_id = request.args.get("user_id") or request.headers.get("X-User-Id") or ""
    if not raw_user_id:
        raise ApiError("AUTH_401", "Missing user_id")
    user_id = normalize_user_id(raw_user_id)
    # If invalid UUID -> use in-memory store only (demo mode)
    if not is_valid_uuid(user_id):
        topics = store_get_topics(user_id)
        return {"topics": [
            {"id": f"mem-{idx}", "topic": t, "parent_topic": None, "order_index": idx, "status": "pending", "completed_at": None}
            for idx, t in enumerate(topics)
        ]}
    sb = get_supabase()
    try:
        resp = sb.table("syllabus_topics").select(
            "id, topic, parent_topic, order_index, status, completed_at"
        ).eq("user_id", user_id).order("order_index").limit(500).execute()
        return {"topics": resp.data or []}
    except Exception as e:
        logger.error(f"Topic fetch failed: {e}")
        return {"topics": []}

@resources_bp.get("/list")
def list_resources():
    raw_user_id = request.args.get("user_id") or request.headers.get("X-User-Id") or ""
    if not raw_user_id:
        raise ApiError("AUTH_401", "Missing user_id")
    user_id = normalize_user_id(raw_user_id)
    if not is_valid_uuid(user_id):
        # Demo mode: we currently don't store resources for demo users (no DB). Return empty list.
        return {"resources": []}
    data = get_resources(user_id)
    return {"resources": data}

@resources_bp.post("/progress")
def update_progress():
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    raw_user_id = data.get("user_id") or request.headers.get("X-User-Id") or ""
    if not raw_user_id:
        raise ApiError("AUTH_401", "Missing user_id")
    user_id = normalize_user_id(raw_user_id)
    if not is_valid_uuid(user_id):
        # Demo users: progress not persisted; return optimistic success
        return {"ok": True, "plan": {"sessions": []}}
    session_updates = data.get("sessions", [])  # [{date, topic, status}]
    try:
        plan_resp = sb.table("plans").select("plan").eq("user_id", user_id).limit(1).execute()
        if not plan_resp.data:
            raise ApiError("PLAN_404", "Plan not found", status=404)
        plan = plan_resp.data[0]["plan"]
        session_map = {(s.get("date"), s.get("topic")): s for s in plan.get("sessions", [])}
        completed_sessions = []
        
        for upd in session_updates:
            key = (upd.get("date"), upd.get("topic"))
            if key in session_map:
                old_status = session_map[key].get("status", "pending")
                new_status = upd.get("status", "completed")
                session_map[key]["status"] = new_status
                
                # If session was just completed, record it in analytics
                if old_status != "completed" and new_status == "completed":
                    session_data = session_map[key]
                    completed_sessions.append({
                        "user_id": user_id,
                        "topic": session_data.get("topic"),
                        "duration_min": session_data.get("duration_min", 45),
                        "status": "completed",
                        "created_at": f"{upd.get('date')}T12:00:00Z"  # Use session date
                    })
        
        plan["sessions"] = list(session_map.values())
        sb.table("plans").upsert({"user_id": user_id, "plan": plan}).execute()
        
        # Record completed sessions in analytics database
        if completed_sessions:
            try:
                for session in completed_sessions:
                    sb.table("sessions").upsert(session).execute()
                logger.info(f"Recorded {len(completed_sessions)} completed sessions in analytics")
            except Exception as e:
                logger.warning(f"Failed to record sessions in analytics: {e}")
        
        return {"ok": True, "plan": plan}
    except ApiError:
        raise
    except Exception as e:
        logger.error(f"Progress update failed: {e}")
        return {"ok": False, "error": str(e)}, 500


@resources_bp.post("/topics/status")
def update_topic_status():
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    raw_user_id = data.get("user_id") or request.headers.get("X-User-Id") or ""
    topic = data.get("topic")
    status = data.get("status")
    if not raw_user_id or not topic or status not in ("pending","in-progress","completed"):
        raise ApiError("PLAN_400", "Invalid topic status payload")
    user_id = normalize_user_id(raw_user_id)
    if not is_valid_uuid(user_id):
        # Demo: pretend success
        return {"ok": True}
    try:
        update = {"status": status}
        if status == "completed":
            from datetime import datetime, timezone
            update["completed_at"] = datetime.now(timezone.utc).isoformat()
        sb.table("syllabus_topics").update(update).eq("user_id", user_id).eq("topic", topic).execute()
        return {"ok": True}
    except Exception as e:
        logger.error(f"Topic status update failed: {e}")
        raise ApiError("DB_WRITE_FAIL", "Unable to update topic status")


@resources_bp.post("/topics/bulk_status")
def bulk_topic_status():
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    raw_user_id = data.get("user_id") or request.headers.get("X-User-Id") or ""
    updates = data.get("updates", [])  # [{topic, status}]
    if not raw_user_id or not isinstance(updates, list):
        raise ApiError("PLAN_400", "Invalid payload")
    user_id = normalize_user_id(raw_user_id)
    if not is_valid_uuid(user_id):
        # Demo: pretend success
        return {"ok": True, "updated": len(updates)}
    from datetime import datetime, timezone
    completed_time = datetime.now(timezone.utc).isoformat()
    changed = 0
    for u in updates:
        topic = u.get("topic")
        status = u.get("status")
        if not topic or status not in ("pending","in-progress","completed"):
            continue
        patch = {"status": status}
        if status == "completed":
            patch["completed_at"] = completed_time
        try:
            sb.table("syllabus_topics").update(patch).eq("user_id", user_id).eq("topic", topic).execute()
            changed += 1
        except Exception as e:
            logger.error(f"Bulk topic update error for {topic}: {e}")
    return {"ok": True, "updated": changed}
