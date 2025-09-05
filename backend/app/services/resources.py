"""Enhanced resource recommendation service.
Fetches external educational resources with AI-powered personalization, quality scoring,
and comprehensive content discovery from multiple sources.
"""
from __future__ import annotations
import os
import json
import time
import urllib.parse
from typing import List, Dict, Any, Optional
import httpx
from ..supabase_client import get_supabase

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")  # Optional; if absent use search scraping fallback
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEO_FIELDS = "items(id/videoId,snippet/title,snippet/channelTitle,snippet/publishedAt,snippet/description)"

# Enhanced catalog sources with quality ratings
OPENCOURSEWARE_INDEX = [
    {"title": "MIT OpenCourseWare", "url": "https://ocw.mit.edu", "quality": 9, "type": "university"},
    {"title": "Khan Academy", "url": "https://www.khanacademy.org", "quality": 9, "type": "interactive"},
    {"title": "Coursera Free Courses", "url": "https://www.coursera.org/courses?query={query}", "quality": 8, "type": "mooc"},
    {"title": "edX", "url": "https://www.edx.org/search?q={query}", "quality": 8, "type": "mooc"},
    {"title": "freeCodeCamp", "url": "https://www.freecodecamp.org", "quality": 8, "type": "interactive"},
    {"title": "Codecademy", "url": "https://www.codecademy.com", "quality": 7, "type": "interactive"},
    {"title": "W3Schools", "url": "https://www.w3schools.com", "quality": 7, "type": "reference"},
    {"title": "MDN Web Docs", "url": "https://developer.mozilla.org", "quality": 9, "type": "reference"},
]

# Enhanced documentation sources with subject-specific resources
DOC_SOURCES = [
    ("wikipedia", "https://en.wikipedia.org/wiki/{query}", 6),
    ("wikibooks", "https://en.wikibooks.org/wiki/{query}", 7),
    ("stack_overflow", "https://stackoverflow.com/search?q={query}", 8),
    ("github", "https://github.com/search?q={query}", 7),
    ("medium", "https://medium.com/search?q={query}", 6),
    ("dev_to", "https://dev.to/search?q={query}", 7),
]

# Subject-specific resource pools
SUBJECT_RESOURCES = {
    "mathematics": [
        {"name": "Wolfram MathWorld", "url": "https://mathworld.wolfram.com", "quality": 9},
        {"name": "Paul's Online Math Notes", "url": "https://tutorial.math.lamar.edu", "quality": 8},
        {"name": "3Blue1Brown", "url": "https://www.3blue1brown.com", "quality": 9},
        {"name": "Desmos Calculator", "url": "https://www.desmos.com/calculator", "quality": 8},
    ],
    "programming": [
        {"name": "LeetCode", "url": "https://leetcode.com", "quality": 8},
        {"name": "HackerRank", "url": "https://www.hackerrank.com", "quality": 8},
        {"name": "Replit", "url": "https://replit.com", "quality": 7},
        {"name": "CodePen", "url": "https://codepen.io", "quality": 7},
    ],
    "science": [
        {"name": "Crash Course", "url": "https://www.youtube.com/c/crashcourse", "quality": 9},
        {"name": "SciShow", "url": "https://www.youtube.com/c/scishow", "quality": 8},
        {"name": "National Geographic", "url": "https://www.nationalgeographic.com", "quality": 8},
    ],
    "language": [
        {"name": "Duolingo", "url": "https://www.duolingo.com", "quality": 8},
        {"name": "SparkNotes", "url": "https://www.sparknotes.com", "quality": 7},
        {"name": "Grammar Girl", "url": "https://www.quickanddirtytips.com/grammar-girl", "quality": 7},
    ]
}

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


def _youtube_search(query: str, max_results: int = 5, learning_style: str = None, difficulty: str = None) -> List[Dict[str, Any]]:
    """Enhanced YouTube search with learning style optimization and quality filtering."""
    if not YOUTUBE_API_KEY:
        # Fallback: use ytsearch via no API key not allowed; return empty list to avoid scraping policies
        return []
    
    # Enhanced query construction based on learning style and difficulty
    enhanced_query = query
    if learning_style:
        if learning_style.lower() in ["visual", "kinesthetic"]:
            enhanced_query = f"{query} tutorial demonstration visual"
        elif learning_style.lower() == "auditory":
            enhanced_query = f"{query} lecture explanation podcast"
        elif learning_style.lower() == "reading":
            enhanced_query = f"{query} step by step guide walkthrough"
    
    # Add difficulty-specific terms
    if difficulty:
        if difficulty.lower() == "beginner":
            enhanced_query += " beginner basics introduction"
        elif difficulty.lower() == "intermediate":
            enhanced_query += " intermediate practical examples"
        elif difficulty.lower() == "advanced":
            enhanced_query += " advanced masterclass expert"
    
    params = {
        "part": "snippet",
        "q": enhanced_query,
        "type": "video",
        "maxResults": str(max_results),
        "key": YOUTUBE_API_KEY,
        "fields": YOUTUBE_VIDEO_FIELDS,
        "safeSearch": "moderate",
        "order": "relevance",
        "videoDefinition": "any",
        "videoDuration": "medium"  # Prefer 4-20 minute videos
    }
    
    data = _safe_get_json(YOUTUBE_SEARCH_URL, params=params) or {}
    items = data.get("items", [])
    videos = []
    
    # Quality filtering keywords
    high_quality_channels = ["3blue1brown", "khan academy", "crash course", "freecodecamp", 
                           "mit opencourseware", "stanford", "harvard", "coursera"]
    
    for it in items:
        vid = it.get("id", {}).get("videoId")
        snippet = it.get("snippet", {})
        if not vid:
            continue
            
        channel_title = snippet.get("channelTitle", "").lower()
        video_title = snippet.get("title", "").lower()
        description = snippet.get("description", "").lower()
        
        # Calculate quality score
        quality_score = 5  # Base score
        
        # Boost score for high-quality channels
        if any(hq_channel in channel_title for hq_channel in high_quality_channels):
            quality_score += 3
            
        # Boost for educational keywords in title
        educational_keywords = ["tutorial", "explained", "guide", "course", "lecture", "learn"]
        quality_score += sum(2 for keyword in educational_keywords if keyword in video_title)
        
        # Boost for comprehensive content indicators
        if any(word in video_title for word in ["complete", "comprehensive", "full", "master"]):
            quality_score += 1
            
        videos.append({
            "source": "youtube",
            "title": snippet.get("title"),
            "url": f"https://www.youtube.com/watch?v={vid}",
            "quality_score": min(quality_score, 10),
            "metadata": {
                "channel": snippet.get("channelTitle"),
                "published_at": snippet.get("publishedAt"),
                "learning_style": learning_style,
                "difficulty": difficulty,
                "enhanced_query": enhanced_query,
                "description_snippet": snippet.get("description", "")[:200],
                "educational_indicators": [kw for kw in educational_keywords if kw in video_title]
            },
        })
    
    # Sort by quality score
    videos.sort(key=lambda x: x["quality_score"], reverse=True)
    return videos


def _ocw_links(query: str) -> List[Dict[str, Any]]:
    """Enhanced OpenCourseWare links with quality scoring."""
    q = urllib.parse.quote(query)
    resources: List[Dict[str, Any]] = []
    for entry in OPENCOURSEWARE_INDEX:
        url = entry["url"].format(query=q) if "{query}" in entry["url"] else entry["url"]
        resources.append({
            "source": "ocw",
            "title": entry["title"],
            "url": url,
            "quality_score": entry.get("quality", 7),
            "metadata": {
                "type": entry.get("type", "general"),
                "provider": entry["title"]
            },
        })
    
    # Sort by quality score
    resources.sort(key=lambda x: x["quality_score"], reverse=True)
    return resources[:4]


def _doc_links(query: str) -> List[Dict[str, Any]]:
    """Enhanced documentation links with source quality scoring."""
    q = urllib.parse.quote(query.replace(" ", "_"))
    results = []
    for name, tmpl, quality in DOC_SOURCES:
        results.append({
            "source": name,
            "title": f"{query} - {name.replace('_', ' ').title()}",
            "url": tmpl.format(query=q),
            "quality_score": quality,
            "metadata": {
                "source_type": "documentation",
                "search_query": query
            },
        })
    
    # Sort by quality score
    results.sort(key=lambda x: x["quality_score"], reverse=True)
    return results[:3]


def _get_subject_specific_resources(topic: str, subject_category: str) -> List[Dict[str, Any]]:
    """Get subject-specific high-quality resources."""
    resources = []
    
    if subject_category in SUBJECT_RESOURCES:
        for resource in SUBJECT_RESOURCES[subject_category]:
            resources.append({
                "source": "subject_specific",
                "title": f"{topic} - {resource['name']}",
                "url": resource["url"],
                "quality_score": resource["quality"],
                "metadata": {
                    "category": subject_category,
                    "provider": resource["name"],
                    "specialization": "subject_expert"
                }
            })
    
    return resources


def fetch_resources_for_topic(topic: str, learning_style: str = None, topic_metadata: Dict[str, Any] = None, 
                            user_preferences: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Enhanced resource fetching with personalization and quality scoring."""
    resources: List[Dict[str, Any]] = []
    
    # Extract metadata for better resource targeting
    difficulty = topic_metadata.get("difficulty_score", 5) if topic_metadata else 5
    category = topic_metadata.get("category", "general") if topic_metadata else "general"
    
    # Map difficulty score to difficulty level
    if difficulty <= 3:
        difficulty_level = "beginner"
    elif difficulty <= 7:
        difficulty_level = "intermediate"
    else:
        difficulty_level = "advanced"
    
    # Use enhanced search based on topic metadata
    search_query = topic
    if topic_metadata:
        if category and category != "general":
            search_query = f"{category} {topic}"
    
    # Determine subject category for specialized resources
    subject_category = _determine_subject_category(topic, category)
    
    # 1. YouTube with enhanced targeting
    try:
        youtube_resources = _youtube_search(search_query, max_results=5, 
                                          learning_style=learning_style, 
                                          difficulty=difficulty_level)
        resources.extend(youtube_resources)
    except Exception:
        pass
    
    # 2. Subject-specific high-quality resources
    try:
        subject_resources = _get_subject_specific_resources(topic, subject_category)
        resources.extend(subject_resources)
    except Exception:
        pass
    
    # 3. OCW/MOOC catalogs
    try:
        ocw_resources = _ocw_links(search_query)
        resources.extend(ocw_resources)
    except Exception:
        pass
    
    # 4. Documentation and reference sources
    try:
        doc_resources = _doc_links(search_query)
        resources.extend(doc_resources)
    except Exception:
        pass
    
    # 5. Apply personalization filters
    if user_preferences:
        resources = _apply_personalization_filters(resources, user_preferences)
    
    # 6. Sort by quality score and diversify sources
    resources = _rank_and_diversify_resources(resources)
    
    # 7. Add recommendation metadata
    for resource in resources:
        resource["recommendation_score"] = _calculate_recommendation_score(
            resource, topic, learning_style, difficulty_level
        )
        resource["personalization_tags"] = _generate_personalization_tags(
            resource, learning_style, difficulty_level
        )
    
    return resources[:12]  # Return top 12 resources


def _determine_subject_category(topic: str, category: str) -> str:
    """Determine the broad subject category for specialized resource selection."""
    topic_lower = topic.lower()
    
    # Programming/CS terms
    if any(term in topic_lower for term in ["programming", "code", "algorithm", "data structure", "software", "web", "api", "javascript", "python", "java", "css", "html"]):
        return "programming"
    
    # Mathematics terms
    if any(term in topic_lower for term in ["math", "algebra", "calculus", "geometry", "statistics", "equation", "formula", "theorem", "proof"]):
        return "mathematics"
    
    # Science terms
    if any(term in topic_lower for term in ["physics", "chemistry", "biology", "science", "experiment", "theory", "hypothesis"]):
        return "science"
    
    # Language terms
    if any(term in topic_lower for term in ["english", "literature", "writing", "grammar", "language", "essay", "reading"]):
        return "language"
    
    # Use provided category as fallback
    return category if category in SUBJECT_RESOURCES else "general"


def _apply_personalization_filters(resources: List[Dict[str, Any]], 
                                 user_preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Apply user preference filters to resources."""
    filtered_resources = []
    
    # Get user preferences
    preferred_sources = user_preferences.get("preferred_sources", [])
    avoid_sources = user_preferences.get("avoid_sources", [])
    min_quality = user_preferences.get("min_quality_score", 5)
    free_only = user_preferences.get("free_only", False)
    
    for resource in resources:
        # Skip if source should be avoided
        if resource["source"] in avoid_sources:
            continue
            
        # Skip if quality too low
        if resource.get("quality_score", 5) < min_quality:
            continue
            
        # Skip paid resources if free_only is True
        if free_only and resource.get("metadata", {}).get("free") is False:
            continue
            
        filtered_resources.append(resource)
    
    # Boost preferred sources
    if preferred_sources:
        for resource in filtered_resources:
            if resource["source"] in preferred_sources:
                resource["quality_score"] = resource.get("quality_score", 5) + 2
    
    return filtered_resources


def _rank_and_diversify_resources(resources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Rank resources by quality and ensure source diversity."""
    # Sort by quality score first
    resources.sort(key=lambda x: x.get("quality_score", 5), reverse=True)
    
    # Diversify sources to avoid all resources from one source
    diversified = []
    source_counts = {}
    max_per_source = 3
    
    for resource in resources:
        source = resource["source"]
        current_count = source_counts.get(source, 0)
        
        if current_count < max_per_source:
            diversified.append(resource)
            source_counts[source] = current_count + 1
    
    return diversified


def _calculate_recommendation_score(resource: Dict[str, Any], topic: str, 
                                  learning_style: str, difficulty_level: str) -> float:
    """Calculate a comprehensive recommendation score for a resource."""
    base_score = resource.get("quality_score", 5)
    
    # Boost for learning style match
    if learning_style:
        metadata = resource.get("metadata", {})
        if metadata.get("learning_style") == learning_style:
            base_score += 1
    
    # Boost for difficulty match
    if difficulty_level:
        metadata = resource.get("metadata", {})
        if metadata.get("difficulty") == difficulty_level:
            base_score += 1
    
    # Boost for educational indicators
    educational_indicators = resource.get("metadata", {}).get("educational_indicators", [])
    base_score += len(educational_indicators) * 0.5
    
    # Boost for subject specialization
    if resource.get("metadata", {}).get("specialization") == "subject_expert":
        base_score += 2
    
    return min(base_score, 10)


def _generate_personalization_tags(resource: Dict[str, Any], learning_style: str, 
                                 difficulty_level: str) -> List[str]:
    """Generate tags explaining why this resource was recommended."""
    tags = []
    
    # Quality tags
    quality_score = resource.get("quality_score", 5)
    if quality_score >= 9:
        tags.append("high_quality")
    elif quality_score >= 7:
        tags.append("good_quality")
    
    # Learning style tags
    if learning_style:
        metadata = resource.get("metadata", {})
        if metadata.get("learning_style") == learning_style:
            tags.append(f"matches_{learning_style}_style")
    
    # Source type tags
    source = resource.get("source", "")
    if source == "youtube":
        tags.append("video_content")
    elif source == "subject_specific":
        tags.append("specialized_resource")
    elif source in ["wikipedia", "documentation"]:
        tags.append("reference_material")
    
    # Educational indicators
    educational_indicators = resource.get("metadata", {}).get("educational_indicators", [])
    if educational_indicators:
        tags.append("educational_content")
    
    return tags


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
