from flask import Blueprint, request
from ..errors import ApiError
from ..utils import get_user_id_from_request
from ..services.ingestion import handle_upload
import logging

logger = logging.getLogger('xenia')
upload_bp = Blueprint("upload", __name__)


def _extract_user_id() -> str:
    """Extract and validate user id from request."""
    uid = get_user_id_from_request(request)
    if not uid:
        logger.error("   Missing or invalid user_id in upload request")
        raise ApiError("UPLOAD_400", "Missing or invalid user_id in request", status=400)
    logger.info(f"   Extracted user_id: {uid}")
    return uid


@upload_bp.post("/syllabus")
def upload_syllabus():
    """Upload syllabus endpoint expected by tests"""
    logger.info("📚 Syllabus upload endpoint called")
    if "file" not in request.files:
        logger.error("   No file provided in syllabus upload")
        raise ApiError("SYLLABUS_INVALID_FORMAT", "No file provided", status=400)

    file = request.files["file"]
    raw_uid = _extract_user_id()
    logger.info(f"   Processing syllabus upload for user {raw_uid}, filename: {file.filename}")
    data = handle_upload(file, user_id=raw_uid, artifact_type="syllabus")
    logger.info(f"   Syllabus upload completed for user {raw_uid}")
    return data, 200


@upload_bp.post("/assessment")
def upload_assessment():
    """Upload assessment endpoint expected by tests"""
    logger.info("📝 Assessment upload endpoint called")
    if "file" not in request.files:
        logger.error("   No file provided in assessment upload")
        raise ApiError("ASSESSMENT_PARSE_FAIL", "No file provided", status=400)

    file = request.files["file"]
    raw_uid = _extract_user_id()
    logger.info(f"   Processing assessment upload for user {raw_uid}, filename: {file.filename}")
    data = handle_upload(file, user_id=raw_uid, artifact_type="assessment")
    logger.info(f"   Assessment upload completed for user {raw_uid}")
    return data, 200