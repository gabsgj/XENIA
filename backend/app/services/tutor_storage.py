from typing import List, Dict, Optional
from ..supabase_client import get_supabase
from .ai_providers import get_ai_response
from ..utils import is_valid_uuid


def save_message(user_id: str, role: str, content: str, steps: Optional[List[Dict]] = None) -> None:
    if not is_valid_uuid(user_id):
        return
    sb = get_supabase()
    try:
        sb.table("tutor_messages").insert({
            "user_id": user_id,
            "role": role,
            "content": content,
            "steps": steps or None
        }).execute()
    except Exception as e:
        # Log silently; do not raise to user
        print(f"tutor_storage save_message error: {e}")


def fetch_history(user_id: str, limit: int = 40) -> List[Dict]:
    if not is_valid_uuid(user_id):
        return []
    sb = get_supabase()
    try:
        resp = sb.table("tutor_messages") \
            .select("id, role, content, steps, created_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        items = resp.data or []
        items.reverse()  # oldest first
        return items
    except Exception as e:
        print(f"tutor_storage fetch_history error: {e}")
        return []
