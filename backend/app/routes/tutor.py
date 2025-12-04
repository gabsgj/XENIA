from flask import Blueprint, request
import logging
from ..errors import ApiError
from ..utils.api_response import APIResponseBuilder, api_endpoint, ErrorCode
from ..utils.file_validator import validate_uploaded_file, FileValidationError
from ..services.tutor import solve_question
from ..utils import normalize_user_id, is_valid_uuid
from ..services.tutor_storage import fetch_history

logger = logging.getLogger('xenia')
tutor_bp = Blueprint("tutor", __name__)


@tutor_bp.post("/ask")
@api_endpoint
def ask_tutor():
    """
    Ask the AI tutor a question with comprehensive error handling and timeout management.
    
    Accepts:
    - JSON: {"question": "your question"}
    - Form data: question=your question
    - File upload: image file with question
    
    Returns:
    - Standardized API response with steps, answer, and history
    """
    try:
        # Extract input data
        if "file" in request.files:
            file = request.files["file"]
            if file.filename == '':
                return APIResponseBuilder.validation_error("No file selected")
            
            # Read and validate file
            file_content = file.read()
            
            try:
                # Comprehensive file validation
                validation_result = validate_uploaded_file(file.filename, file_content)
                logger.info(f"File validation passed: {validation_result['filename']} ({validation_result['file_size']} bytes)")
                file_type = validation_result.get('detected_type')
            except FileValidationError as e:
                if e.error_code == "FILE_TOO_LARGE":
                    return APIResponseBuilder.error(ErrorCode.FILE_TOO_LARGE, e.message, status_code=413)
                elif e.error_code == "FILE_TYPE_NOT_ALLOWED":
                    return APIResponseBuilder.error(ErrorCode.FILE_TYPE_NOT_ALLOWED, e.message, status_code=400)
                else:
                    return APIResponseBuilder.error(ErrorCode.FILE_CORRUPTED, e.message, status_code=400)
            
            question = None
            logger.info(f"Processing validated file: {file.filename} ({len(file_content)} bytes)")
        else:
            file_content = None
            question = (
                request.get_json(silent=True, force=True).get("question")
                if request.is_json or request.content_type == 'application/json'
                else request.form.get("question")
            )
        
        # Validate input
        if not question and not file_content:
            # Return a user-friendly response instead of raising an error
            return APIResponseBuilder.success(
                data={
                    "question": "",
                    "steps": [],
                    "answer": "Please provide a question or upload an image containing your question.",
                    "history": []
                },
                meta={"input_missing": True}
            )
        
        # Get user ID
        raw_user_id = request.headers.get("X-User-Id", "") or request.values.get("user_id", "")
        user_id = normalize_user_id(raw_user_id) if raw_user_id else ""
        
        logger.info(f"Tutor request from user: {user_id[:8]}... Question: {question[:50] if question else 'Image upload'}...")
        
        # Process the question
        # If file content is provided, we also pass the detected file type when available.
        try:
            result = solve_question(question=question, image_bytes=file_content, user_id=user_id, file_type=locals().get('file_type'))
        except TypeError:
            # Backward compatibility if function signature differs
            result = solve_question(question=question, image_bytes=file_content, user_id=user_id)
        
        # Return successful response
        return APIResponseBuilder.success(
            data=result,
            meta={
                "processing_time": "< 1s",
                "ai_provider": "auto-selected",
                "user_authenticated": bool(user_id and is_valid_uuid(user_id))
            }
        )
        
    except ApiError as e:
        # Return ApiError using its native response shape (tests expect root-level errorCode)
        return e.to_response()
    
    except TimeoutError as e:
        return APIResponseBuilder.timeout_error("The AI request timed out. Please try again.")
    
    except Exception as e:
        logger.exception(f"Unexpected error in tutor endpoint: {e}")
        return APIResponseBuilder.internal_error(
            "An unexpected error occurred while processing your question"
        )


@tutor_bp.get("/history")
@api_endpoint
def tutor_history():
    """
    Get tutor conversation history for a user.
    
    Returns:
    - Standardized API response with conversation history
    """
    try:
        # Get user ID
        raw_user_id = request.headers.get("X-User-Id", "") or request.values.get("user_id", "")
        
        if not raw_user_id:
            return APIResponseBuilder.success(
                data={"history": []},
                meta={"message": "No user ID provided, returning empty history"}
            )
        
        user_id = normalize_user_id(raw_user_id)
        if not is_valid_uuid(user_id):
            return APIResponseBuilder.success(
                data={"history": []},
                meta={"message": "Invalid user ID format, returning empty history"}
            )
        
        # Fetch history
        history = fetch_history(user_id)
        
        return APIResponseBuilder.success(
            data={"history": history},
            meta={
                "user_id": user_id,
                "conversation_count": len(history),
                "last_updated": history[0].get("created_at") if history else None
            }
        )
        
    except Exception as e:
        logger.exception(f"Error fetching tutor history: {e}")
        return APIResponseBuilder.internal_error("Failed to fetch conversation history")


@tutor_bp.get("/status")
@api_endpoint
def tutor_status():
    """
    Get AI tutor service status and provider availability.
    
    Returns:
    - Service status and AI provider information
    """
    try:
        from ..utils.ai_manager import get_ai_manager
        
        # Get AI provider status
        ai_manager = get_ai_manager()
        provider_status = ai_manager.get_provider_status()
        
        # Count available providers
        available_providers = [
            name for name, status in provider_status.items()
            if status["status"] in ["healthy", "degraded"]
        ]
        
        service_status = {
            "service": "operational" if available_providers else "degraded",
            "ai_providers": provider_status,
            "available_providers": available_providers,
            "fallback_enabled": True
        }
        
        return APIResponseBuilder.success(
            data=service_status,
            meta={
                "timestamp": "2025-09-24T20:43:00Z",
                "version": "1.0.0"
            }
        )
        
    except Exception as e:
        logger.exception(f"Error getting tutor status: {e}")
        return APIResponseBuilder.internal_error("Failed to get service status")
