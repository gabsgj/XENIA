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
    uid = get_user_id_from_request(request)
    if not uid:
        # Use default user for deployment/demo scenarios
        uid = "demo-user"
        logger.info("   No user_id provided, using demo-user")
    logger.info(f"   User ID: {uid}")
    
    try:
        if request.is_json:
            data = request.get_json(silent=True) or {}
            horizon = int(data.get("horizon_days", 14))
            preferred_hours = float(data.get("preferred_hours_per_day", 1.5))
            deadline = data.get("deadline")
            learning_style = data.get("learning_style", "balanced")
            topics = data.get("topics", [])  # Get extracted topics from frontend
            topic_details = data.get("topic_details", [])  # Get detailed topic metadata
        else:
            horizon = int(request.values.get("horizon_days", 14))
            preferred_hours = float(request.values.get("preferred_hours_per_day", 1.5))
            deadline = request.values.get("deadline")
            learning_style = request.values.get("learning_style", "balanced")
            topics = []
            topic_details = []
        
        logger.info(f"   Horizon days: {horizon}")
        
        if horizon <= 0 or horizon > 90:
            logger.error(f"   Invalid horizon_days: {horizon}")
            raise ValueError("horizon out of range")
    except Exception:
        logger.error("   Invalid horizon_days parameter")
        raise ApiError("PLAN_400", "Invalid horizon_days")
    
    logger.info(f"   Generating plan for user {uid} with {horizon} days horizon...")
    logger.info(f"   Using {len(topics)} extracted topics and learning style: {learning_style}")
    plan = generate_plan(
        user_id=uid, 
        horizon_days=horizon, 
        preferred_hours_per_day=preferred_hours, 
        deadline=deadline,
        learning_style=learning_style,
        extracted_topics=topics,
        topic_details=topic_details
    )
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


@plan_bp.post("/update-progress")
def update_progress():
    """Update user progress and adjust plan accordingly."""
    logger.info("📊 Update progress endpoint called")
    uid = get_user_id_from_request(request)
    if not uid:
        # Use default user for deployment/demo scenarios
        uid = "demo-user"
        logger.info("   No user_id provided, using demo-user")
    
    try:
        data = request.get_json()
        if not data:
            raise ApiError("PLAN_400", "Missing progress data")
        
        progress_data = {
            "completion_percentage": float(data.get("completion_percentage", 0)),
            "sessions_completed": int(data.get("sessions_completed", 0)),
            "time_spent_hours": float(data.get("time_spent_hours", 0)),
            "completed_topics": data.get("completed_topics", []),
            "difficulty_ratings": data.get("difficulty_ratings", {}),
            "preferred_pace": data.get("preferred_pace", "normal"),
            "learning_style_feedback": data.get("learning_style_feedback", "balanced")
        }
        
        logger.info(f"   Progress update for user {uid}: {progress_data['completion_percentage']}% complete")
        
        # Get current plan
        current_plan_data = get_current_plan(uid)
        if not current_plan_data:
            raise ApiError("PLAN_404", "No current plan found")
        
        # Adjust plan based on progress
        from ..services.ai_providers import adjust_plan_based_on_progress
        adjusted_plan = adjust_plan_based_on_progress(current_plan_data, progress_data)
        
        logger.info(f"   Plan adjusted: {adjusted_plan.get('adjustment_type', 'unknown')}")
        
        return {
            "success": True,
            "adjustment_type": adjusted_plan.get("adjustment_type"),
            "adjusted_plan": adjusted_plan,
            "recommendations": adjusted_plan.get("recommendations", [])
        }, 200
        
    except Exception as e:
        logger.error(f"   Progress update failed: {e}")
        raise ApiError("PLAN_500", f"Failed to update progress: {str(e)}")


@plan_bp.get("/resources/<topic>")
def get_topic_resources(topic: str):
    """Get comprehensive resources for a specific topic."""
    logger.info(f"🔍 Resources endpoint called for topic: {topic}")
    uid = get_user_id_from_request(request) or ""
    
    try:
        learning_style = request.args.get("learning_style", "balanced")
        
        from ..services.ai_providers import get_topic_resources
        resources = get_topic_resources(topic, learning_style)
        
        logger.info(f"   Found resources for {topic}: {len(resources.get('youtube_videos', []))} videos")
        
        return {
            "success": True,
            "topic": topic,
            "resources": resources
        }, 200
        
    except Exception as e:
        logger.error(f"   Resource lookup failed: {e}")
        raise ApiError("PLAN_500", f"Failed to get resources: {str(e)}")


@plan_bp.post("/adjust")
def adjust_plan():
    """Manually adjust plan based on user preferences."""
    logger.info("🔧 Adjust plan endpoint called")
    uid = get_user_id_from_request(request)
    if not uid:
        # Use default user for deployment/demo scenarios
        uid = "demo-user"
        logger.info("   No user_id provided, using demo-user")
    
    try:
        data = request.get_json()
        if not data:
            raise ApiError("PLAN_400", "Missing adjustment data")
        
        adjustment_type = data.get("adjustment_type", "manual")
        new_deadline = data.get("new_deadline")
        new_hours_per_day = data.get("new_hours_per_day")
        focus_topics = data.get("focus_topics", [])
        
        logger.info(f"   Manual adjustment for user {uid}: {adjustment_type}")
        
        # Get current plan
        current_plan_data = get_current_plan(uid)
        if not current_plan_data:
            raise ApiError("PLAN_404", "No current plan found")
        
        # Apply adjustments
        adjusted_plan = current_plan_data.copy()
        
        if new_deadline:
            adjusted_plan["deadline"] = new_deadline
            logger.info(f"   Updated deadline to: {new_deadline}")
        
        if new_hours_per_day:
            adjusted_plan["preferred_hours_per_day"] = float(new_hours_per_day)
            logger.info(f"   Updated hours per day to: {new_hours_per_day}")
        
        if focus_topics:
            # Re-prioritize based on focus topics
            sessions = adjusted_plan.get("sessions", [])
            focused_sessions = []
            other_sessions = []
            
            for session in sessions:
                if any(focus_topic.lower() in session.get("topic", "").lower() for focus_topic in focus_topics):
                    focused_sessions.append(session)
                else:
                    other_sessions.append(session)
            
            # Put focused sessions first
            adjusted_plan["sessions"] = focused_sessions + other_sessions
            logger.info(f"   Prioritized {len(focused_sessions)} sessions for focus topics")
        
        return {
            "success": True,
            "adjusted_plan": adjusted_plan,
            "adjustments_applied": {
                "deadline_changed": bool(new_deadline),
                "hours_changed": bool(new_hours_per_day),
                "topics_prioritized": len(focus_topics)
            }
        }, 200
        
    except Exception as e:
        logger.error(f"   Plan adjustment failed: {e}")
        raise ApiError("PLAN_500", f"Failed to adjust plan: {str(e)}")
