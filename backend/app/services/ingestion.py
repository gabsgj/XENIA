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
from .ai_providers import extract_topics_with_gemini, filter_syllabus_content
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
    print(f"🔄 Processing upload for user {raw_user_id} -> normalized to {norm_user_id}")
    supabase = get_supabase()
    filename = file_storage.filename or f"upload-{uuid.uuid4().hex}"
    data = file_storage.read()
    mime = _detect_mimetype(filename)

    # Extract text
    if mime == "application/pdf":
        text = _extract_text_from_pdf(data)
        print(f"📄 Extracted {len(text)} characters from PDF")
    elif mime == "image/*":
        text = _extract_text_from_image(data)
        print(f"🖼️ Extracted {len(text)} characters from image")
    else:
        text = data.decode("utf-8", errors="ignore")
        print(f"📝 Read {len(text)} characters from text file")

    # Filter out unnecessary content using AI
    if artifact_type == "syllabus":
        try:
            from .ai_providers import filter_syllabus_content
            original_length = len(text)
            text = filter_syllabus_content(text)
            print(f"🎯 AI content filtering: {original_length} -> {len(text)} characters")
        except Exception as e:
            print(f"⚠️ AI content filtering failed: {e}, proceeding with original text")

    # Upload raw file to storage (mock-friendly)
    bucket = os.getenv("ARTIFACTS_BUCKET", "artifacts")
    object_path = f"{user_id}/{artifact_type}/{uuid.uuid4().hex}-{filename}"
    try:
        supabase.storage.from_(bucket).upload(object_path, data, {"contentType": mime})
        print(f"☁️ File uploaded to storage: {object_path}")
    except Exception:
        try:
            supabase.storage.create_bucket(bucket, {"public": False, "file_size_limit": "50mb"})
            supabase.storage.from_(bucket).upload(object_path, data, {"contentType": mime})
            print(f"☁️ File uploaded to newly created bucket: {object_path}")
        except Exception as e:
            # Ignore storage errors in demo mode
            print(f"⚠️ Storage upload failed (continuing): {e}")
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

    # Try to store artifact in database with retry mechanism
    if record["user_id"]:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                insert_resp = supabase.table("artifacts").insert(record).execute()
                if getattr(insert_resp, "data", None):
                    try:
                        artifact_id = insert_resp.data[0]["id"]
                        print(f"Artifact stored successfully in database: {artifact_id}")
                        break
                    except Exception:
                        artifact_id = None
            except Exception as e:
                fk_like = 'foreign key' in str(e).lower() or '23503' in str(e)
                if fk_like:
                    print(f"Foreign key violation for user {norm_user_id}, treating as demo user")
                    record["user_id"] = None
                    break
                elif attempt < max_retries - 1:
                    print(f"Database insert attempt {attempt + 1} failed: {e}, retrying...")
                    continue
                else:
                    print(f"Database insert failed after {max_retries} attempts: {e}")
                    record["user_id"] = None  # Fallback to in-memory
                    break
    else:
        print(f"Invalid user ID {norm_user_id}, skipping database storage")

    topics = []
    analysis = {}  # Initialize analysis for all artifact types
    if artifact_type == "syllabus":
        try:
            text = filter_syllabus_content(text)
            
            # Use Gemini for topic extraction
            topics_data = extract_topics_with_gemini(text)
            
            # Flatten the topics and subtopics
            topics = []
            for main_topic, subtopics in topics_data.get("topics", {}).items():
                topics.append(main_topic)
                topics.extend(subtopics)
            
        except Exception:
            from .weaktopics import extract_topics_from_text
            topics = extract_topics_from_text(text)
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
