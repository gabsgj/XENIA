"""Utilities package for XENIA backend.

This package provides commonly-used helper functions. Historically there
was a top-level module at ``app/utils.py`` with implementations. To ensure
that ``from app.utils import normalize_user_id, is_valid_uuid`` works when
``app.utils`` is a package (directory), we expose those functions here.

Keep additional utility modules (ai_manager, api_response, file_validator)
available under the package namespace (e.g. ``app.utils.api_response``).
"""

from typing import Optional
import uuid
from flask import Request

__all__ = [
	"is_valid_uuid",
	"normalize_user_id",
	"get_user_id_from_request",
]


def is_valid_uuid(value: str) -> bool:
	try:
		uuid.UUID(str(value))
		return True
	except Exception:
		return False


def normalize_user_id(raw: Optional[str]) -> str:
	"""Return a deterministic UUID for any raw user identifier.

	- If raw is a valid UUID -> return as-is
	- If raw starts with 'anon-' -> treat as anonymous but keep unique
	- Else hash via UUID5 for stability
	"""
	if not raw:
		return str(uuid.uuid5(uuid.NAMESPACE_URL, "xenia-anonymous-user"))
	try:
		uuid.UUID(raw)
		return raw
	except Exception:
		# For anonymous IDs starting with 'anon-', create a stable UUID
		return str(uuid.uuid5(uuid.NAMESPACE_URL, raw))


def get_user_id_from_request(request: Request) -> Optional[str]:
	# Prefer explicit user id header for dev; else parse from form/json
	uid = request.headers.get("X-User-Id")
	if uid:
		return uid
	if request.is_json:
		data = request.get_json(silent=True) or {}
		uid = data.get("user_id")
		if uid:
			return uid
	uid = request.values.get("user_id")
	if uid:
		return uid
	return None
