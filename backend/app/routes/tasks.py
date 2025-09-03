import logging
from flask import Blueprint, request
from ..errors import ApiError
from ..supabase_client import get_supabase
from datetime import datetime, timezone

logger = logging.getLogger('xenia')
tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.post("/track")
def track_session():
    logger.info("📝 Track session endpoint called")
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    
    user_id = data.get("user_id")
    topic = data.get("topic")
    duration_min = data.get("duration_min", 30)
    
    logger.info(f"   User ID: {user_id}")
    logger.info(f"   Topic: {topic}")
    logger.info(f"   Duration: {duration_min} minutes")
    
    if not user_id:
        logger.error("   Missing user_id in request")
        raise ApiError("AUTH_401", "Missing user id")
    if not topic:
        logger.error("   Missing topic in request")
        raise ApiError("PLAN_400", "Missing topic")
    
    try:
        logger.info("   Inserting session into database...")
        # Store timezone-aware UTC timestamp
        data["created_at"] = datetime.now(timezone.utc).isoformat()
        sb.table("sessions").insert(data).execute()
        logger.info("   Session inserted successfully")
        
        # XP mechanic: +10 per 30 min
        xp = max(5, (duration_min // 30) * 10)
        logger.info(f"   Awarding {xp} XP to user {user_id}")
        sb.rpc("add_xp", {"p_user_id": user_id, "p_xp": xp}).execute()
        logger.info("   XP awarded successfully")
        
        result = {"ok": True, "awarded_xp": xp}
        logger.info(f"   Session tracking completed for user {user_id}")
        return result
    except Exception as e:
        logger.warning(f"   Database error, returning mock response: {str(e)}")
        # Return success even if database operation fails in mock mode
        xp = max(5, (duration_min // 30) * 10)
        result = {"ok": True, "awarded_xp": xp, "mock": True}
        logger.info(f"   Mock session tracking completed for user {user_id}")
        return result


@tasks_bp.post("/complete")
def complete_task():
    logger.info("✅ Complete task endpoint called")
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    
    task_id = data.get("task_id")
    user_id = data.get("user_id")
    
    logger.info(f"   Task ID: {task_id}")
    logger.info(f"   User ID: {user_id}")
    
    if not task_id:
        logger.error("   Missing task_id in request")
        raise ApiError("PLAN_400", "Missing task_id")
    
    try:
        logger.info("   Updating task status to 'done'...")
        sb.table("tasks").update({"status": "done"}).eq("id", task_id).execute()
        logger.info("   Task status updated successfully")
        
        logger.info(f"   Awarding 20 XP to user {user_id}")
        sb.rpc("add_xp", {"p_user_id": user_id, "p_xp": 20}).execute()
        logger.info("   XP awarded successfully")
        
        result = {"ok": True}
        logger.info(f"   Task completion processed for task {task_id}")
        return result
    except Exception as e:
        logger.warning(f"   Database error, returning mock response: {str(e)}")
        # Return success even if database operation fails in mock mode
        result = {"ok": True, "mock": True}
        logger.info(f"   Mock task completion processed for task {task_id}")
        return result
