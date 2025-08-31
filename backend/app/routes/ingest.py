from flask import Blueprint, request
from ..errors import ApiError
from ..services.ingestion import handle_upload


ingest_bp = Blueprint('ingest', __name__)


@ingest_bp.post('/syllabus')
def upload_syllabus():
    if 'file' not in request.files:
        raise ApiError('SYLLABUS_INVALID_FORMAT', 'No file provided', status=400)
    file = request.files['file']
    user_id = request.form.get('user_id', '')
    data = handle_upload(file, user_id=user_id, artifact_type='syllabus')
    return data, 200


@ingest_bp.post('/assessment')
def upload_assessment():
    if 'file' not in request.files:
        raise ApiError('ASSESSMENT_PARSE_FAIL', 'No file provided', status=400)
    file = request.files['file']
    user_id = request.form.get('user_id', '')
    data = handle_upload(file, user_id=user_id, artifact_type='assessment')
    return data, 200
