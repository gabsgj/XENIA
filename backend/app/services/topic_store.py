"""In-memory topic store for non-persistent demo / invalid UUID users.

This allows the app to behave logically (plans include uploaded topics)
even when we cannot persist to Supabase due to foreign key constraints
on auth.users (e.g., using the placeholder 'demo-user').

NOTE: This is a lightweight, ephemeral store suitable for local dev only.
Restarting the server clears the data.
"""
from typing import Dict, List
from threading import RLock

_topics: Dict[str, List[str]] = {}
_lock = RLock()


def add_topics(user_id: str, topics: List[str]) -> None:
    if not topics:
        return
    with _lock:
        existing = _topics.get(user_id, [])
        # Preserve order while deduping
        seen = set(existing)
        for t in topics:
            if t not in seen:
                existing.append(t)
                seen.add(t)
        _topics[user_id] = existing[:500]


def get_topics(user_id: str) -> List[str]:
    with _lock:
        return list(_topics.get(user_id, []))
