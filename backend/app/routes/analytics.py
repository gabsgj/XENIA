import logging
from flask import Blueprint, request
from ..errors import ApiError
from ..supabase_client import get_supabase
from ..utils import normalize_user_id, is_valid_uuid
import datetime
from typing import List, Dict

logger = logging.getLogger('xenia')
analytics_bp = Blueprint("analytics", __name__)


def generate_weekly_progress(sessions: List[Dict], tasks: List[Dict]) -> List[Dict]:
    """Generate weekly progress data for charts."""
    from collections import defaultdict
    
    weekly_data = defaultdict(lambda: {"study_time": 0, "completion": 0, "sessions": 0, "completed_tasks": 0, "total_tasks": 0})
    
    # Process sessions
    for session in sessions:
        try:
            date = datetime.datetime.fromisoformat(session.get("created_at", "").replace("Z", "+00:00"))
            week_key = f"Week {date.isocalendar()[1]}"
            weekly_data[week_key]["study_time"] += session.get("duration_min", 0)
            weekly_data[week_key]["sessions"] += 1
        except:
            continue
    
    # Process tasks
    for task in tasks:
        try:
            date = datetime.datetime.fromisoformat(task.get("created_at", "").replace("Z", "+00:00"))
            week_key = f"Week {date.isocalendar()[1]}"
            weekly_data[week_key]["total_tasks"] += 1
            if task.get("status") == "completed":
                weekly_data[week_key]["completed_tasks"] += 1
        except:
            continue
    
    # Calculate completion rates and format data
    result = []
    for week, data in sorted(weekly_data.items()):
        completion = (data["completed_tasks"] / data["total_tasks"] * 100) if data["total_tasks"] > 0 else 0
        result.append({
            "week": week,
            "study_time": data["study_time"],
            "completion": round(completion, 1),
            "sessions": data["sessions"]
        })
    
    return result[-4:]  # Return last 4 weeks


def calculate_subject_performance(sessions: List[Dict], tasks: List[Dict]) -> List[Dict]:
    """Calculate performance breakdown by subject."""
    from collections import defaultdict
    
    subject_data = defaultdict(lambda: {"sessions": 0, "total_time": 0, "completed_tasks": 0, "total_tasks": 0})
    
    # Process sessions
    for session in sessions:
        topic = session.get("topic", "Unknown")
        subject = extract_subject_from_topic(topic)
        subject_data[subject]["sessions"] += 1
        subject_data[subject]["total_time"] += session.get("duration_min", 0)
    
    # Process tasks
    for task in tasks:
        topic = task.get("topic", "Unknown")
        subject = extract_subject_from_topic(topic)
        subject_data[subject]["total_tasks"] += 1
        if task.get("status") == "completed":
            subject_data[subject]["completed_tasks"] += 1
    
    # Format results
    result = []
    for subject, data in subject_data.items():
        if data["sessions"] > 0 or data["total_tasks"] > 0:
            avg_time = data["total_time"] / data["sessions"] if data["sessions"] > 0 else 0
            completion = (data["completed_tasks"] / data["total_tasks"] * 100) if data["total_tasks"] > 0 else 0
            
            # Determine difficulty based on completion rate and session length
            difficulty = "Easy"
            if completion < 70 or avg_time > 60:
                difficulty = "Hard"
            elif completion < 85 or avg_time > 45:
                difficulty = "Medium"
            
            result.append({
                "subject": subject,
                "sessions": data["sessions"],
                "avg_time": round(avg_time, 1),
                "completion": round(completion, 1),
                "difficulty": difficulty
            })
    
    return sorted(result, key=lambda x: x["sessions"], reverse=True)


def extract_subject_from_topic(topic: str) -> str:
    """Extract subject name from topic string."""
    topic_lower = topic.lower()
    
    # Subject mapping
    subjects = {
        "math": ["math", "calculus", "algebra", "geometry", "trigonometry", "statistics"],
        "chemistry": ["chemistry", "organic", "inorganic", "biochemistry", "molecules"],
        "physics": ["physics", "mechanics", "thermodynamics", "electromagnetism", "quantum"],
        "biology": ["biology", "anatomy", "genetics", "ecology", "botany", "zoology"],
        "english": ["english", "literature", "writing", "grammar", "poetry"],
        "history": ["history", "historical", "ancient", "modern", "civilization"],
        "science": ["science", "scientific", "laboratory", "experiment"]
    }
    
    for subject, keywords in subjects.items():
        if any(keyword in topic_lower for keyword in keywords):
            return subject.title()
    
    return "General"


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
    """Return comprehensive per-student analytics with gamification data.

    Query param: user_id (optional) or X-User-Id header.
    """
    logger.info("📊 Student analytics endpoint called")
    from ..services.gamification import get_study_stats, recompute_level, check_achievements, generate_progress_insights
    
    sb = get_supabase()
    raw_user_id = request.args.get("user_id") or request.headers.get("X-User-Id") or ""
    user_id = normalize_user_id(raw_user_id) if raw_user_id else ""
    logger.debug(f"analytics.student raw={raw_user_id} normalized={user_id}")

    sessions = []
    tasks = []
    profile = {}
    
    if not user_id:
        raise ApiError("AUTH_401", "Missing user_id")

    try:
        sessions_resp = (
            sb.table("sessions")
            .select("duration_min, topic, created_at, status")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )
        sessions = sessions_resp.data or []
    except Exception as e:
        logger.warning(f"sessions fetch failed: {e}")

    try:
        tasks_resp = (
            sb.table("tasks")
            .select("status, topic, created_at, difficulty, priority")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )
        tasks = tasks_resp.data or []
    except Exception as e:
        logger.warning(f"tasks fetch failed: {e}")

    try:
        prof_resp = (
            sb.table("profiles")
            .select("xp, level, streak_days, achievements, preferences")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        prof_data = prof_resp.data or []
        profile = prof_data[0] if prof_data else {}
    except Exception as e:
        logger.warning(f"profile fetch failed: {e}")

    # Calculate comprehensive statistics
    stats = get_study_stats(sessions, tasks)
    
    # Recalculate level from current XP
    xp = profile.get("xp", 0)
    level_data = recompute_level(xp)
    
    # Check for new achievements
    user_data = {**profile, **stats}
    new_achievements = check_achievements(user_data)
    
    # Generate insights
    insights = generate_progress_insights(user_data, stats)
    
    # Prepare weekly progress data for charts
    weekly_data = generate_weekly_progress(sessions, tasks)
    
    # Subject performance breakdown
    subject_stats = calculate_subject_performance(sessions, tasks)

    return {
        "sessions": sessions,
        "tasks": tasks,
        "profile": {**profile, **level_data},
        "stats": stats,
        "insights": insights,
        "achievements": new_achievements,
        "weekly_progress": weekly_data,
        "subject_performance": subject_stats,
        "user_id": user_id
    }


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
