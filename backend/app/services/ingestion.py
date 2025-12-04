import io
import os
import uuid
from typing import Dict
from PIL import Image
import pytesseract
from pdfminer.high_level import extract_text
from pdf2image import convert_from_bytes
from contextlib import contextmanager
import time
from ..supabase_client import get_supabase
from ..utils import normalize_user_id, is_valid_uuid
from .topic_store import add_topics as store_add_topics
from .embeddings import embed_texts
from .ai_providers import extract_topics_with_gemini, filter_syllabus_content
from .resources import fetch_and_store_resources_for_topics
from .planning import generate_plan  # for plan preview after topic ingestion
from .user_util import ensure_user_record


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
    # Ensure user exists in app tables to satisfy any FK constraints
    try:
        if is_valid_uuid(norm_user_id):
            ensure_user_record(supabase, norm_user_id)
    except Exception:
        pass
    filename = file_storage.filename or f"upload-{uuid.uuid4().hex}"
    data = file_storage.read()
    mime = _detect_mimetype(filename)

    # Lightweight timing helper for profiling
    @contextmanager
    def _timer(name: str):
        start = time.perf_counter()
        try:
            yield
        finally:
            elapsed = time.perf_counter() - start
            print(f"⏱️ {name}: {elapsed:.3f}s")

    # Extract text
    with _timer("extraction"):
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
            with _timer("ai_filtering"):
                text = filter_syllabus_content(text)
            print(f"🎯 AI content filtering: {original_length} -> {len(text)} characters")
        except Exception as e:
            print(f"⚠️ AI content filtering failed: {e}, proceeding with original text")

    # Upload raw file to storage (mock-friendly)
    bucket = os.getenv("ARTIFACTS_BUCKET", "artifacts")
    object_path = f"{user_id}/{artifact_type}/{uuid.uuid4().hex}-{filename}"
    try:
        with _timer("storage_upload"):
            supabase.storage.from_(bucket).upload(object_path, data, {"contentType": mime})
        print(f"☁️ File uploaded to storage: {object_path}")
    except Exception:
        try:
            supabase.storage.create_bucket(bucket, {"public": False, "file_size_limit": "50mb"})
            with _timer("storage_upload"):
                supabase.storage.from_(bucket).upload(object_path, data, {"contentType": mime})
            print(f"☁️ File uploaded to newly created bucket: {object_path}")
        except Exception as e:
            # Ignore storage errors in development mode
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
    with _timer("embedding"):
        vectors = embed_texts([text]) or []
    if vectors and len(vectors) == 1:
        record["embedding"] = vectors[0]
    artifact_id = None

    # Try to store artifact in database with retry mechanism
    if record["user_id"]:
        max_retries = 3
        with _timer("db_insert"):
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
                        print(f"Foreign key violation for user {norm_user_id}, treating as development user")
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
            with _timer("topic_extraction"):
                topics_data = extract_topics_with_gemini(text)
            
            # Flatten the topics and subtopics
            topics = []
            for main_topic, subtopics in topics_data.get("topics", {}).items():
                topics.append(main_topic)
                topics.extend(subtopics)
            
            # Store topics in topic store for quiz generation and persist to DB when possible
            if topics:
                with _timer("store_topics"):
                    # Keep in-memory for quick dev feedback
                    store_add_topics(norm_user_id, topics)
                    # Attempt to persist to syllabus_topics table (best-effort)
                    try:
                        sb = get_supabase()
                        rows = []
                        for idx, t in enumerate(topics):
                            rows.append({
                                "user_id": norm_user_id if is_valid_uuid(norm_user_id) else None,
                                "topic": t,
                                "order_index": idx + 1,
                                "source_artifact": artifact_id,
                            })
                        if rows and is_valid_uuid(norm_user_id):
                            try:
                                # Use on_conflict to handle the unique constraint on (user_id, topic)
                                sb.table("syllabus_topics").upsert(rows, on_conflict="user_id,topic").execute()
                                print(f"📚 Persisted {len(rows)} topics to DB for user {norm_user_id}")
                            except Exception as e:
                                print(f"⚠️ Failed to persist topics to DB: {e}")
                    except Exception as e:
                        print(f"⚠️ Topic DB persistence skipped (supabase unavailable): {e}")
                print(f"📚 Stored {len(topics)} topics for user {norm_user_id}")
            
        except Exception:
            from .weaktopics import extract_topics_from_text
            topics = extract_topics_from_text(text)
            # Store fallback topics as well and attempt DB persistence
            if topics:
                with _timer("store_topics"):
                    store_add_topics(norm_user_id, topics)
                    try:
                        sb = get_supabase()
                        rows = []
                        for idx, t in enumerate(topics):
                            rows.append({
                                "user_id": norm_user_id if is_valid_uuid(norm_user_id) else None,
                                "topic": t,
                                "order_index": idx + 1,
                                "source_artifact": artifact_id,
                            })
                        if rows and is_valid_uuid(norm_user_id):
                            try:
                                # Use on_conflict to handle the unique constraint on (user_id, topic)
                                sb.table("syllabus_topics").upsert(rows, on_conflict="user_id,topic").execute()
                                print(f"📚 Persisted {len(rows)} fallback topics to DB for user {norm_user_id}")
                            except Exception as e:
                                print(f"⚠️ Failed to persist fallback topics to DB: {e}")
                    except Exception as e:
                        print(f"⚠️ Topic DB persistence skipped (supabase unavailable): {e}")
                print(f"📚 Stored {len(topics)} fallback topics for user {norm_user_id}")
    elif artifact_type == "assessment":
        try:
            from .ai_providers import get_assessment_analysis
            analysis = get_assessment_analysis(text[:6000])
        except Exception:
            analysis = {}
    else:
        analysis = {}

    # Return quickly with topics - plan generation can happen on demand
    # This speeds up the upload response significantly
    plan_preview = None
    # OPTIMIZATION: Skip full plan preview by default for faster uploads
    # Frontend can request plan separately via /api/plan endpoint
    skip_plan_preview = os.getenv("SKIP_PLAN_PREVIEW", "true").lower() == "true"
    
    if not skip_plan_preview and topics:
        try:
            # Generate plan preview only if we have topics
            # Use a shorter timeout for faster response
            with _timer("generate_plan"):
                plan_preview = generate_plan(
                    user_id=norm_user_id, 
                    extracted_topics=topics if topics else None
                )
        except Exception as e:
            print(f"⚠️ Plan preview generation failed: {e}")
            plan_preview = None

    # Ensure topics are at the top level for frontend compatibility
    return {
        "ok": True,
        "path": object_path,
        "chars": len(text),
        "topics": topics,
        "analysis": {
            "prioritized_topics": topics,
            "filtered_topics": topics,
            "topic_count": len(topics),
            **(analysis if isinstance(analysis, dict) else {})
        },
        "plan_preview": plan_preview,
    }
