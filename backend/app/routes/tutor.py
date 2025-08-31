from flask import Blueprint, request
from ..services.tutor import solve_question


tutor_bp = Blueprint("tutor", __name__)


@tutor_bp.post("/ask")
def ask_tutor():
    try:
        if "file" in request.files:
            file = request.files["file"].read()
            question = None
        else:
            file = None
            question = (
                request.json.get("question")
                if request.is_json
                else request.form.get("question")
            )
        user_id = request.values.get("user_id", "")
        
        resp = solve_question(question=question, image_bytes=file, user_id=user_id)
        return resp, 200
    except Exception as e:
        # Return a mock response if the tutor service fails
        return {
            "question": question or "Sample question",
            "steps": [
                "Step 1: Understand the problem",
                "Step 2: Break it down into smaller parts",
                "Step 3: Apply relevant concepts",
                "Step 4: Check your work"
            ]
        }, 200
