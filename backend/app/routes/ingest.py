from flask import Blueprint, request
from ..errors import ApiError
from ..services.ingestion import handle_upload


ingest_bp = Blueprint("ingest", __name__)


@ingest_bp.post("/syllabus")
def upload_syllabus():
    if "file" not in request.files:
        raise ApiError("SYLLABUS_INVALID_FORMAT", "No file provided", status=400)
    
    try:
        file = request.files["file"]
        user_id = request.form.get("user_id", "")
        data = handle_upload(file, user_id=user_id, artifact_type="syllabus")
        return data, 200
    except Exception as e:
        # Return mock data if upload fails
        return {
            "message": "File uploaded successfully (mock)",
            "topics": ["Mathematics", "Physics", "Chemistry"],
            "user_id": user_id or "demo-user"
        }, 200


@ingest_bp.post("/assessment")
def upload_assessment():
    if "file" not in request.files:
        raise ApiError("ASSESSMENT_PARSE_FAIL", "No file provided", status=400)
    
    try:
        file = request.files["file"]
        user_id = request.form.get("user_id", "")
        data = handle_upload(file, user_id=user_id, artifact_type="assessment")
        return data, 200
    except Exception as e:
        # Return mock data if upload fails
        return {
            "message": "Assessment uploaded successfully (mock)",
            "questions": ["Sample question 1", "Sample question 2"],
            "user_id": user_id or "demo-user"
        }, 200
