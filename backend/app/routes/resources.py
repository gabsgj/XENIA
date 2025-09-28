import logging
from flask import Blueprint, request, jsonify
from ..supabase_client import get_supabase
from ..supabase_client import get_supabase, supabase_call
from ..errors import ApiError
from ..services.resources import get_resources, fetch_resources_for_topic
from ..services.ai_providers import get_topic_resources
from ..utils import normalize_user_id, is_valid_uuid
from ..services.progress import progress_batcher
import hashlib, json, time

# Simple in-memory request cache for deduplication. In prod replace with Redis.
_request_cache = {}
_CACHE_TTL = int(__import__('os').getenv('PROGRESS_REQUEST_CACHE_TTL', '5'))
from ..services.topic_store import get_topics as store_get_topics

logger = logging.getLogger('xenia')
resources_bp = Blueprint("resources", __name__)


def _determine_topic_category(topic: str) -> str:
    """Determine the broad category of a topic for better resource targeting."""
    topic_lower = topic.lower()
    
    # Programming/CS terms
    if any(term in topic_lower for term in ["programming", "code", "algorithm", "data structure", "software", "web", "api", "javascript", "python", "java", "css", "html", "database", "networking", "operating system"]):
        return "programming"
    
    # Mathematics terms
    if any(term in topic_lower for term in ["math", "algebra", "calculus", "geometry", "statistics", "equation", "formula", "theorem", "proof", "linear algebra", "differential equations", "probability"]):
        return "mathematics"
    
    # Science terms
    if any(term in topic_lower for term in ["physics", "chemistry", "biology", "science", "experiment", "theory", "hypothesis", "quantum", "mechanics", "thermodynamics", "organic chemistry", "molecular"]):
        return "science"
    
    # Language terms
    if any(term in topic_lower for term in ["language", "literature", "writing", "grammar", "english", "spanish", "french", "german", "poetry", "novel", "essay"]):
        return "language"
    
    # Business terms
    if any(term in topic_lower for term in ["business", "finance", "marketing", "economics", "accounting", "management", "entrepreneurship", "strategy"]):
        return "business"
    
    # History terms
    if any(term in topic_lower for term in ["history", "civilization", "war", "revolution", "empire", "ancient", "medieval", "modern"]):
        return "history"
    
    # Art terms
    if any(term in topic_lower for term in ["art", "painting", "sculpture", "architecture", "design", "photography", "music", "theater"]):
        return "art"
    
    return "general"


@resources_bp.get("/topics")
def list_topics():
    raw_user_id = request.args.get("user_id") or request.headers.get("X-User-Id") or ""
    if not raw_user_id:
        raise ApiError("AUTH_401", "Missing user_id")
    user_id = normalize_user_id(raw_user_id)
    # If invalid UUID -> use in-memory store for development/testing
    if not is_valid_uuid(user_id):
        topics = store_get_topics(user_id)
        return {"topics": [
            {"id": f"mem-{idx}", "topic": t, "parent_topic": None, "order_index": idx, "status": "pending", "completed_at": None}
            for idx, t in enumerate(topics)
        ]}
    sb = get_supabase()
    try:
        resp = supabase_call(lambda: sb.table("syllabus_topics").select(
            "id, topic, parent_topic, order_index, status, completed_at"
        ).eq("user_id", user_id).order("order_index").limit(500).execute())
        
        # If no topics found, return sample topics to get started
        if not resp.data or len(resp.data) == 0:
            logger.info(f"No topics found for user {user_id}, returning sample topics")
            sample_topics = [
                {"id": "sample-1", "topic": "Introduction to Programming", "parent_topic": None, "order_index": 1, "status": "pending", "completed_at": None},
                {"id": "sample-2", "topic": "Data Structures", "parent_topic": None, "order_index": 2, "status": "pending", "completed_at": None},
                {"id": "sample-3", "topic": "Algorithms", "parent_topic": None, "order_index": 3, "status": "pending", "completed_at": None},
                {"id": "sample-4", "topic": "Web Development", "parent_topic": None, "order_index": 4, "status": "pending", "completed_at": None},
                {"id": "sample-5", "topic": "Database Design", "parent_topic": None, "order_index": 5, "status": "pending", "completed_at": None}
            ]
            return {"topics": sample_topics}
        
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
        # Development mode: return empty list when no database connection
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
        # Development mode: return optimistic success when no database connection
        return {"ok": True, "plan": {"sessions": []}}
    session_updates = data.get("sessions", [])  # [{date, topic, status}]
    
    # Check if any sessions reference sample topics - if so, return success without DB operations
    has_sample_topics = any(upd.get("topic", "").startswith("sample-") for upd in session_updates)
    if has_sample_topics:
        logger.info(f"Sample topics detected in progress update for user {user_id}, returning optimistic success")
        return {"ok": True, "plan": {"sessions": []}}
    
    # Deduplication: compute a request hash and return cached response for short TTL
    try:
        request_hash = hashlib.md5(json.dumps(session_updates, sort_keys=True).encode()).hexdigest()
        now = time.time()
        if request_hash in _request_cache:
            last_time, response = _request_cache[request_hash]
            if now - last_time < _CACHE_TTL:
                return response

        # Add sessions to batcher for analytics (non-blocking)
        for session in session_updates:
            progress_batcher.add_update(user_id, session)

        # Persist session status changes directly into the stored plan so UI reflects on reload
        try:
            plan_resp = supabase_call(lambda: sb.table("plans").select("plan").eq("user_id", user_id).limit(1).execute())
            if not plan_resp.data:
                # No plan yet; return queued result
                response = {"ok": True, "queued": len(session_updates)}
                _request_cache[request_hash] = (now, response)
                # cleanup old entries in-place
                for k, v in list(_request_cache.items()):
                    if now - v[0] >= _CACHE_TTL:
                        _request_cache.pop(k, None)
                return response

            plan = plan_resp.data[0]["plan"]
            session_map = {(s.get("date"), s.get("topic")): s for s in plan.get("sessions", [])}
            completed_sessions = []

            for upd in session_updates:
                key = (upd.get("date"), upd.get("topic"))
                if key in session_map:
                    old_status = session_map[key].get("status", "pending")
                    new_status = upd.get("status", "completed")
                    session_map[key]["status"] = new_status

                    if "duration_min" in upd:
                        session_map[key]["duration_min"] = upd["duration_min"]

                    # Determine target DB task status for consistency
                    db_status = "done" if new_status == "completed" else ("doing" if new_status == "in-progress" else "todo")

                    # Apply analytics capture when transitioning to completed
                    if old_status != "completed" and new_status == "completed":
                        session_data = session_map[key]
                        completed_sessions.append({
                            "user_id": user_id,
                            "topic": session_data.get("topic"),
                            "duration_min": session_data.get("duration_min", 45),
                            "status": "completed",
                            "created_at": f"{upd.get('date')}T12:00:00Z"
                        })

                    # Persist matching task status change (match by user_id + topic + due_date)
                    try:
                        supabase_call(lambda: sb.table("tasks").update({"status": db_status})
                            .eq("user_id", user_id)
                            .eq("topic", session_map[key].get("topic"))
                            .eq("due_date", upd.get("date"))
                            .execute())
                    except Exception as te:
                        logger.warning(f"Failed to update task status to {db_status} for {session_map[key].get('topic')} on {upd.get('date')}: {te}")

            # Upsert updated plan back
            plan["sessions"] = list(session_map.values())
            supabase_call(lambda: sb.table("plans").upsert({"user_id": user_id, "plan": plan}).execute())

            # Record completed sessions (analytics)
            if completed_sessions:
                try:
                    for session in completed_sessions:
                        supabase_call(lambda s=session: sb.table("sessions").upsert(s).execute())
                    logger.info(f"Recorded {len(completed_sessions)} completed sessions in analytics")
                except Exception as ie:
                    logger.warning(f"Failed to record sessions in analytics: {ie}")

            response = {"ok": True, "plan": plan}
        except Exception as persist_error:
            # If persistence fails for any reason, return queued result but log
            logger.warning(f"Failed to persist session status to plan: {persist_error}")
            response = {"ok": True, "queued": len(session_updates)}

        _request_cache[request_hash] = (now, response)
        # cleanup old entries in-place
        for k, v in list(_request_cache.items()):
            if now - v[0] >= _CACHE_TTL:
                _request_cache.pop(k, None)
        return response

    except ApiError:
        raise

    except Exception as e:
        # fallback to previous synchronous DB update flow if batcher fails
        logger.warning(f"Batcher path failed, falling back to direct DB update: {e}")
        try:
            plan_resp = supabase_call(lambda: sb.table("plans").select("plan").eq("user_id", user_id).limit(1).execute())
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

                    if "duration_min" in upd:
                        session_map[key]["duration_min"] = upd["duration_min"]

                    # Determine target DB task status for consistency
                    db_status = "done" if new_status == "completed" else ("doing" if new_status == "in-progress" else "todo")

                    if old_status != "completed" and new_status == "completed":
                        session_data = session_map[key]
                        completed_sessions.append({
                            "user_id": user_id,
                            "topic": session_data.get("topic"),
                            "duration_min": session_data.get("duration_min", 45),
                            "status": "completed",
                            "created_at": f"{upd.get('date')}T12:00:00Z"
                        })
                    # Update matching task status
                    try:
                        supabase_call(lambda: sb.table("tasks").update({"status": db_status})
                            .eq("user_id", user_id)
                            .eq("topic", session_map[key].get("topic"))
                            .eq("due_date", upd.get("date"))
                            .execute())
                    except Exception as te:
                        logger.warning(f"(fallback) Failed to update task to {db_status} for {session_map[key].get('topic')} on {upd.get('date')}: {te}")

            plan["sessions"] = list(session_map.values())
            supabase_call(lambda: sb.table("plans").upsert({"user_id": user_id, "plan": plan}).execute())

            if completed_sessions:
                try:
                    for session in completed_sessions:
                        supabase_call(lambda s=session: sb.table("sessions").upsert(s).execute())
                    logger.info(f"Recorded {len(completed_sessions)} completed sessions in analytics")
                except Exception as ie:
                    logger.warning(f"Failed to record sessions in analytics during fallback: {ie}")

            return {"ok": True, "plan": plan}
        except ApiError:
            raise
        except Exception as ee:
            logger.error(f"Progress update failed in fallback: {ee}")
            return {"ok": False, "error": str(ee)}, 500


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
    
    # Handle sample topics
    if topic.startswith("sample-"):
        logger.info(f"Sample topic {topic} status update for user {user_id}, returning optimistic success")
        return {"ok": True}
    
    if not is_valid_uuid(user_id):
        # Development: pretend success
        return {"ok": True}
    try:
        update = {"status": status}
        if status == "completed":
            from datetime import datetime, timezone
            update["completed_at"] = datetime.now(timezone.utc).isoformat()
        supabase_call(lambda: sb.table("syllabus_topics").update(update).eq("user_id", user_id).eq("topic", topic).execute())
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
    
    # Handle sample topics
    has_sample_topics = any(u.get("topic", "").startswith("sample-") for u in updates)
    if has_sample_topics:
        logger.info(f"Sample topics detected in bulk status update for user {user_id}, returning optimistic success")
        return {"ok": True, "updated": len(updates)}
    
    if not is_valid_uuid(user_id):
        # Development: pretend success
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
            supabase_call(lambda: sb.table("syllabus_topics").update(patch).eq("user_id", user_id).eq("topic", topic).execute())
            changed += 1
        except Exception as e:
            logger.error(f"Bulk topic update error for {topic}: {e}")
    return {"ok": True, "updated": changed}


@resources_bp.get("/recommendations/<topic>")
def get_topic_recommendations(topic):
    """Get AI-enhanced personalized recommendations for a specific topic."""
    try:
        # Get query parameters
        learning_style = request.args.get("learning_style", "balanced")
        difficulty_level = request.args.get("difficulty", "intermediate")
        free_only = request.args.get("free_only", "true").lower() == "true"
        
        # Get user preferences from query params
        user_preferences = {
            "free_resources_only": free_only,
            "preferred_formats": request.args.getlist("formats") or ["video", "article", "practice"],
            "time_available": request.args.get("time", "moderate")
        }
        
        logger.info(f"Getting recommendations for topic: {topic}, style: {learning_style}, difficulty: {difficulty_level}")
        
        # Create topic metadata for better resource targeting
        topic_metadata = {
            "difficulty_score": 5 if difficulty_level == "intermediate" else (3 if difficulty_level == "beginner" else 8),
            "category": _determine_topic_category(topic),
            "learning_style": learning_style
        }
        
        # Use our enhanced resource system that includes topic-specific resources
        recommendations = fetch_resources_for_topic(
            topic=topic,
            learning_style=learning_style,
            topic_metadata=topic_metadata,
            user_preferences=user_preferences
        )
        
        # Group recommendations by source type for better organization
        grouped_recommendations = {
            "topic_specific": [r for r in recommendations if r.get("source") == "topic_specific"],
            "subject_resources": [r for r in recommendations if r.get("source") == "subject_specific"],
            "youtube_videos": [r for r in recommendations if r.get("source") == "youtube"],
            "ai_generated": [r for r in recommendations if r.get("source") == "ai_generated"],
            "ocw_courses": [r for r in recommendations if r.get("source") == "ocw"],
            "documentation": [r for r in recommendations if r.get("source") in ["wikipedia", "wikibooks", "stack_overflow", "github", "medium", "dev_to"]],
            "hugging_face": [r for r in recommendations if r.get("source") == "huggingface"]
        }
        
        return jsonify({
            "success": True,
            "topic": topic,
            "total_recommendations": len(recommendations),
            "grouped_recommendations": grouped_recommendations,
            "top_recommendations": recommendations[:6],  # Top 6 most relevant
            "personalization": {
                "learning_style": learning_style,
                "difficulty_level": difficulty_level,
                "user_preferences": user_preferences,
                "topic_metadata": topic_metadata
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting topic recommendations: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "topic": topic
        }), 500


@resources_bp.post("/discover")
def discover_resources():
    """Discover resources for multiple topics with personalization."""
    try:
        data = request.get_json() or {}
        topics = data.get("topics", [])
        learning_style = data.get("learning_style", "balanced")
        user_preferences = data.get("user_preferences", {})
        
        if not topics:
            raise ApiError("RESOURCES_400", "No topics provided")
        
        logger.info(f"Discovering resources for {len(topics)} topics")
        
        all_resources = []
        for topic in topics[:10]:  # Limit to 10 topics
            try:
                # Get topic metadata if available
                topic_metadata = data.get("topic_metadata", {}).get(topic, {})
                
                # Fetch enhanced resources
                resources = fetch_resources_for_topic(
                    topic=topic,
                    learning_style=learning_style,
                    topic_metadata=topic_metadata,
                    user_preferences=user_preferences
                )
                
                all_resources.append({
                    "topic": topic,
                    "resources": resources,
                    "count": len(resources)
                })
                
            except Exception as e:
                logger.error(f"Error fetching resources for topic {topic}: {e}")
                all_resources.append({
                    "topic": topic,
                    "resources": [],
                    "error": str(e)
                })
        
        return jsonify({
            "success": True,
            "results": all_resources,
            "total_topics": len(topics),
            "processed_topics": len(all_resources)
        })
        
    except Exception as e:
        logger.error(f"Error in resource discovery: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@resources_bp.get("/quality-score/<topic>")
def get_resource_quality_scores(topic):
    """Get quality scores and explanations for topic resources."""
    try:
        learning_style = request.args.get("learning_style", "balanced")
        
        # Get basic resources
        resources = fetch_resources_for_topic(topic, learning_style=learning_style)
        
        # Calculate quality metrics
        quality_analysis = {
            "topic": topic,
            "total_resources": len(resources),
            "quality_distribution": {
                "high_quality": len([r for r in resources if r.get("quality_score", 5) >= 8]),
                "medium_quality": len([r for r in resources if 5 <= r.get("quality_score", 5) < 8]),
                "low_quality": len([r for r in resources if r.get("quality_score", 5) < 5])
            },
            "source_diversity": len(set(r.get("source") for r in resources)),
            "personalization_match": sum(r.get("recommendation_score", 5) for r in resources) / len(resources) if resources else 0,
            "resources": resources
        }
        
        return jsonify({
            "success": True,
            "quality_analysis": quality_analysis
        })
        
    except Exception as e:
        logger.error(f"Error analyzing resource quality: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
