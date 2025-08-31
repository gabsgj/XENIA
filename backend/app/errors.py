import logging
import traceback
import uuid
from typing import Any, Dict, Optional, Tuple
from flask import jsonify, request, g
from werkzeug.exceptions import HTTPException


logger = logging.getLogger("xenia.errors")


class ApiError(Exception):
    """Unified API error with code, message, status and optional details."""

    def __init__(self, error_code: str, error_message: str, status: int = 400, details: Optional[Any] = None):
        super().__init__(error_message)
        self.error_code = error_code
        self.error_message = error_message
        self.status = int(status)
        self.details = details

    def to_response(self) -> Tuple[Any, int, Dict[str, str]]:
        payload = {
            "errorCode": self.error_code,
            "errorMessage": self.error_message,
            "details": self.details if self.details is not None else {},
        }
        headers = {}
        cid = getattr(g, "correlation_id", None)
        if cid:
            headers["x-correlation-id"] = cid
        return jsonify(payload), self.status, headers


def _derive_error_code_from_path(path: str, status: int) -> str:
    """Fallback code derivation for unexpected exceptions based on request path."""
    try:
        path = path or ""
        if path.startswith("/api/plan"):
            if status == 404:
                return "PLAN_404"
            if status >= 500:
                return "PLAN_500"
            return "PLAN_400"
        if path.startswith("/api/upload"):
            # Try to distinguish assessment vs syllabus
            if "assessment" in path:
                return "ASSESSMENT_PARSE_FAIL" if status >= 500 else "SYLLABUS_INVALID_FORMAT"
            return "SYLLABUS_PARSE_FAIL" if status >= 500 else "SYLLABUS_INVALID_FORMAT"
        if path.startswith("/api/tutor"):
            return "TUTOR_API_DOWN" if status >= 500 else "TUTOR_TIMEOUT"
        if path.startswith("/api/analytics") or path.startswith("/api/tasks") or path.startswith("/api/teacher") or path.startswith("/api/parent"):
            return "CONTENT_API_FAIL" if status >= 500 else "CONTENT_NOT_FOUND"
        if status == 401:
            return "AUTH_401"
        if status == 403:
            return "AUTH_403"
        if status == 422:
            return "AUTH_422"
        return f"HTTP_{status}"
    except Exception:
        return f"HTTP_{status}"


def register_error_handlers(app):
    @app.before_request
    def _set_correlation():
        # Preserve inbound correlation id if present
        inbound = request.headers.get("x-correlation-id") or request.headers.get("X-Correlation-Id")
        g.correlation_id = inbound or uuid.uuid4().hex

    @app.after_request
    def _add_correlation_header(response):
        cid = getattr(g, "correlation_id", None)
        if cid:
            response.headers["x-correlation-id"] = cid
        return response

    @app.errorhandler(ApiError)
    def _handle_api_error(err: ApiError):
        cid = getattr(g, "correlation_id", "-")
        logger.warning("ApiError [%s] %s - %s", cid, err.error_code, err.error_message, exc_info=False)
        return err.to_response()

    @app.errorhandler(HTTPException)
    def _handle_http_exception(err: HTTPException):
        status = err.code or 500
        code = _derive_error_code_from_path(request.path, status)
        payload = {
            "errorCode": code,
            "errorMessage": err.description or "HTTP error",
            "details": {},
        }
        cid = getattr(g, "correlation_id", None)
        headers = {"x-correlation-id": cid} if cid else {}
        logger.error("HTTPException [%s] %s - %s", cid or "-", code, err.description)
        return jsonify(payload), status, headers

    @app.errorhandler(Exception)
    def _handle_unexpected(err: Exception):
        status = 500
        code = _derive_error_code_from_path(request.path, status)
        message = "Internal server error"
        details = {"type": err.__class__.__name__}
        # Minimal stack in logs, not in response
        cid = getattr(g, "correlation_id", "-")
        logger.exception("Unhandled [%s] %s: %s\n%s", cid, code, str(err), traceback.format_exc())
        payload = {
            "errorCode": code,
            "errorMessage": message,
            "details": details,
        }
        headers = {"x-correlation-id": cid} if cid else {}
        return jsonify(payload), status, headers

