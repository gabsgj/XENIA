from typing import Optional
from flask import Request
import uuid


def is_valid_uuid(value: str) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except Exception:
        return False


def normalize_user_id(raw: Optional[str]) -> str:
    """Return a deterministic UUID for any raw user identifier.

    - If raw is a valid UUID -> return as-is
    - Else hash via UUID5 for stability
    """
    if not raw:
        return str(uuid.uuid5(uuid.NAMESPACE_URL, "xenia-anonymous-user"))
    try:
        uuid.UUID(raw)
        return raw
    except Exception:
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

