import io
import os
import uuid
from typing import Dict
from PIL import Image
import pytesseract
from pdfminer.high_level import extract_text
from pdf2image import convert_from_bytes
from ..supabase_client import get_supabase
from ..utils import normalize_user_id, is_valid_uuid
from .topic_store import add_topics as store_add_topics
from .embeddings import embed_texts
from .weaktopics import extract_topics_from_text
from .resources import fetch_and_store_resources_for_topics
from .planning import generate_plan  # for plan preview after topic ingestion


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
    raw_user_id = user_id
    norm_user_id = normalize_user_id(raw_user_id)
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
            # Ignore storage errors in demo mode
            pass

    # Store metadata + extracted text (and embedding if available)
    record = {
        "user_id": norm_user_id if is_valid_uuid(norm_user_id) else None,
        "artifact_type": artifact_type,
        "filename": filename,
        "storage_path": object_path,
        "mime_type": mime,
        "extracted_text": text,
    }
    vectors = embed_texts([text]) or []
    if vectors and len(vectors) == 1:
        record["embedding"] = vectors[0]
    artifact_id = None
    if record["user_id"]:
        try:
            insert_resp = supabase.table("artifacts").insert(record).execute()
            if getattr(insert_resp, "data", None):
                try:
                    artifact_id = insert_resp.data[0]["id"]
                except Exception:
                    artifact_id = None
        except Exception as e:
            # Foreign key violation or other error -> treat as demo (suppress further DB writes)
            fk_like = 'foreign key' in str(e).lower() or '23503' in str(e)
            print(f"Artifact insert failed: {e}")
            if fk_like:
                record["user_id"] = None

    topics = []
    if artifact_type == "syllabus":
        # Extract topics heuristically first
        topics = extract_topics_from_text(text)
        # Persist topics
        rows = []
        for idx, t in enumerate(topics):
            rows.append({
                "user_id": norm_user_id if is_valid_uuid(norm_user_id) else None,
                "topic": t,
                "order_index": idx,
                "source_artifact": artifact_id,
            })
        if rows and is_valid_uuid(norm_user_id) and record.get("user_id"):
            try:
                supabase.table("syllabus_topics").insert(rows).execute()
            except Exception as e:
                print(f"Topic insert failed: {e}")
                # Fallback to in-memory if constraint issues
                store_add_topics(norm_user_id, topics)
        else:
            store_add_topics(norm_user_id, topics)
        # Fetch resources asynchronously (best-effort)
        # Only attempt DB resource persistence if we have a valid/persistable user
        if is_valid_uuid(norm_user_id) and record.get("user_id"):
            try:
                fetch_and_store_resources_for_topics(norm_user_id, topics[:25])
            except Exception as e:
                print(f"Resource fetch error: {e}")

        # Optional AI enrichment of topic difficulty
        try:
            from .ai_providers import get_syllabus_analysis
            analysis = get_syllabus_analysis("\n".join(topics)[:6000])
        except Exception:
            analysis = {"topics": [{"topic": t, "score": 5} for t in topics[:50]]}
    elif artifact_type == "assessment":
        try:
            from .ai_providers import get_assessment_analysis
            analysis = get_assessment_analysis(text[:6000])
        except Exception:
            analysis = {}
    else:
        analysis = {}

    plan_preview = None
    try:
        # Always build dynamic plan preview (objective B & C)
        plan_preview = generate_plan(norm_user_id)
    except Exception:
        plan_preview = None

    return {
        "ok": True,
        "path": object_path,
        "chars": len(text),
        "topics": topics,
        "analysis": analysis,
        "plan_preview": plan_preview,
    }
