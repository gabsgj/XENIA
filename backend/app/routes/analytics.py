import logging
from flask import Blueprint, request
from ..errors import ApiError
from ..supabase_client import get_supabase
from ..utils import normalize_user_id, is_valid_uuid

logger = logging.getLogger('xenia')
analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.get("/me")
def whoami():
    """Return normalized user id and persistence capability.

    Uses X-User-Id header or user_id query param (legacy) then normalizes.
    Indicates whether the id is a valid UUID (can persist) or demo/hashed.
    """
    raw_user_id = request.headers.get("X-User-Id") or request.args.get("user_id") or ""
    if not raw_user_id:
        return {"raw_user_id": None, "normalized_user_id": None, "persist": False}
    normalized = normalize_user_id(raw_user_id)
    return {
        "raw_user_id": raw_user_id,
        "normalized_user_id": normalized,
        "persist": is_valid_uuid(normalized)
    }


@analytics_bp.get("/student")
def student_analytics():
    """Return per-student analytics (sessions, tasks, profile).

    Query param: user_id (optional) or X-User-Id header.
    If user id missing or invalid -> return empty sets.
    """
    logger.info("📊 Student analytics endpoint called")
    sb = get_supabase()
    raw_user_id = request.args.get("user_id") or request.headers.get("X-User-Id") or ""
    user_id = normalize_user_id(raw_user_id) if raw_user_id else ""
    logger.debug(f"analytics.student raw={raw_user_id} normalized={user_id}")

    sessions = []
    tasks = []
    profile = {}
    if not is_valid_uuid(user_id):
        return {"sessions": sessions, "tasks": tasks, "profile": profile}

    try:
        sessions_resp = (
            sb.table("sessions")
            .select("duration_min, topic, created_at")
            .eq("user_id", user_id)
            .limit(200)
            .execute()
        )
        sessions = sessions_resp.data or []
    except Exception as e:
        logger.warning(f"sessions fetch failed: {e}")

    try:
        tasks_resp = (
            sb.table("tasks")
            .select("status, topic, created_at")
            .eq("user_id", user_id)
            .limit(200)
            .execute()
        )
        tasks = tasks_resp.data or []
    except Exception as e:
        logger.warning(f"tasks fetch failed: {e}")

    try:
        prof_resp = (
            sb.table("profiles")
            .select("xp, level, streak_days")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        prof_data = prof_resp.data or []
        profile = prof_data[0] if prof_data else {}
    except Exception as e:
        logger.warning(f"profile fetch failed: {e}")

    return {"sessions": sessions, "tasks": tasks, "profile": profile}


@analytics_bp.get("/parent")
def parent_analytics():
    logger.info("👨‍👩‍👧‍👦 Parent analytics endpoint called")
    sb = get_supabase()
    parent_id = request.args.get("parent_id", "")
    if not parent_id:
        logger.error("   Missing parent_id parameter")
        raise ApiError("AUTH_401", "Missing parent_id")
    
    logger.info(f"   Parent ID: {parent_id}")
    
    try:
        logger.info("   Fetching children data...")
        children = (
            sb.table("parents_children")
            .select("child_user_id")
            .eq("parent_user_id", parent_id)
            .execute()
            .data
            or []
        )
        child_ids = [c["child_user_id"] for c in children]
        logger.info(f"   Found {len(child_ids)} children")
        
        logger.info("   Fetching children profiles...")
        profiles = (
            sb.table("profiles")
            .select("user_id, xp, level, streak_days")
            .in_("user_id", child_ids)
            .execute()
            .data
            or []
        )
        logger.info(f"   Found {len(profiles)} child profiles")
        
        result = {"parent_id": parent_id, "profiles": profiles}
        logger.info(f"   Returning parent analytics for parent {parent_id}")
        return result
    except Exception as e:
        logger.warning(f"   Database error, returning empty parent analytics: {str(e)}")
        return {"parent_id": parent_id, "profiles": []}
