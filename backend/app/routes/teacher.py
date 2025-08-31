from flask import Blueprint, request
from ..errors import ApiError
from ..supabase_client import get_supabase


teacher_bp = Blueprint("teacher", __name__)


@teacher_bp.post("/tag")
def tag_topic():
    sb = get_supabase()
    data = request.json or {}
    if not data.get("user_id"):
        raise ApiError("AUTH_401", "Missing user id")
    if not data.get("topic") or not data.get("tag"):
        raise ApiError("PLAN_400", "Missing topic or tag")
    sb.table("manual_tags").insert(data).execute()
    return {"ok": True}


@teacher_bp.get("/reports")
def get_reports():
    sb = get_supabase()
    class_id = request.args.get("class_id", "")
    if not class_id:
        raise ApiError("CONTENT_NOT_FOUND", "Missing class_id")
    reports = sb.table("reports").select("*").eq("class_id", class_id).execute().data or []
    return {"class_id": class_id, "reports": reports}
