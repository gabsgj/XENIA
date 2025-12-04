from flask import Blueprint, request
from ..errors import ApiError
from ..services.ingestion import handle_upload
from ..utils import normalize_user_id


ingest_bp = Blueprint("ingest", __name__)


def _extract_user_id() -> str:
    """Normalize user id acquisition: prefer X-User-Id header (objective A)."""
    hdr = (request.headers.get("X-User-Id") or "").strip()
    if hdr:
        return normalize_user_id(hdr)
    form_uid = (request.form.get("user_id") or "").strip()
    if form_uid:
        return normalize_user_id(form_uid)
    # Fallback: generate a stable anonymous ID for the session
    import uuid
    return str(uuid.uuid5(uuid.NAMESPACE_URL, "xenia-anonymous-upload"))


@ingest_bp.post("/syllabus")
def upload_syllabus():
    if "file" not in request.files:
        raise ApiError("SYLLABUS_INVALID_FORMAT", "No file provided", status=400)

    file = request.files["file"]
    raw_uid = _extract_user_id()
    data = handle_upload(file, user_id=raw_uid, artifact_type="syllabus")
    return data, 200


@ingest_bp.post("/assessment")
def upload_assessment():
    if "file" not in request.files:
        raise ApiError("ASSESSMENT_PARSE_FAIL", "No file provided", status=400)

    file = request.files["file"]
    raw_uid = _extract_user_id()
    data = handle_upload(file, user_id=raw_uid, artifact_type="assessment")
    return data, 200


@ingest_bp.post("/upload-document")
def upload_document():
    """General document upload endpoint that handles multiple files"""
    # Check if we have any files in the request
    files = []
    file_keys = [key for key in request.files.keys() if key.startswith('file')]
    
    if not file_keys and 'file' in request.files:
        # Single file upload
        files = [request.files['file']]
    elif file_keys:
        # Multiple files with file0, file1, etc. naming
        files = [request.files[key] for key in sorted(file_keys)]
    else:
        raise ApiError("DOCUMENT_INVALID_FORMAT", "No files provided", status=400)

    raw_uid = _extract_user_id()
    
    # For now, treat uploaded documents as syllabus by default
    # You can add logic here to determine document type based on filename, content, etc.
    results = []
    for file in files:
        if file and file.filename:
            try:
                data = handle_upload(file, user_id=raw_uid, artifact_type="syllabus")
                results.append({
                    "filename": file.filename,
                    "status": "success",
                    "data": data
                })
            except Exception as e:
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "error": str(e)
                })
    
    # If only one file, return the data directly for compatibility
    if len(results) == 1 and results[0]["status"] == "success":
        return results[0]["data"], 200
    
    return {"results": results}, 200


@ingest_bp.post("/upload-text")
def upload_text():
    """Upload text content for processing"""
    data = request.get_json()
    if not data or 'text' not in data:
        raise ApiError("TEXT_INVALID_FORMAT", "No text provided", status=400)

    text_content = data['text']
    title = data.get('title', 'Pasted Text Document')
    raw_uid = _extract_user_id()
    
    # Create a file-like object from text for processing
    import io
    text_bytes = text_content.encode('utf-8')
    
    # Create a mock file object that handle_upload can process
    class TextFile:
        def __init__(self, content: bytes, filename: str):
            self.content = content
            self.filename = filename
            self._pos = 0
            
        def read(self, size=-1):
            if size == -1:
                result = self.content[self._pos:]
                self._pos = len(self.content)
            else:
                result = self.content[self._pos:self._pos + size]
                self._pos += size
            return result
            
        def seek(self, pos, whence=0):
            if whence == 0:
                self._pos = pos
            elif whence == 1:
                self._pos += pos
            elif whence == 2:
                self._pos = len(self.content) + pos
                
        def tell(self):
            return self._pos
    
    text_file = TextFile(text_bytes, f"{title}.txt")
    
    # Process the text as a document
    result = handle_upload(text_file, user_id=raw_uid, artifact_type="syllabus")
    return result, 200
