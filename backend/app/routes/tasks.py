from flask import Blueprint, request
from ..errors import ApiError
from ..supabase_client import get_supabase
from datetime import datetime


tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.post("/track")
def track_session():
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    if not data.get("user_id"):
        raise ApiError("AUTH_401", "Missing user id")
    if not data.get("topic"):
        raise ApiError("PLAN_400", "Missing topic")
    data["created_at"] = datetime.utcnow().isoformat()
    sb.table("sessions").insert(data).execute()
    # XP mechanic: +10 per 30 min
    minutes = int(data.get("duration_min", 30))
    xp = max(5, (minutes // 30) * 10)
    sb.rpc("add_xp", {"p_user_id": data.get("user_id"), "p_xp": xp}).execute()
    return {"ok": True, "awarded_xp": xp}


@tasks_bp.post("/complete")
def complete_task():
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    task_id = data.get("task_id")
    if not task_id:
        raise ApiError("PLAN_400", "Missing task_id")
    sb.table("tasks").update({"status": "done"}).eq("id", task_id).execute()
    sb.rpc("add_xp", {"p_user_id": data.get("user_id"), "p_xp": 20}).execute()
    return {"ok": True}
