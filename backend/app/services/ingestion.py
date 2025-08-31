import io
import os
import uuid
from typing import Dict
from PIL import Image
import pytesseract
from pdfminer.high_level import extract_text
import fitz  # PyMuPDF
from pdf2image import convert_from_bytes
from ..supabase_client import get_supabase
from .embeddings import embed_texts


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

    # Upload raw file to storage
    bucket = os.getenv("ARTIFACTS_BUCKET", "artifacts")
    object_path = f"{user_id}/{artifact_type}/{uuid.uuid4().hex}-{filename}"
    try:
        supabase.storage.from_(bucket).upload(object_path, data, {
            "contentType": mime
        })
    except Exception as e:
        # Attempt to auto-create the bucket when using a service role key
        try:
            supabase.storage.create_bucket(bucket, {
                "public": False,
                "file_size_limit": "50mb"
            })
            supabase.storage.from_(bucket).upload(object_path, data, {
                "contentType": mime
            })
        except Exception:
            raise

    # Store metadata + extracted text (and embedding if available)
    record = {
        "user_id": user_id,
        "artifact_type": artifact_type,
        "filename": filename,
        "storage_path": object_path,
        "mime_type": mime,
        "extracted_text": text,
    }
    vectors = embed_texts([text])
    if vectors and len(vectors) == 1:
        record["embedding"] = vectors[0]
    supabase.table("artifacts").insert(record).execute()

    return {"ok": True, "path": object_path, "chars": len(text)}
