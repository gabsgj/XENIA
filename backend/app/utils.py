from typing import Optional
from flask import Request


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
