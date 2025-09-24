import logging
import threading
import time
from flask import Blueprint, request
from ..errors import ApiError
from ..services.ai_providers import get_topic_resources
from ..supabase_client import get_supabase
from ..utils import normalize_user_id, get_user_id_from_request

logger = logging.getLogger('xenia')
ai_bp = Blueprint('ai', __name__)


# Simple in-memory TTL cache for topic resources
# Key: (topic, learning_style, difficulty, free_only, user_id)
# Value: (expiry_ts, resources_list)
_cache_lock = threading.Lock()
_resources_cache = {}
_DEFAULT_TTL = int(60 * 5)  # 5 minutes


def _parse_duration_minutes(value):
    """Try to parse duration strings like '15 minutes', '1.5 hours', or numeric minutes."""
    if value is None:
        return None
    try:
        if isinstance(value, (int, float)):
            return int(value)
        s = str(value).lower().strip()
        # formats: '15 minutes', '15 min', '1.5 hours', '1 hour', '90m'
        if 'hour' in s:
            # extract number before 'hour'
            num = float(re.findall(r"[0-9]+\.?[0-9]*", s)[0])
            return int(num * 60)
        if 'min' in s or 'minute' in s or s.endswith('m'):
            num = float(re.findall(r"[0-9]+\.?[0-9]*", s)[0])
            return int(num)
        # fallback: try plain number
        num = float(re.findall(r"[0-9]+\.?[0-9]*", s)[0])
        return int(num)
    except Exception:
        return None


@ai_bp.get('/get-resources')
def get_resources():
    """Return a list of recommended resources for provided topics.
    Query params: topics=topic1,topic2&max=8
    This implementation delegates to the ai_providers.get_topic_resources function and
    normalizes the results to a flat list the frontend expects.
    """
    topics = request.args.get('topics', '')
    max_items = int(request.args.get('max', '8'))
    if not topics:
        return {'resources': []}

    topics_list = [t.strip() for t in topics.split(',') if t.strip()]

    learning_style = request.args.get('learning_style', 'balanced')
    difficulty = request.args.get('difficulty', 'intermediate')
    free_only = request.args.get('free_only', 'true').lower() == 'true'

    # Try to obtain user id and profile preferences
    raw_uid = get_user_id_from_request(request) or request.headers.get('X-User-Id') or ''
    user_id = normalize_user_id(raw_uid) if raw_uid else ''

    profile_prefs = {}
    if user_id:
        try:
            sb = get_supabase()
            # Query profiles table - fields may include preferred_formats, time_available, learning_style
            resp = sb.table('profiles').select('*').eq('user_id', user_id).limit(1).execute()
            if resp and getattr(resp, 'data', None):
                profile = resp.data[0]
                # Extract some known preferences if present
                pf = profile.get('preferred_formats') or profile.get('preferred_format') or None
                if pf:
                    # stored as comma-separated or list
                    if isinstance(pf, str):
                        profile_prefs['preferred_formats'] = [x.strip() for x in pf.split(',') if x.strip()]
                    elif isinstance(pf, list):
                        profile_prefs['preferred_formats'] = pf
                if profile.get('time_available'):
                    profile_prefs['time_available'] = profile.get('time_available')
                if profile.get('learning_style'):
                    profile_prefs['learning_style'] = profile.get('learning_style')
                if profile.get('free_resources_only') is not None:
                    profile_prefs['free_resources_only'] = bool(profile.get('free_resources_only'))
        except Exception as e:
            logger.warning(f"Failed to fetch profile for user {user_id}: {e}")

    # Merge query params -> profile prefs (query params take precedence)
    user_preferences = dict(profile_prefs)
    user_preferences.update({
        'preferred_formats': request.args.getlist('formats') or user_preferences.get('preferred_formats'),
        'time_available': request.args.get('time') or user_preferences.get('time_available'),
        'free_resources_only': free_only if 'free_resources_only' not in user_preferences else user_preferences.get('free_resources_only')
    })

    resources = []
    now_ts = int(time.time())

    for t in topics_list:
        cache_key = (t, learning_style, difficulty, bool(user_preferences.get('free_resources_only', free_only)), user_id)

        # Check cache
        with _cache_lock:
            entry = _resources_cache.get(cache_key)
            if entry and entry[0] > now_ts:
                logger.debug(f"Cache hit for {cache_key}")
                resources.extend(entry[1])
                continue

        # Cache miss - call provider
        try:
            provider_result = get_topic_resources(
                topic=t,
                learning_style=learning_style or user_preferences.get('learning_style', 'balanced'),
                difficulty_level=difficulty,
                user_preferences=user_preferences
            )

            gathered = []
            # youtube_videos
            for v in provider_result.get('youtube_videos', [])[:6]:
                duration_min = _parse_duration_minutes(v.get('duration') or v.get('duration_min') or v.get('length'))
                item = {
                    'type': 'video',
                    'title': v.get('title') or v.get('channel') or f'{t} video',
                    'url': v.get('url'),
                    'duration': duration_min,
                    'difficulty': v.get('difficulty'),
                    'relevanceScore': float(v.get('personalization_match') or v.get('recommendation_score') or v.get('rating') or 5),
                    'topic': t
                }
                gathered.append(item)

            # articles_and_guides
            for a in provider_result.get('articles_and_guides', [])[:6]:
                duration_min = _parse_duration_minutes(a.get('read_time') or a.get('duration'))
                item = {
                    'type': 'article',
                    'title': a.get('title'),
                    'url': a.get('url'),
                    'duration': duration_min,
                    'difficulty': a.get('level') or a.get('difficulty'),
                    'relevanceScore': float(a.get('quality_score') or a.get('personalization_match') or 5),
                    'topic': t
                }
                gathered.append(item)

            # practice_platforms
            for p in provider_result.get('practice_platforms', [])[:4]:
                duration_min = _parse_duration_minutes(p.get('estimated_completion'))
                item = {
                    'type': p.get('type') or 'practice',
                    'title': p.get('name') or p.get('title') or f'{t} practice',
                    'url': p.get('url'),
                    'duration': duration_min,
                    'difficulty': None,
                    'relevanceScore': float(p.get('recommendation_score') or 6),
                    'topic': t
                }
                gathered.append(item)

            # documentation, interactive_tools, books -> map to article/tool
            for d in provider_result.get('documentation', [])[:3]:
                gathered.append({
                    'type': 'documentation',
                    'title': d.get('title') or d.get('name') or f'{t} docs',
                    'url': d.get('url'),
                    'duration': None,
                    'difficulty': None,
                    'relevanceScore': float(d.get('recommendation_score') or 5),
                    'topic': t
                })

            # Write to cache
            expiry = now_ts + _DEFAULT_TTL
            with _cache_lock:
                _resources_cache[cache_key] = (expiry, gathered)

            resources.extend(gathered)

        except Exception as e:
            logger.error(f"AI provider failed for topic {t}: {e}")
            continue

    # de-duplicate by url or title
    seen = set()
    deduped = []
    for r in resources:
        key = (r.get('url') or r.get('title'))
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(r)

    # Ensure relevanceScore exists and is numeric
    for r in deduped:
        try:
            r['relevanceScore'] = float(r.get('relevanceScore') or 5.0)
        except Exception:
            r['relevanceScore'] = 5.0

    # simple ranking: sort by relevanceScore desc, then shorter duration first
    deduped = sorted(deduped, key=lambda r: (-r.get('relevanceScore', 0), (r.get('duration') if r.get('duration') is not None else 9999)))

    return {'resources': deduped[:max_items]}
