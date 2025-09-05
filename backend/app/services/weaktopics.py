from typing import List, Dict
import re
from ..supabase_client import get_supabase


# Simple heuristic fallback weak-topic extraction
TOPIC_PATTERN = re.compile(r"(?im)^(?:topic|unit|chapter|section)[\s:\-]+(.+)$")
PREFIX_CLEAN = re.compile(r"(?i)^(?:topic|unit|chapter|section)[\s:\-]+")


def is_administrative_content(text: str) -> bool:
    """Check if text appears to be administrative/procedural rather than academic content."""
    text_lower = text.lower()
    
    # Date patterns (e.g., "5/9/2025", "2025-05-09", "May 9, 2025")
    date_patterns = [
        r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',  # 5/9/2025, 5-9-2025
        r'\d{4}[/-]\d{1,2}[/-]\d{1,2}',    # 2025/5/9, 2025-05-09
        r'\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b',  # May 9, 2025
        r'\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\b'     # 9 May 2025
    ]
    
    for pattern in date_patterns:
        if re.search(pattern, text_lower):
            return True
    
    # Time/duration patterns (e.g., "45 min", "2 hours", "practice + review")
    time_patterns = [
        r'\d+\s*(?:min|minutes?|hrs?|hours?)\b',
        r'\bpractice\s*\+\s*review\b',
        r'\d+\s*(?:min|hrs?)\b'
    ]
    
    for pattern in time_patterns:
        if re.search(pattern, text_lower):
            return True
    
    # Administrative keywords
    admin_keywords = [
        'user manual', 'instructions on', 'how to set up', 'how to run', 'how to use',
        'continuous internal evaluation', 'evaluation marks', 'cie marks', 
        'pending', 'marks)', '(8x2 =', 'x2 =', '= marks', '=16 marks',
        'instructions:', 'manual:', 'setup:', 'installation:', 'configuration:',
        'grading system', 'assessment criteria', 'evaluation criteria'
    ]
    
    for keyword in admin_keywords:
        if keyword in text_lower:
            return True
    
    # Patterns that look like scoring/marking schemes
    scoring_patterns = [
        r'\(\d+x\d+\s*=\s*\d+\s*marks?\)',  # (8x2 = 16 marks)
        r'\d+x\d+\s*=\s*\d+',               # 8x2 = 16
        r'=\s*\d+\s*marks?',                 # = 16 marks
        r'\b\d+\s*marks?\b'                  # 16 marks
    ]
    
    for pattern in scoring_patterns:
        if re.search(pattern, text_lower):
            return True
    
    # Status indicators
    status_words = ['pending', 'completed', 'in progress', 'todo', 'done']
    if any(word in text_lower for word in status_words):
        return True
    
    return False


def extract_topics_from_text(text: str) -> List[str]:
    """Extract topics with enhanced patterns to capture more academic content.

    Enhanced Rules:
      1. Capture lines starting with Topic/Section/Chapter/Unit and strip the prefix.
      2. Include bullet / dash lines (>=2 words) if they don't duplicate an existing topic.
      3. Extract numbered list items and subtopics.
      4. Capture colon-separated content indicating topics.
      5. Include mathematical concepts, formulas, and equations.
      6. Extract programming concepts and technical terms.
      7. Length bounds 2..100 chars after cleaning (expanded from 3..80).
      8. More permissive filtering to include academic content.
    """
    collected: List[str] = []
    seen_ci = set()

    # Reduced exclusions - only truly administrative content
    exclusions = {
        'course syllabus', 'syllabus', 'course outline', 'course description', 
        'learning objectives', 'prerequisites', 'textbook', 'grading', 'schedule',
        'user manual', 'instructions', 'how to set up', 'how to run', 'how to use',
        'continuous internal evaluation', 'evaluation marks', 'marks', 'cie',
        'pending', 'practice + review', 'min', 'minutes', 'hours',
        'administration', 'setup', 'installation', 'configuration'
    }

    def add(topic: str):
        norm = topic.strip()
        if not norm:
            return
        # Expanded length bounds: 2..100 chars (was 3..80)
        if not (2 <= len(norm) <= 100):
            return
        
        # Filter out common non-topic phrases
        if norm.lower() in exclusions:
            return
        # More permissive filtering - only exclude very generic course-related terms
        if any(excl in norm.lower() for excl in ['course syllabus', 'syllabus overview'] if len(norm.split()) <= 2):
            return
        
        # Keep administrative content filtering but be more lenient
        if is_administrative_content(norm):
            return
            
        key = norm.lower()
        if key in seen_ci:
            return
        collected.append(norm)
        seen_ci.add(key)

    lines = text.splitlines()
    
    # Enhanced patterns for topic extraction
    numbered_pattern = re.compile(r"^\s*(\d+[\.\)]\s+)(.+)$")  # 1. Topic or 1) Topic
    colon_pattern = re.compile(r"^([^:]+):\s*(.+)$")  # Title: Description
    math_pattern = re.compile(r"(?i)\b(?:equation|formula|theorem|lemma|proof|derivative|integral|matrix|vector|algebra|geometry|calculus|trigonometry|statistics|probability)\b")
    programming_pattern = re.compile(r"(?i)\b(?:algorithm|data structure|function|method|class|object|variable|loop|conditional|recursion|sorting|searching|array|list|tree|graph|database|sql|programming|coding|development)\b")
    
    # First pass: explicit prefixed lines
    for line in lines:
        m = TOPIC_PATTERN.search(line)
        if m:
            cleaned = m.group(1).strip()
            # Clean up common topic number prefixes like "1:", "Topic 1:"
            cleaned = re.sub(r'^(topic\s+)?(\d+[\s:.-]+)', '', cleaned, flags=re.IGNORECASE).strip()
            add(cleaned)

    # Second pass: numbered items
    for line in lines:
        m = numbered_pattern.match(line)
        if m:
            topic = m.group(2).strip()
            add(topic)

    # Third pass: colon-separated content
    for line in lines:
        m = colon_pattern.match(line.strip())
        if m and len(m.group(1).strip()) >= 2:
            title = m.group(1).strip()
            description = m.group(2).strip()
            # Add both title and description if they're substantial
            add(title)
            if len(description) >= 10:  # Only add description if it's substantial
                add(description)

    # Fourth pass: bullets / general lines with enhanced detection
    for line in lines:
        raw = line.strip().lstrip("-•*→▸◦▪▫ \t")
        if not raw:
            continue
        
        # Skip obvious administrative lines early
        if is_administrative_content(raw):
            continue
            
        # Skip if it's just a prefixed variant of something we already added
        if PREFIX_CLEAN.match(raw):
            cleaned = PREFIX_CLEAN.sub("", raw).strip()
            # Clean up topic number prefixes
            cleaned = re.sub(r'^(topic\s+)?(\d+[\s:.-]+)', '', cleaned, flags=re.IGNORECASE).strip()
            if cleaned.lower() in {c.lower() for c in collected}:
                continue
            add(cleaned)
            continue
            
        # Enhanced heuristic: include mathematical and programming concepts
        is_math_concept = math_pattern.search(raw)
        is_programming_concept = programming_pattern.search(raw)
        
        # More permissive word count: at least 1 word for math/programming concepts, 2 for others
        min_words = 1 if (is_math_concept or is_programming_concept) else 2
        
        if len(raw.split()) >= min_words and 2 <= len(raw) <= 100:
            if raw.lower() not in {c.lower() for c in collected}:
                add(raw)

    # Fifth pass: single-word technical terms and concepts
    technical_terms = re.findall(r'\b(?:algebra|calculus|geometry|trigonometry|statistics|probability|physics|chemistry|biology|literature|history|geography|economics|psychology|sociology|philosophy|mathematics|science|english|art|music|drama|physical education|computer science|programming|database|algorithm|function|method|class|object|variable|array|list|matrix|vector|equation|formula|theorem|proof|integral|derivative|limit|logarithm|polynomial|quadratic|linear|exponential|sine|cosine|tangent|atom|molecule|cell|organism|ecosystem|photosynthesis|respiration|genetics|evolution|democracy|republic|monarchy|capitalism|socialism|renaissance|revolution|war|peace|culture|civilization)\b', text, re.IGNORECASE)
    
    for term in technical_terms:
        if term and len(term) >= 3 and term.lower() not in {c.lower() for c in collected}:
            add(term.title())

    return collected[:300]  # Increased limit from 200 to 300


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
    """Get step-by-step solution using AI"""
    import logging
    logger = logging.getLogger('xenia')
    
    # Use real AI for tutor responses
    from .ai_providers import get_ai_response
    
    try:
        # Create a structured prompt for step-by-step tutoring
        prompt = f"""
You are an AI tutor. A student has asked: "{question_text}"

Provide a step-by-step solution in JSON format with this exact structure:
{{
  "steps": [
    {{
      "title": "Step title",
      "detail": "Detailed explanation of this step"
    }}
  ]
}}

For the question "{question_text}", provide clear steps to solve it.
Return ONLY the JSON, no additional text.
"""
        
        logger.info(f"🤖 Sending tutor prompt to AI...")
        response = get_ai_response(prompt)
        logger.info(f"🤖 AI response received: {response[:200]}...")
        
        # Try to parse JSON response
        import json
        try:
            # Clean response - sometimes AI adds markdown code blocks
            clean_response = response.strip()
            if clean_response.startswith('```json'):
                clean_response = clean_response.replace('```json', '').replace('```', '').strip()
            elif clean_response.startswith('```'):
                clean_response = clean_response.replace('```', '').strip()
                
            parsed = json.loads(clean_response)
            if "steps" in parsed and isinstance(parsed["steps"], list) and parsed["steps"]:
                logger.info(f"✅ Successfully parsed AI steps: {len(parsed['steps'])} steps")
                return parsed["steps"]
            else:
                logger.warning("⚠️ AI response missing 'steps' array")
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {e}")
            logger.error(f"   Response content: {response}")
            
    except Exception as e:
        logger.error(f"❌ AI tutor error: {e}")
        import traceback
        logger.error(f"   Full traceback: {traceback.format_exc()}")
    
    # Fallback to simple deterministic steps
    logger.info("🔄 Using fallback steps")
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
