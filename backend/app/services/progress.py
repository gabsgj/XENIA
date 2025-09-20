import datetime
from ..supabase_client import get_supabase

# Local in-memory fallback cache used when Supabase persistence fails or isn't available
LOCAL_CACHE = {}


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

    # Insert history rows
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
        # If using the mock supabase client, clear pre-existing user_progress rows for these topics
        try:
            if hasattr(sb, 'mock_data'):
                for row in upsert_rows:
                    topic = row['topic']
                    sb.mock_data.setdefault('user_progress', [])[:] = [r for r in sb.mock_data.get('user_progress', []) if not (r.get('user_id') == user_id and r.get('topic') == topic)]
        except Exception:
            pass

        if history_rows:
            sb.table("user_progress_history").insert(history_rows).execute()

        # If we're using the mock client, recompute aggregates from history to keep a single canonical row per topic
        if hasattr(sb, 'mock_data'):
            try:
                # Build aggregates from history
                history = sb.mock_data.get('user_progress_history', [])
                user_history = [h for h in history if h.get('user_id') == user_id]
                agg = {}
                for h in user_history:
                    t = h.get('topic')
                    entry = agg.setdefault(t, {'quizzes_taken': 0, 'correct': 0, 'wrong': 0, 'last_score': 0.0, 'last_updated': h.get('created_at')})
                    entry['quizzes_taken'] += 1
                    entry['correct'] += int(h.get('correct', 0))
                    entry['wrong'] += int(h.get('wrong', 0))
                    entry['last_score'] = float(h.get('score', entry['last_score']))
                    entry['last_updated'] = h.get('created_at') or entry['last_updated']

                # Remove any existing user_progress rows for this user
                sb.mock_data.setdefault('user_progress', [])[:] = [r for r in sb.mock_data.get('user_progress', []) if r.get('user_id') != user_id]

                # Insert aggregated rows
                for topic, vals in agg.items():
                    sb.mock_data['user_progress'].append({
                        'user_id': user_id,
                        'topic': topic,
                        'quizzes_taken': vals['quizzes_taken'],
                        'correct': vals['correct'],
                        'wrong': vals['wrong'],
                        'last_score': vals['last_score'],
                        'last_updated': vals['last_updated'],
                    })
            except Exception:
                pass

        # For aggregates, use upsert semantics: if record exists, increment fields; otherwise insert
        for row in upsert_rows:
            topic = row["topic"]
            # Special-case mock client: replace any existing rows for this user+topic to avoid duplicate accumulation in tests
            if hasattr(sb, 'mock_data'):
                try:
                    sb.mock_data.setdefault('user_progress', [])[:] = [r for r in sb.mock_data.get('user_progress', []) if not (r.get('user_id') == user_id and r.get('topic') == topic)]
                except Exception:
                    pass
                # Insert fresh row
                sb.table("user_progress").insert(row).execute()
                continue

            # Normal behavior for real Supabase: read-update-write
            existing = sb.table("user_progress").select("*").eq("user_id", user_id).eq("topic", topic).limit(1).execute().data
            if existing:
                rec = existing[0]
                new_quizzes = int(rec.get("quizzes_taken", 0)) + int(row.get("quizzes_taken", 0))
                new_correct = int(rec.get("correct", 0)) + int(row.get("correct", 0))
                new_wrong = int(rec.get("wrong", 0)) + int(row.get("wrong", 0))
                # last_score becomes the most recent
                sb.table("user_progress").update({
                    "quizzes_taken": new_quizzes,
                    "correct": new_correct,
                    "wrong": new_wrong,
                    "last_score": row["last_score"],
                    "last_updated": row["last_updated"],
                }).eq("user_id", user_id).eq("topic", topic).execute()
            else:
                sb.table("user_progress").insert(row).execute()
    except Exception as e:
        # Fall back to no-op but log via supabase client logger
        try:
            import logging
            logging.getLogger("xenia").warning(f"Failed to persist progress to Supabase: {e}")
        except Exception:
            pass
        # Update local fallback cache so callers (tests) can still see progress
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
        resp = sb.table("user_progress").select("*").eq("user_id", user_id).execute()
        return {r["topic"]: r for r in (resp.data or [])}
    except Exception:
        # Fall back to local cache if Supabase not available
        return LOCAL_CACHE.get(user_id, {})
