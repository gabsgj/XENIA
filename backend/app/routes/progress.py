from flask import Blueprint, request, jsonify
from ..utils import normalize_user_id
from ..services.progress import get_user_progress

progress_bp = Blueprint("progress", __name__)

@progress_bp.get("/user/<user_id>")
def get_progress_api(user_id):
    user_id = normalize_user_id(user_id)
    progress = get_user_progress(user_id)
    return jsonify({"success": True, "progress": progress})
