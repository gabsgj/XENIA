import datetime
import logging
from ..supabase_client import get_supabase, supabase_call

# Local in-memory fallback cache used when Supabase persistence fails or isn't available
LOCAL_CACHE = {}
logger = logging.getLogger('xenia')


# Progress persistence using Supabase
# Tables expected:
# - user_progress (user_id, topic, quizzes_taken, correct, wrong, last_score, last_updated)
# - user_progress_history (id, user_id, topic, correct, wrong, score, created_at)


def record_quiz_result(user_id, topic_scores):
    """
    Persist quiz results to Supabase: insert history rows and upsert aggregated progress.
    topic_scores: List of dicts: [{topic: str, correct: int, wrong: int, score: float}]
    """
    sb = get_supabase()
    now = datetime.datetime.utcnow().isoformat() + "Z"

    # Insert history rows and upsert aggregates using supabase_call for retries/circuit-breaker
    history_rows = []
    upsert_rows = []
    for entry in topic_scores:
        topic = entry["topic"]
        correct = int(entry.get("correct", 0))
        wrong = int(entry.get("wrong", 0))
        score = float(entry.get("score", 0.0))
        history_rows.append({
            "user_id": user_id,
            "topic": topic,
            "correct": correct,
            "wrong": wrong,
            "score": score,
            "created_at": now,
        })
        upsert_rows.append({
            "user_id": user_id,
            "topic": topic,
            "quizzes_taken": 1,
            "correct": correct,
            "wrong": wrong,
            "last_score": score,
            "last_updated": now,
        })

    try:
        if history_rows:
            # Use supabase_call wrapper
            supabase_call(lambda: sb.table("user_progress_history").insert(history_rows).execute())

        # Use upsert semantics when available
        for row in upsert_rows:
            try:
                # attempt direct upsert (works with real Supabase and with mock)
                supabase_call(lambda r=row: sb.table("user_progress").upsert(r).execute())
            except Exception:
                # fallback to read-update-write with optimistic locking behavior
                try:
                    def _get_existing():
                        return sb.table("user_progress").select("*").eq("user_id", user_id).eq("topic", row["topic"]).limit(1).execute().data

                    existing = supabase_call(_get_existing)
                    if existing:
                        rec = existing[0]
                        new_quizzes = int(rec.get("quizzes_taken", 0)) + int(row.get("quizzes_taken", 0))
                        new_correct = int(rec.get("correct", 0)) + int(row.get("correct", 0))
                        new_wrong = int(rec.get("wrong", 0)) + int(row.get("wrong", 0))
                        supabase_call(lambda: sb.table("user_progress").update({
                            "quizzes_taken": new_quizzes,
                            "correct": new_correct,
                            "wrong": new_wrong,
                            "last_score": row["last_score"],
                            "last_updated": row["last_updated"],
                        }).eq("user_id", user_id).eq("topic", row["topic"]).execute())
                    else:
                        supabase_call(lambda: sb.table("user_progress").insert(row).execute())
                except Exception as inner:
                    logger.warning(f"Progress upsert fallback failed for user {user_id} topic {row.get('topic')}: {inner}")
                    raise
    except Exception as e:
        # Fall back to local cache if Supabase unavailable
        logger.warning(f"Failed to persist progress to Supabase: {e}")
        for entry in topic_scores:
            topic = entry["topic"]
            rec = LOCAL_CACHE.setdefault(user_id, {}).setdefault(topic, {
                "quizzes_taken": 0,
                "correct": 0,
                "wrong": 0,
                "last_score": 0.0,
                "last_updated": now,
            })
            rec["quizzes_taken"] += 1
            rec["correct"] += int(entry.get("correct", 0))
            rec["wrong"] += int(entry.get("wrong", 0))
            rec["last_score"] = float(entry.get("score", 0.0))
            rec["last_updated"] = now


def get_user_progress(user_id):
    sb = get_supabase()
    try:
        resp = supabase_call(lambda: sb.table("user_progress").select("*").eq("user_id", user_id).execute())
        data = getattr(resp, 'data', None)
        return {r["topic"]: r for r in (data or [])}
    except Exception:
        # Fall back to local cache if Supabase not available
        return LOCAL_CACHE.get(user_id, {})
