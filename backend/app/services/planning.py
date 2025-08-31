from typing import Dict, List
from datetime import datetime, timedelta
from ..supabase_client import get_supabase
from .weaktopics import get_weak_topics
from .ai_mock import get_mock_provider, is_mock_enabled


def _distribute_sessions(topics: List[Dict], days: int) -> List[Dict]:
    sessions = []
    today = datetime.utcnow().date()
    total = max(1, sum(max(1, t.get("score", 1)) for t in topics))
    for idx, t in enumerate(topics):
        weight = max(1, t.get("score", 1))
        count = max(
            1, round(days * weight / total * 3)
        )  # about 3x sessions per horizon spread
        for i in range(count):
            date = today + timedelta(days=(idx + i) % days)
            sessions.append(
                {
                    "date": str(date),
                    "topic": t["topic"],
                    "focus": "practice + review",
                    "duration_min": 45,
                }
            )
    sessions.sort(key=lambda s: s["date"])
    return sessions[: days * 6]  # cap


def generate_plan(user_id: str, horizon_days: int = 14) -> Dict:
    # Check if mock mode is enabled
    if is_mock_enabled():
        mock_provider = get_mock_provider()
        # Generate mock topics for planning
        mock_topics = [
            {"topic": "Algebra Fundamentals", "score": 3},
            {"topic": "Linear Equations", "score": 4},
            {"topic": "Quadratic Functions", "score": 2},
            {"topic": "Polynomial Operations", "score": 5},
            {"topic": "Rational Expressions", "score": 1},
        ]
        plan = mock_provider.generate_study_plan(mock_topics, horizon_days)
        plan["user_id"] = user_id
        plan["generated_at"] = datetime.utcnow().isoformat()
        plan["weak_topics"] = mock_topics
        
        # Store in database
        sb = get_supabase()
        sb.table("plans").upsert({"user_id": user_id, "plan": plan}).execute()
        return plan
    
    sb = get_supabase()
    weak = get_weak_topics(user_id)
    if not weak:
        # Seed with general review
        weak = [{"topic": "General Review", "score": 1}]
    sessions = _distribute_sessions(weak, horizon_days)
    plan = {
        "user_id": user_id,
        "generated_at": datetime.utcnow().isoformat(),
        "horizon_days": horizon_days,
        "weak_topics": weak,
        "sessions": sessions,
    }
    # upsert into plans
    sb.table("plans").upsert({"user_id": user_id, "plan": plan}).execute()
    return plan


def get_current_plan(user_id: str) -> Dict:
    sb = get_supabase()
    resp = sb.table("plans").select("plan").eq("user_id", user_id).limit(1).execute()
    if resp.data:
        return resp.data[0]["plan"]
    return generate_plan(user_id)
