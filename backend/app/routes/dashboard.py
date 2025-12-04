import logging
from flask import Blueprint, request
from ..errors import ApiError
from ..supabase_client import get_supabase
from ..utils import normalize_user_id
import time
from functools import lru_cache
from datetime import datetime, timedelta

logger = logging.getLogger('xenia')
dashboard_bp = Blueprint('dashboard', __name__)

# In-memory cache for dashboard data (per user, 10 second TTL)
_dashboard_cache: dict = {}
_DASHBOARD_CACHE_TTL = 10  # seconds


def _safe_exec(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as e:
        logger.warning(f"dashboard query failed: {e}")
        return None


def _get_cached_dashboard(user_id: str):
    """Check if we have a valid cached dashboard response."""
    if user_id in _dashboard_cache:
        cached_data, cached_time = _dashboard_cache[user_id]
        if time.time() - cached_time < _DASHBOARD_CACHE_TTL:
            return cached_data
    return None


def _set_dashboard_cache(user_id: str, data: dict):
    """Cache dashboard data for user."""
    _dashboard_cache[user_id] = (data, time.time())
    # Cleanup old entries (keep last 100)
    if len(_dashboard_cache) > 100:
        oldest_users = sorted(_dashboard_cache.keys(), 
                             key=lambda k: _dashboard_cache[k][1])[:50]
        for u in oldest_users:
            _dashboard_cache.pop(u, None)


@dashboard_bp.get('/')
def get_dashboard():
    """Return aggregated dashboard data for the authenticated user.

    Uses X-User-Id header for auth (normalized). Returns 401 if missing.
    """
    start = time.time()
    raw_user_id = request.headers.get('X-User-Id') or ''
    if not raw_user_id:
        raise ApiError('AUTH_401', 'Missing user id')
    user_id = normalize_user_id(raw_user_id)
    logger.info(f"dashboard.get for user={user_id}")
    if not user_id:
        raise ApiError('AUTH_401', 'Missing user id')

    # Check cache first for faster response
    cached = _get_cached_dashboard(user_id)
    if cached:
        dur = time.time() - start
        logger.info(f"dashboard.get completed for {user_id} in {dur:.3f}s (cache=true)")
        return cached

    sb = get_supabase()
    # Use a single transaction-like set of reads (Supabase client is REST-like)
    try:
        # Reduce limits for faster queries - most users don't need 1000 records
        # Sessions: last 90 days (limit 200 for perf)
        sessions_resp = _safe_exec(lambda: sb.table('sessions')
                                  .select('id, duration_min, topic, created_at, status')
                                  .eq('user_id', user_id)
                                  .order('created_at', desc=True)
                                  .limit(200)
                                  .execute())
        sessions = sessions_resp.data if sessions_resp and hasattr(sessions_resp, 'data') else []

        # Tasks / plan sessions (limit 100)
        tasks_resp = _safe_exec(lambda: sb.table('sessions')
                                .select('id, topic, date, duration_min, status, starts_at')
                                .eq('user_id', user_id)
                                .order('date', desc=False)
                                .limit(100)
                                .execute())
        tasks = tasks_resp.data if tasks_resp and hasattr(tasks_resp, 'data') else []

        # Quiz attempts from user_progress_history table (this is where record_quiz_result stores data)
        quizzes_resp = _safe_exec(lambda: sb.table('user_progress_history')
                                  .select('id, topic, score, correct, wrong, created_at')
                                  .eq('user_id', user_id)
                                  .order('created_at', desc=True)
                                  .limit(50)
                                  .execute())
        quizzes = quizzes_resp.data if quizzes_resp and hasattr(quizzes_resp, 'data') else []

        # Profile
        profile_resp = _safe_exec(lambda: sb.table('profiles')
                                  .select('user_id, xp, level, streak_days, last_active_date')
                                  .eq('user_id', user_id)
                                  .limit(1)
                                  .execute())
        profile = profile_resp.data[0] if profile_resp and getattr(profile_resp, 'data', None) else {}

        # Also fetch completed tasks from tasks table
        completed_tasks_resp = _safe_exec(lambda: sb.table('tasks')
                                          .select('id, topic, due_date, status')
                                          .eq('user_id', user_id)
                                          .eq('status', 'done')
                                          .limit(200)
                                          .execute())
        completed_tasks = completed_tasks_resp.data if completed_tasks_resp and hasattr(completed_tasks_resp, 'data') else []

        # Aggregations
        # Count sessions: any logged session counts as completed study time
        # Also count completed tasks as sessions
        sessions_from_log = len(sessions)  # All logged sessions count
        sessions_from_tasks = len(completed_tasks)  # Completed tasks
        sessions_completed = sessions_from_log + sessions_from_tasks
        
        # Total study time from logged sessions
        total_minutes = sum((s.get('duration_min') or 0) for s in sessions)
        # Add estimated time from completed tasks (30 min default per task)
        total_minutes += sum(30 for _ in completed_tasks)
        
        quizzes_taken = len(quizzes)

        # Weekly progress: group last 14 days (include both sessions and completed tasks)
        from datetime import datetime, timedelta
        today = datetime.utcnow().date()
        start_date = today - timedelta(days=13)
        weekly = []
        for i in range(14):
            d = start_date + timedelta(days=i)
            d_str = d.isoformat()
            # Minutes from logged sessions
            minutes = sum((int(s.get('duration_min') or 0) for s in sessions if s.get('created_at', '').startswith(d_str)),)
            # Also count completed tasks for this day (30 min each)
            tasks_on_day = sum(1 for t in completed_tasks if (t.get('due_date') or '').startswith(d_str))
            minutes += tasks_on_day * 30
            weekly.append({'date': d_str, 'minutes': minutes})

        # Subject performance and distribution
        subj_map = {}
        for s in sessions:
            topic = s.get('topic') or 'General'
            subj_map.setdefault(topic, 0)
            subj_map[topic] += int(s.get('duration_min') or 0)
        subject_distribution = [{'subject': k, 'minutes': v} for k, v in subj_map.items()]

        # Compose studyProgressTimeline as daily totals (reuse weekly for simplicity)
        study_timeline = weekly

        # Upcoming sessions: from tasks where date >= today
        upcoming = []
        for t in tasks:
            try:
                starts = t.get('starts_at') or t.get('date')
                upcoming.append({
                    'id': t.get('id'),
                    'title': t.get('topic'),
                    'durationMin': t.get('duration_min') or 30,
                    'startsAt': starts,
                    'status': t.get('status') or 'scheduled'
                })
            except Exception:
                continue

        # Recent achievements: reuse gamification service if present
        achievements = []
        try:
            from ..services.gamification import list_recent_achievements
            achievements = list_recent_achievements(user_id) or []
        except Exception:
            achievements = []

        # Quizzes details - map from user_progress_history fields
        quizzes_details = [
            {
                'id': q.get('id'), 
                'title': q.get('topic', 'Quiz'),  # topic as title
                'score': q.get('score', 0), 
                'correct': q.get('correct', 0),
                'wrong': q.get('wrong', 0),
                'takenAt': q.get('created_at')
            } for q in quizzes
        ]

        payload = {
            'stats': {
                'sessionsCompleted': sessions_completed,
                'sessionPercent': 100 if sessions_completed > 0 else 0,  # Logged sessions are 100% complete
                'totalStudyTimeMin': total_minutes,
                'currentStreakDays': int(profile.get('streak_days') or 0),
                'topicsTracked': len(subj_map),
                'quizzesTaken': quizzes_taken
            },
            'weeklyProgress': weekly,
            'subjectPerformance': [],
            'subjectDistribution': subject_distribution,
            'studyProgressTimeline': study_timeline,
            'upcomingSessions': upcoming,
            'recentAchievements': achievements,
            'quizzesTakenDetails': quizzes_details
        }

        # Cache the result for subsequent requests
        _set_dashboard_cache(user_id, payload)

        dur = time.time() - start
        logger.info(f"dashboard.get completed for {user_id} in {dur:.3f}s (cache=false)")
        return payload
    except ApiError:
        raise
    except Exception as e:
        logger.error(f"dashboard aggregation failed: {e}")
        raise ApiError('DASH_500', 'Dashboard aggregation failed')
