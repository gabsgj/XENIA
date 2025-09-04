from flask import Blueprint, request
from ..errors import ApiError

from ..services.tutor import solve_question
from ..utils import normalize_user_id, is_valid_uuid
from ..services.tutor_storage import fetch_history


tutor_bp = Blueprint("tutor", __name__)


@tutor_bp.post("/ask")
def ask_tutor():
    if "file" in request.files:
        file = request.files["file"].read()
        question = None
    else:
        file = None
        question = (
            request.get_json(silent=True).get("question")
            if request.is_json
            else request.form.get("question")
        )
    if not question and not file:
        raise ApiError("TUTOR_TIMEOUT", "No input provided to tutor", status=400)

    raw_user_id = request.headers.get("X-User-Id", "") or request.values.get("user_id", "")
    user_id = normalize_user_id(raw_user_id) if raw_user_id else ""

    resp = solve_question(question=question, image_bytes=file, user_id=user_id)
    return resp, 200


@tutor_bp.get("/history")
def tutor_history():
    raw_user_id = request.headers.get("X-User-Id", "") or request.values.get("user_id", "")
    if not raw_user_id:
        return {"history": []}, 200
    user_id = normalize_user_id(raw_user_id)
    if not is_valid_uuid(user_id):
        return {"history": []}, 200
    hist = fetch_history(user_id)
    return {"history": hist}, 200
