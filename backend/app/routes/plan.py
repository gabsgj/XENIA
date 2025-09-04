import logging
from flask import Blueprint, request
from ..utils import get_user_id_from_request
from ..errors import ApiError
from ..services.planning import generate_plan, get_current_plan

logger = logging.getLogger('xenia')
plan_bp = Blueprint("plan", __name__)


@plan_bp.post("/generate")
def generate():
    logger.info("🎯 Generate plan endpoint called")
    uid = get_user_id_from_request(request) or ""
    if not uid:
        logger.error("   Missing user_id in request")
        raise ApiError("PLAN_400", "Missing user_id")
    else:
        logger.info(f"   User ID: {uid}")
    
    try:
        if request.is_json:
            data = request.get_json(silent=True) or {}
            horizon = int(data.get("horizon_days", 14))
            preferred_hours = float(data.get("preferred_hours_per_day", 1.5))
            deadline = data.get("deadline")
        else:
            horizon = int(request.values.get("horizon_days", 14))
            preferred_hours = float(request.values.get("preferred_hours_per_day", 1.5))
            deadline = request.values.get("deadline")
        
        logger.info(f"   Horizon days: {horizon}")
        
        if horizon <= 0 or horizon > 90:
            logger.error(f"   Invalid horizon_days: {horizon}")
            raise ValueError("horizon out of range")
    except Exception:
        logger.error("   Invalid horizon_days parameter")
        raise ApiError("PLAN_400", "Invalid horizon_days")
    
    logger.info(f"   Generating plan for user {uid} with {horizon} days horizon...")
    plan = generate_plan(user_id=uid, horizon_days=horizon, preferred_hours_per_day=preferred_hours, deadline=deadline)
    logger.info(f"   Plan generated successfully for user {uid}")
    return plan, 200


@plan_bp.get("/current")
def current():
    logger.info("📋 Current plan endpoint called")
    uid = get_user_id_from_request(request) or ""
    if not uid:
        # For demo purposes, use demo-user if no user_id provided
        uid = "demo-user"
        logger.info(f"   No user_id provided, defaulting to: {uid}")
    else:
        logger.info(f"   User ID: {uid}")
    
    try:
        logger.info(f"   Retrieving current plan for user {uid}...")
        # Allow regeneration if prior plan generic (objective C)
        plan = get_current_plan(user_id=uid, allow_regenerate=True)
        # augment with progress metrics
        sessions = plan.get("sessions", [])
        completed = sum(1 for s in sessions if s.get("status") == "completed")
        in_progress = sum(1 for s in sessions if s.get("status") == "in-progress")
        total = len(sessions) or 1
        plan["progress"] = {
            "sessions_completed": completed,
            "sessions_in_progress": in_progress,
            "percent_complete": round(completed / total * 100, 2)
        }
        logger.info(f"   Current plan retrieved successfully for user {uid}")
        return plan, 200
    except Exception as e:
        logger.warning(f"   Plan retrieval failed, returning fallback plan: {str(e)}")
        # Return a basic plan even if retrieval fails
        fallback_plan = {
            "user_id": uid,
            "generated_at": "2024-01-15T10:00:00Z",
            "horizon_days": 14,
            "weak_topics": [{"topic": "General Review", "score": 1}],
            "sessions": [
                {"date": "2024-01-15", "topic": "General Review", "focus": "practice + review", "duration_min": 45}
            ]
        }
        logger.info(f"   Returning fallback plan for user {uid}")
        return fallback_plan, 200


@plan_bp.get("")
def current_alias():
    """Alias /api/plan -> /api/plan/current (objective D)."""
    return current()
