from typing import Dict, List, Optional
from datetime import datetime, timedelta, timezone
from ..supabase_client import get_supabase
from .weaktopics import get_weak_topics
from .topic_store import get_topics as store_get_topics
from ..utils import normalize_user_id, is_valid_uuid
from ..supabase_client import get_supabase


def _distribute_sessions(topics: List[Dict], days: int, hours_per_day: float) -> List[Dict]:
    sessions = []
    # Use timezone-aware UTC date (avoids deprecated datetime.utcnow())
    today = datetime.now(timezone.utc).date()
    total = max(1, sum(max(1, t.get("score", 1)) for t in topics))
    for idx, t in enumerate(topics):
        weight = max(1, t.get("score", 1))
        base_sessions = max(1, round(days * weight / total * 3))
        # Adjust session count relative to available hours (each session ~45m)
        capacity_sessions = max(1, int(hours_per_day * 60 / 45))
        count = max(1, min(base_sessions, days * capacity_sessions))
        for i in range(count):
            date = today + timedelta(days=(idx + i) % days)
            sessions.append({
                "date": str(date),
                "topic": t["topic"],
                "focus": "practice + review",
                "duration_min": 45,
            })
    sessions.sort(key=lambda s: s["date"])
    return sessions[: days * 6]  # cap


def generate_plan(user_id: str, horizon_days: int = 14, preferred_hours_per_day: float = 1.5, deadline: Optional[str] = None) -> Dict:
    norm_user_id = normalize_user_id(user_id)

    # 1. Attempt to use syllabus topics (DB or in-memory) as primary source
    syllabus_topics: List[str] = []
    # From DB if valid UUID
    if is_valid_uuid(norm_user_id):
        try:
            sb = get_supabase()
            resp = sb.table("syllabus_topics").select("topic, order_index").eq("user_id", norm_user_id).order("order_index").limit(200).execute()
            syllabus_topics = [r["topic"] for r in (resp.data or [])]
        except Exception:
            syllabus_topics = []
    # Fallback to in-memory store (demo users)
    if not syllabus_topics:
        syllabus_topics = store_get_topics(norm_user_id)

    weak: List[Dict] = []
    if syllabus_topics:
        weak = [{"topic": t, "score": 5} for t in syllabus_topics]
    else:
        # 2. Derive weak topics heuristically from artifacts
        try:
            weak = get_weak_topics(norm_user_id)
        except Exception:
            weak = []
        # 3. Final fallback
        if not weak:
            weak = [{"topic": "General Review", "score": 1}]
    # If deadline supplied, recompute horizon
    if deadline:
        try:
            dd = datetime.fromisoformat(deadline).date()
            today = datetime.now(timezone.utc).date()
            delta = (dd - today).days
            if delta > 0:
                horizon_days = min(horizon_days, delta)
        except Exception:
            pass
    sessions = _distribute_sessions(weak, horizon_days, preferred_hours_per_day)
    plan = {
        "user_id": norm_user_id,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "horizon_days": horizon_days,
        "preferred_hours_per_day": preferred_hours_per_day,
        "deadline": deadline,
        "weak_topics": weak,
        "sessions": sessions,
    }
    # upsert into plans (best-effort)
    try:
        if is_valid_uuid(norm_user_id):
            sb = get_supabase()
            sb.table("plans").upsert({"user_id": norm_user_id, "plan": plan}).execute()
    except Exception:
        # If DB is unavailable, still return the generated plan
        pass
    return plan


def get_current_plan(user_id: str, allow_regenerate: bool = False) -> Dict:
    """Return current stored plan; optionally regenerate if generic and topics now exist.

    Generic plan heuristic: single session or all sessions topic == 'General Review'.
    (Objectives C & B synergy: regenerate after topics uploaded.)
    """
    norm_user_id = normalize_user_id(user_id)
    stored_plan: Optional[Dict] = None
    if is_valid_uuid(norm_user_id):
        try:
            sb = get_supabase()
            resp = sb.table("plans").select("plan").eq("user_id", norm_user_id).limit(1).execute()
            if resp.data:
                stored_plan = resp.data[0]["plan"]
        except Exception:
            stored_plan = None

    def _generic(p: Dict) -> bool:
        sessions = p.get("sessions") or []
        if not sessions:
            return True
        if all(s.get("topic") == "General Review" for s in sessions):
            return True
        return False

    need_regen = stored_plan is None
    if allow_regenerate and stored_plan and _generic(stored_plan):
        # Check for presence of syllabus topics now
        syllabus_topics: List[str] = []
        if is_valid_uuid(norm_user_id):
            try:
                sb = get_supabase()
                tr = sb.table("syllabus_topics").select("topic").eq("user_id", norm_user_id).limit(5).execute()
                syllabus_topics = [r["topic"] for r in (tr.data or [])]
            except Exception:
                syllabus_topics = []
        if not syllabus_topics:
            syllabus_topics = store_get_topics(norm_user_id)
        if syllabus_topics:
            need_regen = True

    if need_regen:
        return generate_plan(norm_user_id)
    return stored_plan
