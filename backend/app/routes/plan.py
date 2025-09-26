import logging
from flask import Blueprint, request
from ..utils import get_user_id_from_request
from ..errors import ApiError
from ..services.planning import generate_plan, get_current_plan
from ..services.plan_regeneration import PlanRegenerationService
from ..services.progress import get_user_progress
from ..services.weaktopics import analyze_weak_topics
from ..supabase_client import get_supabase

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
        logger.error("   Missing user_id in request")
        raise ApiError("PLAN_400", "Missing user_id")
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
        # enrich with persisted user progress if available
        user_progress = get_user_progress(uid)
        # Estimate total hours completed
        total_minutes_completed = sum(s.get('duration_min', 0) for s in sessions if s.get('status') == 'completed')
        total_hours_completed = round(total_minutes_completed / 60.0, 2)

        weak_topics = analyze_weak_topics(user_progress)

        plan["progress"] = {
            "sessions_completed": completed,
            "sessions_in_progress": in_progress,
            "percent_complete": round(completed / total * 100, 2),
            "total_hours_completed": total_hours_completed,
            "completed_topics": list(user_progress.keys()),
            "weak_topics": weak_topics
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
    uid = get_user_id_from_request(request) or ""
    if not uid:
        logger.error("   Missing user_id in request")
        raise ApiError("PLAN_400", "Missing user_id")
    
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

        # If the provider returned an explanatory message (connectivity / API key issues)
        # it may be embedded inside the returned resources object (e.g. resources['final_answer']).
        # Normalize that into a top-level `final_answer` field and return an empty resources map
        # so the frontend can detect and surface the message instead of treating it as resource data.
        try:
            if isinstance(resources, dict) and (resources.get('final_answer') or resources.get('error') or resources.get('message')):
                msg = resources.get('final_answer') or resources.get('error') or resources.get('message')
                logger.warning(f"   AI provider returned explanatory message for topic {topic}: {msg}")
                return {
                    "success": False,
                    "topic": topic,
                    "final_answer": msg,
                    "resources": {}
                }, 200
        except Exception:
            # If any unexpected shape, fall back to returning the raw resources
            logger.debug(f"   Unable to normalize resources for topic {topic}, returning as-is")

        logger.info(f"   Found resources for {topic}: {len(resources.get('youtube_videos', [])) if isinstance(resources, dict) else (len(resources) if hasattr(resources, '__len__') else 0)} items")

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
    uid = get_user_id_from_request(request) or ""
    if not uid:
        raise ApiError("PLAN_400", "Missing user_id")
    
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


@plan_bp.post('/regenerate')
def regenerate():
    """Regenerate a study plan given a new deadline and options. Preserves completed progress when requested."""
    logger.info("🔁 Regenerate plan endpoint called")
    uid = get_user_id_from_request(request) or ""
    if not uid:
        logger.error("   Missing user_id in request")
        raise ApiError("PLAN_400", "Missing user_id")

    try:
        data = request.get_json() or {}
        plan_id = data.get('plan_id')
        new_deadline = data.get('new_deadline')
        preserve_progress = bool(data.get('preserve_progress', True))
        priority_adjustment = data.get('priority_adjustment')
        learning_pace = data.get('learning_pace')
        excluded_topics = data.get('excluded_topics', []) or []

        if not new_deadline:
            raise ApiError('PLAN_400', 'new_deadline is required')

        # Basic validation: deadline must be a future date
        from datetime import datetime, date
        try:
            nd = datetime.strptime(new_deadline, '%Y-%m-%d').date()
        except Exception:
            raise ApiError('PLAN_400', 'new_deadline must be YYYY-MM-DD')

        if nd <= date.today():
            raise ApiError('PLAN_400', 'Deadline must be in the future')

        # Fetch current plan (by id or current user plan)
        if plan_id:
            current_plan = get_current_plan(uid, plan_id=plan_id)
        else:
            current_plan = get_current_plan(uid)

        if not current_plan:
            raise ApiError('PLAN_404', 'No current plan found')

        # Fetch syllabus topics to ensure regeneration only includes syllabus topics
        from ..utils import is_valid_uuid
        from ..services.topic_store import get_topics as store_get_topics
        
        syllabus_topic_names = set()
        if not is_valid_uuid(uid):
            # Development mode: get from in-memory store
            syllabus_topics = store_get_topics(uid)
            syllabus_topic_names = set(syllabus_topics)
        else:
            # Production mode: get from Supabase
            sb = get_supabase()
            try:
                from ..supabase_client import supabase_call
                resp = supabase_call(lambda: sb.table("syllabus_topics").select("topic").eq("user_id", uid).execute())
                if resp.data:
                    syllabus_topic_names = set([t["topic"] for t in resp.data])
            except Exception as e:
                logger.warning(f"Failed to fetch syllabus topics from Supabase: {e}")
                # Fallback to current plan topics
                syllabus_topic_names = set([s.get('topic') for s in current_plan.get('sessions', []) if s.get('topic')])

        # If we have syllabus topics, filter the current plan to only include syllabus topics
        if syllabus_topic_names:
            filtered_sessions = []
            for session in current_plan.get('sessions', []):
                if session.get('topic') in syllabus_topic_names:
                    filtered_sessions.append(session)
            current_plan['sessions'] = filtered_sessions

        # Build service and run regeneration
        service = PlanRegenerationService(gemini_client=None, supabase_client=None)
        regenerated = service.regenerate_with_deadline(
            current_plan=current_plan,
            new_deadline=nd,
            preserve_progress=preserve_progress,
            priority_adjustment=priority_adjustment,
            learning_pace=learning_pace,
            excluded_topics=excluded_topics
        )

        return { 'success': True, 'data': { 'regenerated_plan': regenerated, 'changes_summary': regenerated.get('changes_summary') } }, 200

    except ApiError:
        raise
    except Exception as e:
        logger.error(f'   Regeneration failed: {e}')
        raise ApiError('PLAN_500', f'Failed to regenerate plan: {str(e)}')


@plan_bp.post('/check-deadline-feasibility')
def check_deadline_feasibility():
    """Check whether a proposed deadline is feasible given current progress."""
    logger.info('🧭 Check deadline feasibility called')
    uid = get_user_id_from_request(request) or ""
    if not uid:
        raise ApiError('PLAN_400', 'Missing user_id')

    try:
        data = request.get_json() or {}
        new_deadline = data.get('new_deadline')
        plan_id = data.get('plan_id')

        if not new_deadline:
            raise ApiError('PLAN_400', 'new_deadline is required')

        from datetime import datetime, date, timedelta
        try:
            nd = datetime.strptime(new_deadline, '%Y-%m-%d').date()
        except Exception:
            raise ApiError('PLAN_400', 'new_deadline must be YYYY-MM-DD')

        # Load plan
        if plan_id:
            plan = get_current_plan(uid, plan_id=plan_id)
        else:
            plan = get_current_plan(uid)

        if not plan:
            raise ApiError('PLAN_404', 'No current plan found')

        # Estimate remaining workload (hours)
        sessions = plan.get('sessions', [])
        remaining_minutes = sum([s.get('duration_min', 0) for s in sessions if s.get('status') != 'completed'])
        remaining_hours = remaining_minutes / 60.0

        # Available time
        today = date.today()
        days_available = max(1, (nd - today).days)
        # Assume user can study at least 0.5 hours/day by default
        estimated_hours_per_day = remaining_hours / days_available

        # Simple confidence estimation
        feasible = estimated_hours_per_day <= 6  # arbitrary cap
        # Suggest alternate deadline if not feasible (extend to fit 2 hours/day)
        suggested_days = int((remaining_hours / 2.0) + 0.9999)
        suggested_deadline = today + timedelta(days=suggested_days)

        result = {
            'feasible': feasible,
            'estimated_hours_per_day': round(estimated_hours_per_day, 2),
            'suggested_deadline': suggested_deadline.isoformat(),
            'confidence_level': 0.8 if feasible else 0.35
        }

        return result, 200

    except ApiError:
        raise
    except Exception as e:
        logger.error(f'   Deadline check failed: {e}')
        raise ApiError('PLAN_500', f'Failed to check deadline: {str(e)}')
