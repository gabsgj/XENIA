from flask import Blueprint, request
from ..errors import ApiError
from ..services.ingestion import handle_upload

upload_bp = Blueprint("upload", __name__)


def _extract_user_id() -> str:
    """Normalize user id acquisition: prefer X-User-Id header."""
    hdr = (request.headers.get("X-User-Id") or "").strip()
    if hdr:
        return hdr
    return (request.form.get("user_id") or "").strip()


@upload_bp.post("/syllabus")
def upload_syllabus():
    """Upload syllabus endpoint expected by tests"""
    if "file" not in request.files:
        raise ApiError("SYLLABUS_INVALID_FORMAT", "No file provided", status=400)

    file = request.files["file"]
    raw_uid = _extract_user_id()
    data = handle_upload(file, user_id=raw_uid, artifact_type="syllabus")
    return data, 200


@upload_bp.post("/assessment")
def upload_assessment():
    """Upload assessment endpoint expected by tests"""
    if "file" not in request.files:
        raise ApiError("ASSESSMENT_PARSE_FAIL", "No file provided", status=400)

    file = request.files["file"]
    raw_uid = _extract_user_id()
    data = handle_upload(file, user_id=raw_uid, artifact_type="assessment")
    return data, 200