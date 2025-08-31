from flask import Blueprint, request
from ..errors import ApiError
from ..supabase_client import get_supabase


analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.get("/student")
def student_analytics():
    sb = get_supabase()
    user_id = request.args.get("user_id", "")
    if not user_id:
        raise ApiError("AUTH_401", "Missing user id")
    sessions = sb.table("sessions").select("duration_min, topic, created_at").eq("user_id", user_id).limit(200).execute().data or []
    tasks = sb.table("tasks").select("status, topic, created_at").eq("user_id", user_id).limit(200).execute().data or []
    xp = sb.table("profiles").select("xp, level, streak_days").eq("user_id", user_id).limit(1).execute().data
    return {"sessions": sessions, "tasks": tasks, "profile": (xp[0] if xp else {})}


@analytics_bp.get("/teacher")
def teacher_analytics():
    sb = get_supabase()
    class_id = request.args.get("class_id", "")
    if not class_id:
        raise ApiError("CONTENT_NOT_FOUND", "Missing class_id")
    students = sb.table("enrollments").select("user_id").eq("class_id", class_id).execute().data or []
    user_ids = [s["user_id"] for s in students]
    profiles = sb.table("profiles").select("user_id, xp, level, streak_days").in_("user_id", user_ids).execute().data or []
    return {"class_id": class_id, "profiles": profiles}


@analytics_bp.get("/parent")
def parent_analytics():
    sb = get_supabase()
    parent_id = request.args.get("parent_id", "")
    if not parent_id:
        raise ApiError("AUTH_401", "Missing parent_id")
    children = sb.table("parents_children").select("child_user_id").eq("parent_user_id", parent_id).execute().data or []
    child_ids = [c["child_user_id"] for c in children]
    profiles = sb.table("profiles").select("user_id, xp, level, streak_days").in_("user_id", child_ids).execute().data or []
    return {"parent_id": parent_id, "profiles": profiles}
