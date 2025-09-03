from flask import Blueprint, request
from ..errors import ApiError

from ..services.tutor import solve_question


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

    user_id = request.values.get("user_id", "")

    resp = solve_question(question=question, image_bytes=file, user_id=user_id)
    return resp, 200
