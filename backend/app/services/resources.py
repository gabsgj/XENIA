"""Resource recommendation service.
Fetches external educational resources (YouTube, OpenCourseWare, docs) for a list of topics
and stores them in Supabase. Uses only free/public endpoints.
"""
from __future__ import annotations
import os
import json
import time
import urllib.parse
from typing import List, Dict, Any
import httpx
from ..supabase_client import get_supabase

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")  # Optional; if absent use search scraping fallback
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEO_FIELDS = "items(id/videoId,snippet/title,snippet/channelTitle,snippet/publishedAt)"

# Basic public catalog sources (static endpoints or curated lists)
OPENCOURSEWARE_INDEX = [
    {"title": "MIT OpenCourseWare", "url": "https://ocw.mit.edu"},
    {"title": "Khan Academy", "url": "https://www.khanacademy.org"},
    {"title": "Coursera Free Courses", "url": "https://www.coursera.org/courses?query={query}"},
    {"title": "edX", "url": "https://www.edx.org/search?q={query}"},
]

DOC_SOURCES = [
    ("wikipedia", "https://en.wikipedia.org/wiki/{query}"),
    ("wikibooks", "https://en.wikibooks.org/wiki/{query}"),
]

HEADERS = {"User-Agent": "XENIA-EduBot/1.0 (+https://example.com)"}


def _safe_get_json(url: str, params: Dict[str, Any] | None = None, timeout: float = 10.0) -> Dict[str, Any] | None:
    try:
        with httpx.Client(timeout=timeout, headers=HEADERS, follow_redirects=True) as client:
            r = client.get(url, params=params)
            if r.status_code == 200:
                try:
                    return r.json()
                except Exception:
                    return None
    except Exception:
        return None
    return None


def _youtube_search(query: str, max_results: int = 3, learning_style: str = None) -> List[Dict[str, Any]]:
    if not YOUTUBE_API_KEY:
        # Fallback: use ytsearch via no API key not allowed; return empty list to avoid scraping policies
        return []
    
    # Enhance query based on learning style
    enhanced_query = query
    if learning_style:
        if learning_style.lower() in ["visual", "kinesthetic"]:
            enhanced_query = f"{query} tutorial demonstration"
        elif learning_style.lower() == "auditory":
            enhanced_query = f"{query} lecture explanation"
        elif learning_style.lower() == "reading":
            enhanced_query = f"{query} step by step guide"
    
    params = {
        "part": "snippet",
        "q": enhanced_query,
        "type": "video",
        "maxResults": str(max_results),
        "key": YOUTUBE_API_KEY,
        "fields": YOUTUBE_VIDEO_FIELDS,
        "safeSearch": "moderate",
    }
    data = _safe_get_json(YOUTUBE_SEARCH_URL, params=params) or {}
    items = data.get("items", [])
    videos = []
    for it in items:
        vid = it.get("id", {}).get("videoId")
        snippet = it.get("snippet", {})
        if not vid:
            continue
        videos.append({
            "source": "youtube",
            "title": snippet.get("title"),
            "url": f"https://www.youtube.com/watch?v={vid}",
            "metadata": {
                "channel": snippet.get("channelTitle"),
                "published_at": snippet.get("publishedAt"),
                "learning_style": learning_style,
                "enhanced_query": enhanced_query,
            },
        })
    return videos


def _ocw_links(query: str) -> List[Dict[str, Any]]:
    q = urllib.parse.quote(query)
    resources: List[Dict[str, Any]] = []
    for entry in OPENCOURSEWARE_INDEX:
        url = entry["url"].format(query=q)
        resources.append({
            "source": "ocw",
            "title": entry["title"],
            "url": url,
            "metadata": {},
        })
    return resources[:3]


def _doc_links(query: str) -> List[Dict[str, Any]]:
    q = urllib.parse.quote(query.replace(" ", "_"))
    results = []
    for name, tmpl in DOC_SOURCES:
        results.append({
            "source": name,
            "title": f"{query} - {name}",
            "url": tmpl.format(query=q),
            "metadata": {},
        })
    return results


def fetch_resources_for_topic(topic: str, learning_style: str = None, topic_metadata: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    resources: List[Dict[str, Any]] = []
    
    # Use enhanced search based on topic metadata if available
    search_query = topic
    if topic_metadata:
        category = topic_metadata.get("category", "")
        if category:
            search_query = f"{category} {topic}"
    
    # YouTube with learning style enhancement
    try:
        resources.extend(_youtube_search(search_query, learning_style=learning_style))
    except Exception:
        pass
    # OCW/MOOC catalogs
    try:
        resources.extend(_ocw_links(search_query))
    except Exception:
        pass
    # Documentation style
    try:
        resources.extend(_doc_links(search_query))
    except Exception:
        pass
    return resources


def fetch_and_store_resources_for_topics(user_id: str, topics: List[str], max_per_topic: int = 6) -> None:
    sb = get_supabase()
    for t in topics:
        res_list = fetch_resources_for_topic(t)[:max_per_topic]
        rows = []
        for r in res_list:
            rows.append({
                "user_id": user_id,
                "topic": t,
                "source": r["source"],
                "title": r["title"],
                "url": r["url"],
                "metadata": json.dumps(r.get("metadata") or {}),
            })
        if rows:
            try:
                sb.table("resources").insert(rows).execute()
            except Exception as e:
                # Duplicate or constraint: ignore silently
                if 'duplicate' not in str(e).lower():
                    print(f"Resource insert failed for topic {t}: {e}")
        time.sleep(0.2)  # small throttle


def get_resources(user_id: str) -> List[Dict[str, Any]]:
    sb = get_supabase()
    try:
        resp = sb.table("resources").select("topic, source, title, url, metadata").eq("user_id", user_id).limit(500).execute()
        return resp.data or []
    except Exception:
        return []
