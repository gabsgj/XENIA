"""
Standardized API response utilities for consistent error handling and response formatting.
"""
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional, Union, List
from flask import jsonify, Response
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger('xenia')

class ErrorCode(Enum):
    """Standard error codes for the application."""
    # General errors
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    
    # AI/Tutor specific errors
    TUTOR_TIMEOUT = "TUTOR_TIMEOUT"
    TUTOR_INVALID_INPUT = "TUTOR_INVALID_INPUT"
    TUTOR_AI_FAILED = "TUTOR_AI_FAILED"
    TUTOR_AI_INVALID_RESPONSE = "TUTOR_AI_INVALID_RESPONSE"
    
    # File upload errors
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    FILE_TYPE_NOT_ALLOWED = "FILE_TYPE_NOT_ALLOWED"
    FILE_CORRUPTED = "FILE_CORRUPTED"
    FILE_PROCESSING_FAILED = "FILE_PROCESSING_FAILED"
    
    # Database errors
    DATABASE_ERROR = "DATABASE_ERROR"
    DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR"
    
    # External service errors
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
    EXTERNAL_SERVICE_TIMEOUT = "EXTERNAL_SERVICE_TIMEOUT"

@dataclass
class ErrorDetail:
    """Detailed error information."""
    code: str
    message: str
    details: Optional[str] = None
    field: Optional[str] = None
    timestamp: Optional[str] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat() + "Z"

@dataclass
class APIResponse:
    """Standard API response structure."""
    success: bool
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None
    meta: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {"success": self.success}
        
        if self.data is not None:
            result["data"] = self.data
            
        if self.error is not None:
            result["error"] = asdict(self.error)
            
        if self.meta is not None:
            result["meta"] = self.meta
            
        return result
    
    def to_response(self, status_code: int = 200) -> Response:
        """Convert to Flask Response object."""
        return jsonify(self.to_dict()), status_code

class APIResponseBuilder:
    """Builder for creating standardized API responses."""
    
    @staticmethod
    def success(data: Any = None, meta: Optional[Dict[str, Any]] = None, status_code: int = 200) -> Response:
        """Create a successful response."""
        response = APIResponse(success=True, data=data, meta=meta)
        return response.to_response(status_code)
    
    @staticmethod
    def error(
        code: Union[str, ErrorCode],
        message: str,
        details: Optional[str] = None,
        field: Optional[str] = None,
        status_code: int = 400,
        meta: Optional[Dict[str, Any]] = None
    ) -> Response:
        """Create an error response."""
        if isinstance(code, ErrorCode):
            code = code.value
            
        error_detail = ErrorDetail(
            code=code,
            message=message,
            details=details,
            field=field
        )
        
        response = APIResponse(success=False, error=error_detail, meta=meta)
        
        # Log the error
        logger.error(f"API Error [{code}]: {message}" + (f" - {details}" if details else ""))
        
        return response.to_response(status_code)
    
    @staticmethod
    def validation_error(message: str, field: Optional[str] = None, details: Optional[str] = None) -> Response:
        """Create a validation error response."""
        return APIResponseBuilder.error(
            ErrorCode.VALIDATION_ERROR,
            message,
            details=details,
            field=field,
            status_code=400
        )
    
    @staticmethod
    def not_found(resource: str = "Resource") -> Response:
        """Create a not found error response."""
        return APIResponseBuilder.error(
            ErrorCode.NOT_FOUND,
            f"{resource} not found",
            status_code=404
        )
    
    @staticmethod
    def unauthorized(message: str = "Authentication required") -> Response:
        """Create an unauthorized error response."""
        return APIResponseBuilder.error(
            ErrorCode.AUTHENTICATION_ERROR,
            message,
            status_code=401
        )
    
    @staticmethod
    def forbidden(message: str = "Access forbidden") -> Response:
        """Create a forbidden error response."""
        return APIResponseBuilder.error(
            ErrorCode.AUTHORIZATION_ERROR,
            message,
            status_code=403
        )
    
    @staticmethod
    def rate_limit_exceeded(message: str = "Rate limit exceeded") -> Response:
        """Create a rate limit error response."""
        return APIResponseBuilder.error(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            message,
            status_code=429
        )
    
    @staticmethod
    def timeout_error(message: str = "Request timeout") -> Response:
        """Create a timeout error response."""
        return APIResponseBuilder.error(
            ErrorCode.TUTOR_TIMEOUT,
            message,
            status_code=408
        )
    
    @staticmethod
    def internal_error(message: str = "Internal server error", details: Optional[str] = None) -> Response:
        """Create an internal server error response."""
        return APIResponseBuilder.error(
            ErrorCode.INTERNAL_ERROR,
            message,
            details=details,
            status_code=500
        )
    
    @staticmethod
    def external_service_error(service: str, message: str = None) -> Response:
        """Create an external service error response."""
        if message is None:
            message = f"{service} service is currently unavailable"
        
        return APIResponseBuilder.error(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            message,
            details=f"External service: {service}",
            status_code=502
        )

def handle_api_exception(e: Exception) -> Response:
    """
    Global exception handler for API endpoints.
    
    Args:
        e: The exception to handle
        
    Returns:
        Standardized error response
    """
    # Import here to avoid circular imports
    from ..errors import ApiError
    
    if isinstance(e, ApiError):
        # Handle our custom API errors with the fields on ApiError
        return APIResponseBuilder.error(
            e.error_code,
            getattr(e, 'error_message', str(e)),
            details=getattr(e, 'details', None),
            status_code=getattr(e, 'status', 500)
        )
    
    # Handle common exceptions
    if isinstance(e, ValueError):
        return APIResponseBuilder.validation_error(str(e))
    
    if isinstance(e, KeyError):
        return APIResponseBuilder.validation_error(f"Missing required field: {str(e)}")
    
    if isinstance(e, TimeoutError):
        return APIResponseBuilder.timeout_error(str(e))
    
    if isinstance(e, ConnectionError):
        return APIResponseBuilder.external_service_error("Database", str(e))
    
    # Log unexpected errors
    logger.exception(f"Unexpected API error: {e}")
    
    # Return generic internal error for unexpected exceptions
    return APIResponseBuilder.internal_error(
        "An unexpected error occurred",
        details=str(e) if logger.level <= logging.DEBUG else None
    )

def paginated_response(
    data: List[Any],
    page: int,
    per_page: int,
    total: int,
    endpoint: str = None
) -> Response:
    """
    Create a paginated response.
    
    Args:
        data: The data for current page
        page: Current page number (1-based)
        per_page: Items per page
        total: Total number of items
        endpoint: API endpoint for generating next/prev URLs
        
    Returns:
        Paginated API response
    """
    total_pages = (total + per_page - 1) // per_page
    has_next = page < total_pages
    has_prev = page > 1
    
    meta = {
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev
        }
    }
    
    if endpoint:
        base_url = f"/api/{endpoint.lstrip('/')}"
        if has_next:
            meta["pagination"]["next_url"] = f"{base_url}?page={page + 1}&per_page={per_page}"
        if has_prev:
            meta["pagination"]["prev_url"] = f"{base_url}?page={page - 1}&per_page={per_page}"
    
    return APIResponseBuilder.success(data=data, meta=meta)

# Decorator for automatic exception handling
def api_endpoint(func):
    """
    Decorator to automatically handle exceptions in API endpoints.
    
    Usage:
        @api_endpoint
        def my_endpoint():
            # Your endpoint logic here
            return APIResponseBuilder.success({"message": "Hello"})
    """
    from functools import wraps
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            return handle_api_exception(e)
    
    return wrapper
