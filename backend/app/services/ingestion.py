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
        # Extract topics with enhanced extraction for more comprehensive coverage
        topics = extract_topics_from_text(text)
        print(f"📚 Enhanced topic extraction: {len(topics)} topics extracted")
        
        # Get AI-enhanced analysis for better topic metadata
        analysis = {}
        try:
            from .ai_providers import get_syllabus_analysis
            # Use more text for analysis to capture more topics
            analysis = get_syllabus_analysis(text[:8000])  # Increased from 6000
            print(f"AI analysis completed: {len(analysis.get('topics', []))} enhanced topics")
        except Exception as e:
            print(f"AI analysis failed: {e}")
            # Enhanced fallback with more topics
            analysis = {"topics": [{"topic": t, "score": 5} for t in topics[:75]]}  # Increased from 50
        
        # AI FILTERING STEP: Filter and prioritize topics using Gemini
        filtered_analysis = {}
        try:
            from .ai_providers import filter_and_prioritize_topics
            # Pass more topics for filtering
            user_preferences = {"comprehensive_coverage": True}  # Flag for more inclusive filtering
            filtered_analysis = filter_and_prioritize_topics(topics, text, user_preferences)
            print(f"🎯 AI filtering completed: {len(filtered_analysis.get('filtered_topics', []))} topics after intelligent filtering")
            
            # Update analysis with filtered results
            if filtered_analysis.get('filtered_topics'):
                analysis['filtered_topics'] = filtered_analysis['filtered_topics']
                analysis['learning_path'] = filtered_analysis['learning_path']
                analysis['filtering_insights'] = filtered_analysis['filtering_insights']
                analysis['next_steps'] = filtered_analysis['next_steps']
                print(f"📚 Comprehensive learning path generated with {len(filtered_analysis['learning_path'])} phases")
                
        except Exception as e:
            print(f"AI filtering failed: {e}")
            # Continue with original topics if filtering fails
        
        # Persist topics with enhanced metadata
        rows = []
        # Use filtered topics if available, otherwise fall back to original AI analysis
        topics_to_store = filtered_analysis.get('filtered_topics', analysis.get("topics", []))
        
        # Create a lookup for enhanced topic data
        if filtered_analysis.get('filtered_topics'):
            # Use filtered topics with rich metadata
            ai_topics_dict = {t.get("topic", ""): t for t in filtered_analysis['filtered_topics']}
        else:
            # Fall back to original AI analysis
            ai_topics = analysis.get("topics", [])
            ai_topics_dict = {t.get("topic", ""): t for t in ai_topics if isinstance(t, dict)}
        
        for idx, t in enumerate(topics):
            # Get enhanced metadata if available from AI analysis/filtering
            if isinstance(t, str):
                topic_name = t
            else:
                topic_name = t.get("topic", str(t))
                
            enhanced_data = ai_topics_dict.get(topic_name, {})
            metadata = {
                "score": enhanced_data.get("difficulty_score", enhanced_data.get("score", 5)),
                "category": enhanced_data.get("category", "general"),
                "estimated_hours": enhanced_data.get("estimated_hours", 3),
                "priority": enhanced_data.get("priority", "medium"),
                "prerequisites": enhanced_data.get("prerequisites", []),
                "learning_objectives": enhanced_data.get("learning_objectives", []),
                "why_important": enhanced_data.get("why_important", ""),
                "suggested_resources": enhanced_data.get("suggested_resources", []),
                "keywords": enhanced_data.get("keywords", [])
            }
            
            rows.append({
                "user_id": norm_user_id if is_valid_uuid(norm_user_id) else None,
                "topic": t,
                "order_index": idx,
                "source_artifact": artifact_id,
                "metadata": metadata  # Store enhanced AI analysis
            })
            
        if rows and is_valid_uuid(norm_user_id) and record.get("user_id"):
            try:
                # Try inserting with metadata first
                supabase.table("syllabus_topics").insert(rows).execute()
                print(f"Enhanced topics stored in DB: {len(rows)} topics with metadata")
            except Exception as e:
                print(f"Enhanced topic insert failed, trying without metadata: {e}")
                # Fallback to basic format if metadata column doesn't exist
                try:
                    basic_rows = []
                    for row in rows:
                        basic_row = {k: v for k, v in row.items() if k != "metadata"}
                        basic_rows.append(basic_row)
                    supabase.table("syllabus_topics").insert(basic_rows).execute()
                    print(f"Basic topics stored in DB: {len(basic_rows)} topics")
                except Exception as e2:
                    print(f"Basic topic insert also failed: {e2}")
                    # Final fallback to in-memory
                    store_add_topics(norm_user_id, topics)
        else:
            store_add_topics(norm_user_id, topics)
            
        # Fetch resources for more topics (increased coverage)
        if is_valid_uuid(norm_user_id) and record.get("user_id"):
            try:
                fetch_and_store_resources_for_topics(norm_user_id, topics[:50])  # Increased from 25
            except Exception as e:
                print(f"Resource fetch error: {e}")
                
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
