from flask import Blueprint, request
from ..supabase_client import get_supabase


teacher_bp = Blueprint("teacher", __name__)


@teacher_bp.post("/tag")
def tag_topic():
    sb = get_supabase()
    data = request.json or {}
    sb.table("manual_tags").insert(data).execute()
    return {"ok": True}


@teacher_bp.get("/reports")
def get_reports():
    sb = get_supabase()
    class_id = request.args.get("class_id", "")
    reports = sb.table("reports").select("*").eq("class_id", class_id).execute().data or []
    return {"class_id": class_id, "reports": reports}
