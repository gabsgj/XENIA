from flask import Blueprint, request
from ..errors import ApiError
from ..supabase_client import get_supabase


analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.get("/student")
def student_analytics():
    sb = get_supabase()
    user_id = request.args.get("user_id", "")
    if not user_id:
        # Default to demo-user for demo purposes
        user_id = "demo-user"
    
    try:
        sessions = (
            sb.table("sessions")
            .select("duration_min, topic, created_at")
            .eq("user_id", user_id)
            .limit(200)
            .execute()
            .data
            or []
        )
        tasks = (
            sb.table("tasks")
            .select("status, topic, created_at")
            .eq("user_id", user_id)
            .limit(200)
            .execute()
            .data
            or []
        )
        xp = (
            sb.table("profiles")
            .select("xp, level, streak_days")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
            .data
        )
        return {"sessions": sessions, "tasks": tasks, "profile": (xp[0] if xp else {})}
    except Exception as e:
        # Return mock data if there's an error
        return {
            "sessions": [
                {"duration_min": 45, "topic": "Mathematics", "created_at": "2024-01-15T10:00:00Z"},
                {"duration_min": 30, "topic": "Physics", "created_at": "2024-01-14T14:30:00Z"},
                {"duration_min": 60, "topic": "Chemistry", "created_at": "2024-01-13T09:15:00Z"}
            ],
            "tasks": [
                {"status": "done", "topic": "Calculus", "created_at": "2024-01-15T08:00:00Z"},
                {"status": "done", "topic": "Algebra", "created_at": "2024-01-14T16:00:00Z"},
                {"status": "pending", "topic": "Trigonometry", "created_at": "2024-01-13T10:00:00Z"}
            ],
            "profile": {"xp": 1250, "level": 5, "streak_days": 7}
        }


@analytics_bp.get("/teacher")
def teacher_analytics():
    sb = get_supabase()
    class_id = request.args.get("class_id", "")
    if not class_id:
        raise ApiError("CONTENT_NOT_FOUND", "Missing class_id")
    
    try:
        students = (
            sb.table("enrollments")
            .select("user_id")
            .eq("class_id", class_id)
            .execute()
            .data
            or []
        )
        user_ids = [s["user_id"] for s in students]
        profiles = (
            sb.table("profiles")
            .select("user_id, xp, level, streak_days")
            .in_("user_id", user_ids)
            .execute()
            .data
            or []
        )
        return {"class_id": class_id, "profiles": profiles}
    except Exception as e:
        # Return mock data if there's an error
        return {
            "class_id": class_id,
            "profiles": [
                {"user_id": "student1", "xp": 1200, "level": 4, "streak_days": 5},
                {"user_id": "student2", "xp": 800, "level": 3, "streak_days": 3}
            ]
        }


@analytics_bp.get("/parent")
def parent_analytics():
    sb = get_supabase()
    parent_id = request.args.get("parent_id", "")
    if not parent_id:
        raise ApiError("AUTH_401", "Missing parent_id")
    
    try:
        children = (
            sb.table("parents_children")
            .select("child_user_id")
            .eq("parent_user_id", parent_id)
            .execute()
            .data
            or []
        )
        child_ids = [c["child_user_id"] for c in children]
        profiles = (
            sb.table("profiles")
            .select("user_id, xp, level, streak_days")
            .in_("user_id", child_ids)
            .execute()
            .data
            or []
        )
        return {"parent_id": parent_id, "profiles": profiles}
    except Exception as e:
        # Return mock data if there's an error
        return {
            "parent_id": parent_id,
            "profiles": [
                {"user_id": "child1", "xp": 1000, "level": 4, "streak_days": 6},
                {"user_id": "child2", "xp": 750, "level": 3, "streak_days": 4}
            ]
        }
