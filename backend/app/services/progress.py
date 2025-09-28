import datetime
import logging
from ..supabase_client import get_supabase, supabase_call
from ..utils import is_valid_uuid
import time
from collections import defaultdict
from threading import Lock, Thread

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

    # In development/tests where user_id is not a UUID, persist to LOCAL_CACHE to avoid touching real DB
    if not is_valid_uuid(user_id):
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
        return

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
    # For dev/test users (non-UUID), read from local cache only
    if not is_valid_uuid(user_id):
        return LOCAL_CACHE.get(user_id, {})
    sb = get_supabase()
    try:
        resp = supabase_call(lambda: sb.table("user_progress").select("*").eq("user_id", user_id).execute())
        data = getattr(resp, 'data', None)
        if not data:
            # If no rows (or mock not storing), fall back to local cache collected via record_quiz_result
            return LOCAL_CACHE.get(user_id, {})
        return {r.get("topic"): r for r in (data or []) if r.get("topic")}
    except Exception:
        # Fall back to local cache if Supabase not available
        return LOCAL_CACHE.get(user_id, {})


class ProgressBatcher:
    """Batch and deduplicate progress updates within a short time window.

    - pending_updates: {user_id: [session_dict,...]}
    - batch_window: seconds window to aggregate updates before flushing
    """
    def __init__(self, batch_window: float = 0.5):
        self.pending_updates = defaultdict(list)
        self.last_flush = time.time()
        self.lock = Lock()
        self.batch_window = float(batch_window)
        self._running = True
        # background flusher thread
        self._flusher = Thread(target=self._periodic_flush, daemon=True)
        self._flusher.start()

    def add_update(self, user_id, update_data):
        key = f"{update_data.get('topic','')}_{update_data.get('date','')}_{update_data.get('status','')}"
        with self.lock:
            # remove existing for same topic+date, keep latest
            self.pending_updates[user_id] = [
                u for u in self.pending_updates[user_id]
                if f"{u.get('topic','')}_{u.get('date','')}_{u.get('status','')}" != key
            ]
            self.pending_updates[user_id].append(update_data)

            # immediate flush if window already passed
            if time.time() - self.last_flush > self.batch_window:
                self.flush_all()

    def flush_all(self):
        with self.lock:
            items = dict(self.pending_updates)
            self.pending_updates.clear()
            self.last_flush = time.time()

        for user_id, updates in items.items():
            if not updates:
                continue
            try:
                # Transform session updates into topic_scores suitable for record_quiz_result
                topic_scores = []
                for s in updates:
                    # Map session fields to a minimal score record; this can be extended
                    topic_scores.append({
                        "topic": s.get("topic"),
                        "correct": int(s.get("correct", 0)),
                        "wrong": int(s.get("wrong", 0)),
                        "score": float(s.get("score", 0.0)),
                    })
                # Persist in a single call
                record_quiz_result(user_id, topic_scores)
            except Exception as e:
                logger.warning(f"Failed to flush progress for user {user_id}: {e}")

    def _periodic_flush(self):
        # flush periodically while running
        while self._running:
            try:
                time.sleep(self.batch_window)
                self.flush_all()
            except Exception:
                pass

    def stop(self):
        self._running = False
        try:
            self._flusher.join(timeout=1.0)
        except Exception:
            pass


# Module-level batcher used by endpoints
progress_batcher = ProgressBatcher()
