import io
import os
import uuid
from typing import Dict
from PIL import Image
import pytesseract
from pdfminer.high_level import extract_text
from pdf2image import convert_from_bytes
from ..supabase_client import get_supabase
from .embeddings import embed_texts
from .ai_mock import get_mock_provider, is_mock_enabled


def _extract_text_from_pdf(pdf_bytes: bytes) -> str:
    try:
        text = extract_text(io.BytesIO(pdf_bytes))
        if text and text.strip():
            return text
    except Exception:
        pass
    # Fallback to OCR via images
    images = convert_from_bytes(pdf_bytes)
    extracted = []
    for img in images:
        extracted.append(pytesseract.image_to_string(img))
    return "\n".join(extracted)


def _extract_text_from_image(file_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(image)


def _detect_mimetype(filename: str) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return "application/pdf"
    if lower.endswith((".png", ".jpg", ".jpeg", ".bmp", ".tiff")):
        return "image/*"
    return "text/plain"


def handle_upload(file_storage, user_id: str, artifact_type: str) -> Dict:
    supabase = get_supabase()
    filename = file_storage.filename or f"upload-{uuid.uuid4().hex}"
    data = file_storage.read()
    mime = _detect_mimetype(filename)

    # Extract text
    if mime == "application/pdf":
        text = _extract_text_from_pdf(data)
    elif mime == "image/*":
        text = _extract_text_from_image(data)
    else:
        text = data.decode("utf-8", errors="ignore")

    # Upload raw file to storage (mock-friendly)
    bucket = os.getenv("ARTIFACTS_BUCKET", "artifacts")
    object_path = f"{user_id}/{artifact_type}/{uuid.uuid4().hex}-{filename}"
    try:
        supabase.storage.from_(bucket).upload(object_path, data, {"contentType": mime})
    except Exception:
        try:
            supabase.storage.create_bucket(bucket, {"public": False, "file_size_limit": "50mb"})
            supabase.storage.from_(bucket).upload(object_path, data, {"contentType": mime})
        except Exception:
            # In strict environments without storage API, continue if mock mode
            if not is_mock_enabled():
                raise

    # Store metadata + extracted text (and embedding if available)
    record = {
        "user_id": user_id or "demo-user",
        "artifact_type": artifact_type,
        "filename": filename,
        "storage_path": object_path,
        "mime_type": mime,
        "extracted_text": text,
    }
    vectors = embed_texts([text]) or []
    if vectors and len(vectors) == 1:
        record["embedding"] = vectors[0]
    try:
        supabase.table("artifacts").insert(record).execute()
    except Exception:
        # Ignore DB insert failures in mock mode
        if not is_mock_enabled():
            raise

    # Return AI analysis for frontend
    analysis = None
    try:
        if is_mock_enabled():
            mock = get_mock_provider()
            if artifact_type == "syllabus":
                analysis = mock.analyze_syllabus(text)
            elif artifact_type == "assessment":
                analysis = mock.analyze_assessment(text)
        else:
            # Use real AI analysis when not in mock mode
            from .ai_providers import get_syllabus_analysis, get_assessment_analysis
            if artifact_type == "syllabus":
                analysis = get_syllabus_analysis(text)
            elif artifact_type == "assessment":
                analysis = get_assessment_analysis(text)
    except Exception as e:
        print(f"Analysis error: {e}")
        analysis = None

    return {"ok": True, "path": object_path, "chars": len(text), "analysis": analysis}
