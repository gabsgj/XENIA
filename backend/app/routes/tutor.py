from flask import Blueprint, request
from ..services.tutor import solve_question


tutor_bp = Blueprint('tutor', __name__)


@tutor_bp.post('/ask')
def ask_tutor():
    if 'file' in request.files:
        file = request.files['file'].read()
        question = None
    else:
        file = None
        question = request.json.get('question') if request.is_json else request.form.get('question')
    user_id = request.values.get('user_id', '')
    resp = solve_question(question=question, image_bytes=file, user_id=user_id)
    return resp, 200
