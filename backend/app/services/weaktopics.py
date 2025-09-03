from typing import List, Dict
import re
from ..supabase_client import get_supabase
from .ai_mock import get_mock_provider, is_mock_enabled


# Simple heuristic fallback weak-topic extraction
TOPIC_PATTERN = re.compile(r"(?im)^(?:topic|unit|chapter|section)[:\-\s]+(.+)$")


def extract_topics_from_text(text: str) -> List[str]:
    topics: List[str] = []
    for line in text.splitlines():
        m = TOPIC_PATTERN.search(line)
        if m:
            name = m.group(1).strip()
            if name and name not in topics:
                topics.append(name)
    # fallback: split by bullets
    for line in text.splitlines():
        t = line.strip().lstrip("-•* ")
        if len(t.split()) >= 2 and 3 <= len(t) <= 80 and t not in topics:
            topics.append(t)
    # dedupe while preserving order
    seen = set()
    ordered = []
    for t in topics:
        if t not in seen:
            ordered.append(t)
            seen.add(t)
    return ordered[:200]


def get_weak_topics(user_id: str) -> List[Dict]:
    sb = get_supabase()
    # Aggregate assessment artifacts for this user
    resp = (
        sb.table("artifacts")
        .select("id, artifact_type, extracted_text, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    items = resp.data or []

    # Heuristic: mention of "incorrect", "wrong", etc. indicates weak topic context
    weak_scores: Dict[str, int] = {}
    for item in items:
        text = (item.get("extracted_text") or "").lower()
        score = (
            text.count("incorrect")
            + text.count("wrong")
            + text.count("mistake")
            + text.count("error")
        )
        topics = extract_topics_from_text(item.get("extracted_text") or "")
        for t in topics:
            weak_scores[t] = weak_scores.get(t, 0) + score

    ranked = sorted(weak_scores.items(), key=lambda kv: kv[1], reverse=True)
    return [{"topic": t, "score": s} for t, s in ranked[:20]]


def get_remediation_steps(user_id: str, question_text: str) -> List[Dict]:
    # Check if mock mode is enabled
    if is_mock_enabled():
        mock_provider = get_mock_provider()
        response = mock_provider.get_tutor_response(question_text)
        return response.get("steps", [])
    
    # Use real AI for tutor responses when not in mock mode
    from .ai_providers import get_ai_response
    
    try:
        # Create a structured prompt for step-by-step tutoring
        prompt = f"""
You are an AI tutor. A student has asked: "{question_text}"

Provide a step-by-step solution in JSON format with this structure:
{{
  "steps": [
    {{
      "title": "Step title",
      "detail": "Detailed explanation of this step"
    }}
  ]
}}

Focus on:
1. Understanding the problem
2. Identifying key concepts
3. Breaking down the solution
4. Providing clear explanations

Keep each step concise but educational.
"""
        
        response = get_ai_response(prompt)
        
        # Try to parse JSON response
        import json
        try:
            parsed = json.loads(response)
            if "steps" in parsed and isinstance(parsed["steps"], list):
                return parsed["steps"]
        except json.JSONDecodeError:
            pass
            
    except Exception as e:
        print(f"AI tutor error: {e}")
    
    # Fallback to simple deterministic steps
    concepts = [
        w.strip(",.;:!?") for w in question_text.split() if len(w) > 4
    ]
    concepts = list(dict.fromkeys(concepts))[:5]

    steps = []
    if not question_text.strip():
        return [
            {
                "title": "Clarify the question",
                "detail": "Please provide the problem statement or a clear photo.",
            }
        ]

    steps.append(
        {
            "title": "Understand the problem",
            "detail": (
                f"Restate the problem in your own words: '{question_text[:140]}...'"
            ),
        }
    )
    steps.append(
        {
            "title": "Recall key concepts",
            "detail": (
                f"Review: {', '.join(concepts) if concepts else 'core definitions and formulas'}."
            ),
        }
    )

    return steps
