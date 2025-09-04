"""
AI Providers for real AI API integration.
Supports OpenAI, Anthropic, and Gemini APIs.
"""
import os
import json
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_ai_response(prompt: str, model: Optional[str] = None) -> str:
    """Get AI response from configured provider."""
    import logging
    logger = logging.getLogger('xenia')
    
    # Check if AI mock mode is explicitly enabled
    if os.getenv("AI_MOCK", "false").lower() == "true":
        logger.info("🎭 AI Mock mode explicitly enabled - using mock responses")
        from .ai_mock import get_mock_provider
        return get_mock_provider().get_tutor_response(prompt)["explanation"]
    
    # Try Gemini first
    gemini_key = os.getenv("GEMINI_API_KEY")
    is_demo_gemini = (gemini_key and ("demo" in gemini_key.lower() or 
                                      gemini_key.startswith("AIzaSyDemo_")))
    
    logger.info(f"🤖 Gemini API key: {'✅ Real' if gemini_key and not is_demo_gemini else '🎭 Demo/Missing' if gemini_key else '❌ Missing'}")
    
    if gemini_key and gemini_key.strip() and not is_demo_gemini:
        try:
            import google.generativeai as genai
            logger.info("   Configuring real Gemini API...")
            genai.configure(api_key=gemini_key.strip())
            
            logger.info("   Creating Gemini model...")
            gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
            model_instance = genai.GenerativeModel(gemini_model)
            
            logger.info("   Generating content...")
            response = model_instance.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=1000,
                )
            )
            
            if response and response.text:
                logger.info(f"   ✅ Gemini response received: {len(response.text)} characters")
                return response.text.strip()
            else:
                logger.warning("   ⚠️ Gemini returned empty response")
                
        except Exception as e:
            logger.error(f"   ❌ Gemini API error: {e}")
            import traceback
            logger.error(f"   Full traceback: {traceback.format_exc()}")
    
    # Try OpenAI
    openai_key = os.getenv("OPENAI_API_KEY")
    is_demo_openai = (openai_key and ("demo" in openai_key.lower() or 
                                      openai_key.startswith("sk-demo-")))
    
    logger.info(f"🤖 OpenAI API key: {'✅ Real' if openai_key and not is_demo_openai else '🎭 Demo/Missing' if openai_key else '❌ Missing'}")
    
    if openai_key and openai_key.strip() and not is_demo_openai:
        try:
            from openai import OpenAI
            logger.info("   Using real OpenAI API...")
            client = OpenAI(api_key=openai_key.strip())
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000
            )
            logger.info(f"   ✅ OpenAI response received: {len(response.choices[0].message.content)} characters")
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"   ❌ OpenAI API error: {e}")
    
    # Try Anthropic
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    is_demo_anthropic = (anthropic_key and ("demo" in anthropic_key.lower() or 
                                            anthropic_key.startswith("sk-ant-demo-")))
    
    logger.info(f"🤖 Anthropic API key: {'✅ Real' if anthropic_key and not is_demo_anthropic else '🎭 Demo/Missing' if anthropic_key else '❌ Missing'}")
    
    if anthropic_key and anthropic_key.strip() and not is_demo_anthropic:
        try:
            import anthropic
            logger.info("   Using real Anthropic API...")
            client = anthropic.Anthropic(api_key=anthropic_key.strip())
            response = client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            logger.info(f"   ✅ Anthropic response received: {len(response.content[0].text)} characters")
            return response.content[0].text
        except Exception as e:
            logger.error(f"   ❌ Anthropic API error: {e}")
    
    # Fallback to intelligent mock if no real APIs are available
    logger.warning("   🎭 No real AI APIs available - using intelligent mock fallback")
    logger.info("   💡 To use real AI: Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY with valid keys")
    
    # Use the mock provider for consistent fallback behavior
    from .ai_mock import get_mock_provider
    mock_response = get_mock_provider().get_tutor_response(prompt)
    
    # Return a more natural response format that matches real AI output
    return f"""Based on your question: {prompt[:100]}{'...' if len(prompt) > 100 else ''}

{mock_response['explanation']}

Steps to solve this:
1. {mock_response['steps'][0] if mock_response.get('steps') else 'Identify the key concepts involved'}
2. {mock_response['steps'][1] if len(mock_response.get('steps', [])) > 1 else 'Apply the appropriate method or formula'}
3. {mock_response['steps'][2] if len(mock_response.get('steps', [])) > 2 else 'Work through the solution step by step'}
4. {mock_response['steps'][3] if len(mock_response.get('steps', [])) > 3 else 'Verify your answer makes sense'}

Note: This is a fallback response. For enhanced AI tutoring, configure real API keys."""

def filter_and_prioritize_topics(extracted_topics: list, syllabus_content: str, user_preferences: Dict = None) -> Dict[str, Any]:
    """Use Gemini AI to intelligently filter and prioritize extracted topics."""
    
    import logging
    logger = logging.getLogger('xenia')
    
    user_prefs = user_preferences or {}
    learning_goals = user_prefs.get("learning_goals", "comprehensive understanding")
    focus_areas = user_prefs.get("focus_areas", [])
    difficulty_level = user_prefs.get("difficulty_level", "intermediate")
    time_available = user_prefs.get("time_available", "moderate")
    
    topics_text = "\n".join([f"- {topic}" for topic in extracted_topics[:30]])
    focus_areas_text = ", ".join(focus_areas) if focus_areas else "No specific focus areas"
    
    prompt = f"""
You are an expert educational AI. Analyze and intelligently filter the extracted syllabus topics.

EXTRACTED TOPICS:
{topics_text}

ORIGINAL SYLLABUS CONTEXT:
{syllabus_content[:1500]}...

USER PREFERENCES:
- Learning Goals: {learning_goals}
- Focus Areas: {focus_areas_text}
- Difficulty Level: {difficulty_level}
- Time Available: {time_available}

FILTERING TASKS:
1. Remove redundant, administrative, or non-essential topics
2. Identify core foundational topics vs. advanced topics
3. Group related topics into logical learning sequences
4. Prioritize based on importance and prerequisites
5. Estimate learning difficulty and time requirements
6. Suggest optimal learning order

Return ONLY valid JSON:
{{
  "filtered_topics": [
    {{
      "topic": "Core Topic Name",
      "category": "foundational|intermediate|advanced",
      "priority": "critical|high|medium|low",
      "estimated_hours": 4.5,
      "difficulty_score": 7,
      "prerequisites": ["Previous topic name"],
      "learning_objectives": ["Understand X", "Apply Y"],
      "why_important": "Essential because...",
      "suggested_resources": ["YouTube: Topic tutorials", "Practice: Coding exercises"]
    }}
  ],
  "learning_path": {{
    "phase_1_foundation": ["Topic 1", "Topic 2"],
    "phase_2_core": ["Topic 3", "Topic 4"], 
    "phase_3_advanced": ["Topic 5", "Topic 6"],
    "phase_4_application": ["Project work", "Integration"]
  }},
  "filtering_insights": {{
    "topics_removed": 5,
    "topics_kept": 15,
    "removal_reasons": ["Administrative content", "Redundant topics"],
    "learning_sequence_rationale": "Foundation-first approach for better comprehension",
    "time_estimate_total": 45.5,
    "difficulty_progression": "gradual"
  }},
  "next_steps": {{
    "immediate_actions": ["Start with foundational topics", "Set up study environment"],
    "week_1_goals": ["Master basics", "Complete introductory exercises"],
    "success_metrics": ["Completion rate", "Concept understanding"],
    "recommended_pace": "2-3 hours daily for optimal retention"
  }}
}}
"""

    try:
        # Attempt Gemini API call with demo detection
        gemini_key = os.getenv("GEMINI_API_KEY")
        is_demo_gemini = (gemini_key and ("demo" in gemini_key.lower() or 
                                          gemini_key.startswith("AIzaSyDemo_")))
        
        logger.info(f"🤖 Filter function - Gemini API key: {'✅ Real' if gemini_key and not is_demo_gemini else '🎭 Demo/Missing' if gemini_key else '❌ Missing'}")
        
        if gemini_key and not is_demo_gemini:
            import google.generativeai as genai
            logger.info("    Configuring real Gemini API...")
            genai.configure(api_key=gemini_key)
            
            logger.info("    Creating Gemini model...")
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            logger.info("    Generating content...")
            response = model.generate_content(prompt)
            logger.info(f"    ✅ Gemini response received: {len(response.text)} characters")
            
            # Clean and parse JSON response
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            result = json.loads(response_text)
            
            # Validate response structure
            if not all(key in result for key in ['filtered_topics', 'learning_path', 'filtering_insights', 'next_steps']):
                raise ValueError("Missing required response fields")
                
            logger.info(f"✅ AI topic filtering completed: {len(result['filtered_topics'])} topics after filtering")
            return result
        else:
            raise ValueError("Gemini API key not found")
        
    except Exception as e:
        logger.error(f"AI topic filtering failed: {str(e)}")
        
        # Fallback: Basic filtering logic
        logger.info("🔄 Using fallback topic filtering...")
        
        # Remove common administrative topics
        admin_keywords = ['syllabus', 'schedule', 'exam', 'grade', 'policy', 'attendance', 'office hours']
        filtered = [topic for topic in extracted_topics 
                   if not any(keyword in topic.lower() for keyword in admin_keywords)]
        
        # Basic prioritization
        priority_topics = []
        for i, topic in enumerate(filtered[:20]):
            priority_topics.append({
                "topic": topic,
                "category": "foundational" if i < 5 else "intermediate" if i < 15 else "advanced",
                "priority": "high" if i < 10 else "medium",
                "estimated_hours": 3.0,
                "difficulty_score": min(i + 3, 8),
                "prerequisites": [],
                "learning_objectives": [f"Understand {topic}"],
                "why_important": "Core curriculum topic",
                "suggested_resources": []
            })
        
        return {
            "filtered_topics": priority_topics,
            "learning_path": {
                "phase_1_foundation": [t["topic"] for t in priority_topics[:5]],
                "phase_2_core": [t["topic"] for t in priority_topics[5:12]],
                "phase_3_advanced": [t["topic"] for t in priority_topics[12:]],
                "phase_4_application": ["Final project", "Review and integration"]
            },
            "filtering_insights": {
                "topics_removed": len(extracted_topics) - len(priority_topics),
                "topics_kept": len(priority_topics),
                "removal_reasons": ["Administrative content filtered"],
                "learning_sequence_rationale": "Basic sequential ordering",
                "time_estimate_total": len(priority_topics) * 3.0,
                "difficulty_progression": "gradual"
            },
            "next_steps": {
                "immediate_actions": ["Review filtered topics", "Begin with foundation"],
                "week_1_goals": ["Complete foundational topics"],
                "success_metrics": ["Topic completion", "Understanding verification"],
                "recommended_pace": "Steady progress with regular review"
            }
        }

def generate_intelligent_study_plan(topics: list, horizon_days: int, deadline: str = None, user_preferences: Dict = None) -> Dict[str, Any]:
    """Generate an AI-optimized study plan with smart scheduling."""
    
    user_prefs = user_preferences or {}
    preferred_hours = user_prefs.get("daily_hours", 1.5)
    difficulty_preference = user_prefs.get("difficulty_progression", "gradual")  # gradual, mixed, intensive
    
    topics_str = "\n".join([f"- {t.get('topic', t)} (difficulty: {t.get('score', 5)}, hours: {t.get('estimated_hours', 3)})" 
                           for t in (topics[:15] if isinstance(topics[0], dict) else [{"topic": t, "score": 5, "estimated_hours": 3} for t in topics[:15]])])
    
    prompt = f"""
Create an intelligent study schedule optimized for learning effectiveness.

TOPICS TO COVER:
{topics_str}

CONSTRAINTS:
- Study period: {horizon_days} days
- Daily study time: {preferred_hours} hours
- Deadline: {deadline or 'Flexible'}
- Learning preference: {difficulty_preference}

SCHEDULING PRINCIPLES:
1. Spaced repetition for retention
2. Prerequisite ordering (easy to hard concepts)
3. Cognitive load management 
4. Peak performance timing
5. Review sessions before deadline

Return ONLY valid JSON:
{{
  "sessions": [
    {{
      "date": "2024-01-15",
      "topic": "Linear Algebra Basics", 
      "focus": "Introduction and core concepts",
      "duration_min": 45,
      "session_type": "learning",
      "priority": "high",
      "cognitive_load": "medium",
      "prerequisites_covered": true,
      "review_topics": ["Previous session concepts"],
      "difficulty_progression": "foundation"
    }}
  ],
  "optimization_insights": {{
    "total_study_hours": 21,
    "coverage_percentage": 95,
    "retention_strategy": "spaced_repetition",
    "difficulty_curve": "gradual_increase"
  }},
  "milestone_dates": [
    {{"date": "2024-01-20", "milestone": "Complete foundational topics"}},
    {{"date": "2024-01-25", "milestone": "Advanced concepts review"}}
  ]
}}
"""
    
    try:
        response = get_ai_response(prompt)
        clean_response = response.strip()
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        parsed = json.loads(clean_response.strip())
        return parsed
        
    except Exception as e:
        import logging
        from datetime import datetime, timedelta
        logger = logging.getLogger('xenia')
        logger.error(f"AI study plan generation failed: {e}")
        
        # Fallback intelligent scheduling
        sessions = []
        start_date = datetime.now().date()
        
        # Distribute topics across available days
        for i, topic_data in enumerate(topics[:horizon_days * 2]):
            day_offset = i % horizon_days
            session_date = start_date + timedelta(days=day_offset)
            
            if isinstance(topic_data, dict):
                topic = topic_data.get("topic", f"Topic {i+1}")
                difficulty = topic_data.get("score", 5)
                hours = topic_data.get("estimated_hours", 3)
            else:
                topic = str(topic_data)
                difficulty = 5
                hours = 3
            
            sessions.append({
                "date": session_date.isoformat(),
                "topic": topic,
                "focus": "Core concepts and practice" if difficulty <= 5 else "Advanced application",
                "duration_min": min(90, max(30, int(hours * 20))),  # Convert hours to minutes
                "session_type": "learning" if i % 3 != 2 else "review",
                "priority": "high" if difficulty >= 7 else "medium",
                "cognitive_load": "high" if difficulty >= 8 else "medium",
                "prerequisites_covered": i > 0,
                "review_topics": [sessions[-1]["topic"]] if sessions else [],
                "difficulty_progression": "foundation" if difficulty <= 4 else "intermediate" if difficulty <= 7 else "advanced"
            })
        
        return {
            "sessions": sessions,
            "optimization_insights": {
                "total_study_hours": sum(s["duration_min"] for s in sessions) / 60.0,
                "coverage_percentage": min(100, len(sessions) * 10),
                "retention_strategy": "spaced_repetition",
                "difficulty_curve": "optimized"
            },
            "milestone_dates": [
                {"date": (start_date + timedelta(days=horizon_days//2)).isoformat(), "milestone": "Mid-point review"},
                {"date": (start_date + timedelta(days=horizon_days-1)).isoformat(), "milestone": "Final preparation"}
            ]
        }

def get_syllabus_analysis(text: str) -> Dict[str, Any]:
    """Advanced AI-powered syllabus analysis with topic filtering and prioritization."""
    prompt = f"""
You are an expert educational AI analyzing a syllabus document. Extract and filter the most important academic topics.

SYLLABUS CONTENT:
{text}

Perform the following analysis:

1. TOPIC EXTRACTION: Identify core academic topics (exclude administrative content)
2. DIFFICULTY SCORING: Rate each topic 1-10 based on complexity
3. PREREQUISITE ANALYSIS: Identify topic dependencies  
4. TIME ESTIMATION: Estimate study hours per topic
5. PRIORITY RANKING: Rank topics by importance and urgency

Return ONLY valid JSON in this exact format:
{{
  "topics": [
    {{
      "topic": "Linear Algebra",
      "score": 8,
      "category": "mathematics",
      "prerequisites": ["Basic Algebra"],
      "estimated_hours": 12,
      "priority": "high",
      "keywords": ["matrices", "vectors", "eigenvalues"]
    }}
  ],
  "difficulty": "advanced",
  "estimated_total_hours": 45,
  "subject_area": "Computer Science",
  "learning_objectives": ["Problem solving", "Mathematical reasoning"],
  "filtered_administrative": ["Course policies", "Grading rubric"]
}}
"""
    
    try:
        response = get_ai_response(prompt)
        # Clean up any markdown formatting
        clean_response = response.strip()
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        parsed = json.loads(clean_response.strip())
        
        # Validate and enhance the response
        if "topics" in parsed and isinstance(parsed["topics"], list):
            # Filter out invalid topics and add smart enhancements
            valid_topics = []
            for topic_obj in parsed["topics"]:
                if isinstance(topic_obj, dict) and "topic" in topic_obj:
                    # Ensure all required fields
                    enhanced_topic = {
                        "topic": topic_obj["topic"],
                        "score": min(10, max(1, int(topic_obj.get("score", 5)))),
                        "category": topic_obj.get("category", "general"),
                        "prerequisites": topic_obj.get("prerequisites", []),
                        "estimated_hours": min(50, max(1, int(topic_obj.get("estimated_hours", 5)))),
                        "priority": topic_obj.get("priority", "medium"),
                        "keywords": topic_obj.get("keywords", [])
                    }
                    valid_topics.append(enhanced_topic)
            
            parsed["topics"] = valid_topics[:20]  # Limit to 20 topics max
            return parsed
            
    except Exception as e:
        import logging
        logger = logging.getLogger('xenia')
        logger.error(f"AI syllabus analysis failed: {e}")
    
    # Enhanced fallback analysis with topic extraction
    try:
        from .weaktopics import extract_topics_from_text
        extracted_topics = extract_topics_from_text(text)[:10]
        
        fallback_topics = []
        for i, topic in enumerate(extracted_topics):
            fallback_topics.append({
                "topic": topic,
                "score": 5 + (i % 3),  # Vary difficulty scores
                "category": "general",
                "prerequisites": [],
                "estimated_hours": 3 + (i % 5),
                "priority": "medium" if i < 5 else "low",
                "keywords": topic.lower().split()[:3]
            })
        
        return {
            "topics": fallback_topics,
            "difficulty": "intermediate",
            "estimated_total_hours": sum(t["estimated_hours"] for t in fallback_topics),
            "subject_area": "General Studies",
            "learning_objectives": ["Understanding core concepts"],
            "filtered_administrative": []
        }
    except:
        # Ultimate fallback
        return {
            "topics": [
                {"topic": "Mathematics", "score": 6, "category": "math", "prerequisites": [], "estimated_hours": 8, "priority": "high", "keywords": ["math", "numbers"]},
                {"topic": "Science", "score": 7, "category": "science", "prerequisites": [], "estimated_hours": 10, "priority": "medium", "keywords": ["science", "research"]},
                {"topic": "Literature", "score": 5, "category": "humanities", "prerequisites": [], "estimated_hours": 6, "priority": "low", "keywords": ["reading", "writing"]}
            ],
            "difficulty": "intermediate", 
            "estimated_total_hours": 24,
            "subject_area": "General Studies",
            "learning_objectives": ["Basic understanding"],
            "filtered_administrative": []
        }

def get_assessment_analysis(text: str) -> Dict[str, Any]:
    """Enhanced AI assessment analysis with weakness detection and recommendations."""
    prompt = f"""
You are an expert educational assessor analyzing student performance data.

ASSESSMENT CONTENT:
{text}

Perform comprehensive analysis:

1. WEAKNESS IDENTIFICATION: Detect specific knowledge gaps and struggling areas
2. STRENGTH ANALYSIS: Identify areas of competency and excellence  
3. LEARNING PATTERNS: Analyze error patterns and misconceptions
4. PRIORITY RANKING: Rank weak areas by urgency for improvement
5. REMEDIATION STRATEGY: Suggest focused study approaches

Return ONLY valid JSON:
{{
  "weak_areas": [
    {{
      "topic": "Calculus Integration", 
      "score": 3,
      "error_pattern": "Sign errors in u-substitution",
      "frequency": 0.8,
      "urgency": "high",
      "remediation": "Practice basic u-substitution systematically"
    }}
  ],
  "strengths": [
    {{
      "topic": "Linear Equations", 
      "score": 8,
      "mastery_level": "proficient",
      "consistency": 0.9
    }}
  ],
  "overall_score": 65,
  "performance_trends": "improving",
  "recommended_focus_hours": {{
    "Calculus Integration": 8,
    "Trigonometry": 5
  }},
  "study_recommendations": ["Focus on fundamentals", "Increase practice frequency"]
}}
"""
    
    try:
        response = get_ai_response(prompt)
        # Clean response
        clean_response = response.strip()
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        parsed = json.loads(clean_response.strip())
        
        # Validate and enhance
        if "weak_areas" in parsed and isinstance(parsed["weak_areas"], list):
            # Ensure valid weak areas
            valid_weak = []
            for weak in parsed["weak_areas"][:8]:  # Limit to 8 weak areas
                if isinstance(weak, dict) and "topic" in weak:
                    enhanced_weak = {
                        "topic": weak["topic"],
                        "score": min(10, max(1, int(weak.get("score", 3)))),
                        "error_pattern": weak.get("error_pattern", "Needs more practice"),
                        "frequency": min(1.0, max(0.0, float(weak.get("frequency", 0.5)))),
                        "urgency": weak.get("urgency", "medium"),
                        "remediation": weak.get("remediation", "Review core concepts")
                    }
                    valid_weak.append(enhanced_weak)
            parsed["weak_areas"] = valid_weak
        
        return parsed
            
    except Exception as e:
        import logging
        logger = logging.getLogger('xenia')
        logger.error(f"AI assessment analysis failed: {e}")
    
    # Enhanced fallback with pattern analysis
    return {
        "weak_areas": [
            {"topic": "Complex Problem Solving", "score": 3, "error_pattern": "Multi-step reasoning", "frequency": 0.7, "urgency": "high", "remediation": "Break down complex problems into steps"},
            {"topic": "Advanced Concepts", "score": 4, "error_pattern": "Conceptual understanding", "frequency": 0.6, "urgency": "medium", "remediation": "Review theoretical foundations"}
        ],
        "strengths": [
            {"topic": "Basic Concepts", "score": 8, "mastery_level": "proficient", "consistency": 0.9},
            {"topic": "Computational Skills", "score": 7, "mastery_level": "competent", "consistency": 0.8}
        ],
        "overall_score": 70,
        "performance_trends": "stable",
        "recommended_focus_hours": {
            "Complex Problem Solving": 6,
            "Advanced Concepts": 4
        },
        "study_recommendations": ["Focus on step-by-step problem solving", "Review fundamentals regularly"]
    }


def generate_enhanced_study_plan_with_resources(topics: list, horizon_days: int = 14, 
                                              deadline: Optional[str] = None, 
                                              user_preferences: Dict[str, Any] = None,
                                              learning_style: Optional[str] = None,
                                              extracted_topics: Optional[list] = None) -> Dict[str, Any]:
    """Generate enhanced study plan with resources using Gemini 2.0 Flash."""
    import logging
    from datetime import datetime, timedelta
    
    logger = logging.getLogger('xenia')
    logger.info(f"🎯 Generating enhanced study plan with resources for {len(topics)} topics")
    
    preferences = user_preferences or {}
    preferred_hours = preferences.get("hours_per_day", 2.0)
    learning_style = preferences.get("learning_style", "balanced")
    difficulty_preference = preferences.get("difficulty_preference", "gradual")
    
    # Format topics for AI
    topics_str = ""
    for i, topic in enumerate(topics[:20], 1):
        if isinstance(topic, dict):
            topics_str += f"{i}. {topic.get('topic', 'Unknown Topic')} (Priority: {topic.get('priority', 'medium')}, Hours: {topic.get('estimated_hours', 3)})\n"
        else:
            topics_str += f"{i}. {topic}\n"
    
    prompt = f"""You are an expert educational planner using learning science principles. Create a comprehensive study plan with resources.

TOPICS TO COVER:
{topics_str}

PARAMETERS:
- Study horizon: {horizon_days} days
- Deadline: {deadline or 'Flexible'}
- Preferred hours per day: {preferred_hours}
- Learning style: {learning_style}
- Difficulty preference: {difficulty_preference}

Generate a detailed study plan with the following structure:
1. Optimal scheduling using spaced repetition
2. Resource suggestions (YouTube videos, articles, practice sites)
3. Progress milestones
4. Adaptive adjustment guidelines

Return ONLY valid JSON:
{{
  "study_sessions": [
    {{
      "date": "2025-09-05",
      "topic": "Topic Name",
      "duration_hours": 2.5,
      "priority": "high",
      "difficulty_level": 7,
      "learning_objectives": ["Understand X", "Apply Y"],
      "resources": {{
        "youtube_videos": [
          {{"title": "Video Title", "channel": "Channel Name", "url": "https://youtube.com/watch?v=...", "duration": "15 min"}},
          {{"title": "Advanced Tutorial", "channel": "Expert Channel", "url": "https://youtube.com/watch?v=...", "duration": "25 min"}}
        ],
        "articles": [
          {{"title": "Complete Guide", "source": "Educational Site", "url": "https://example.com/guide", "read_time": "10 min"}}
        ],
        "practice_sites": [
          {{"name": "Practice Platform", "url": "https://practice.com", "type": "interactive exercises"}}
        ],
        "additional_resources": [
          {{"type": "documentation", "title": "Official Docs", "url": "https://docs.example.com"}}
        ]
      }},
      "prerequisites": ["Previous Topic"],
      "expected_outcomes": ["Master concept X", "Solve problems Y"],
      "assessment_method": "practice problems"
    }}
  ],
  "optimization_insights": {{
    "total_study_hours": {preferred_hours * horizon_days},
    "coverage_percentage": 100,
    "retention_strategy": "spaced_repetition",
    "difficulty_curve": "{difficulty_preference}",
    "personalization_notes": "Adapted for {learning_style} learning style"
  }},
  "progress_milestones": [
    {{"date": "2025-09-08", "milestone": "Complete foundational topics", "completion_target": 40}},
    {{"date": "2025-09-12", "milestone": "Advanced concepts mastery", "completion_target": 75}},
    {{"date": "2025-09-16", "milestone": "Full curriculum completion", "completion_target": 100}}
  ],
  "adaptive_guidelines": {{
    "if_ahead_of_schedule": "Add depth to current topics, explore advanced applications",
    "if_behind_schedule": "Focus on core concepts, use active recall techniques",
    "resource_alternatives": "Video learners: prioritize YouTube, Text learners: focus on articles",
    "difficulty_adjustment": "Increase practice problems if concepts are grasped quickly"
  }},
  "deadline_management": {{
    "target_date": "{deadline or 'flexible'}",
    "urgency_level": "normal",
    "critical_path_topics": ["Most important topics first"],
    "buffer_time": "2 days for review and consolidation"
  }}
}}
"""
    
    try:
        response = get_ai_response(prompt)
        clean_response = response.strip()
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        parsed = json.loads(clean_response.strip())
        logger.info(f"✅ Enhanced study plan generated with {len(parsed.get('study_sessions', []))} sessions")
        return parsed
        
    except Exception as e:
        logger.error(f"Enhanced study plan generation failed: {e}")
        
        # Import our enhanced resource fetching
        from .resources import fetch_resources_for_topic
        
        # Fallback with basic structure but enhanced resources
        sessions = []
        start_date = datetime.now().date()
        
        for i, topic_data in enumerate(topics[:horizon_days]):
            session_date = start_date + timedelta(days=i)
            
            if isinstance(topic_data, dict):
                topic = topic_data.get("topic", f"Topic {i+1}")
                hours = min(preferred_hours, topic_data.get("estimated_hours", 2))
                topic_metadata = topic_data
            else:
                topic = str(topic_data)
                hours = preferred_hours
                topic_metadata = {}
            
            # Fetch enhanced resources based on learning style and topic metadata
            try:
                enhanced_resources = fetch_resources_for_topic(
                    topic, 
                    learning_style=learning_style or preferences.get("learning_style"),
                    topic_metadata=topic_metadata
                )
                
                # Organize resources by type
                youtube_videos = [r for r in enhanced_resources if r.get("source") == "youtube"]
                articles = [r for r in enhanced_resources if r.get("source") in ["wikipedia", "wikibooks"]]
                ocw_resources = [r for r in enhanced_resources if r.get("source") == "ocw"]
                
                # Format resources for the plan
                resources = {
                    "youtube_videos": [
                        {
                            "title": res.get("title", "Unknown Title"),
                            "channel": res.get("metadata", {}).get("channel", "Educational Channel"),
                            "url": res.get("url", ""),
                            "duration": "20 min",  # Default, could enhance this
                            "learning_style_optimized": res.get("metadata", {}).get("learning_style") == learning_style
                        } for res in youtube_videos[:3]
                    ],
                    "articles": [
                        {
                            "title": res.get("title", "Study Guide"),
                            "source": res.get("source", "Educational Source"),
                            "url": res.get("url", ""),
                            "read_time": "15 min"
                        } for res in articles[:2]
                    ],
                    "practice_sites": [
                        {
                            "name": res.get("title", "Practice Platform"),
                            "url": res.get("url", "https://khanacademy.org"),
                            "type": "interactive learning"
                        } for res in ocw_resources[:2]
                    ]
                }
                
                # Add fallback resources if none found
                if not any(resources.values()):
                    resources = {
                        "youtube_videos": [
                            {"title": f"{topic} Tutorial", "channel": "Educational Channel", "url": f"https://youtube.com/search?q={topic.replace(' ', '+')}", "duration": "20 min"}
                        ],
                        "articles": [
                            {"title": f"{topic} Guide", "source": "Study Resource", "url": f"https://google.com/search?q={topic.replace(' ', '+')}", "read_time": "15 min"}
                        ],
                        "practice_sites": [
                            {"name": "Practice Platform", "url": "https://khanacademy.org", "type": "exercises"}
                        ]
                    }
                    
            except Exception as res_error:
                logger.warning(f"Resource fetching failed for {topic}: {res_error}")
                resources = {
                    "youtube_videos": [
                        {"title": f"{topic} Tutorial", "channel": "Educational Channel", "url": f"https://youtube.com/search?q={topic.replace(' ', '+')}", "duration": "20 min"}
                    ],
                    "articles": [
                        {"title": f"{topic} Guide", "source": "Study Resource", "url": f"https://google.com/search?q={topic.replace(' ', '+')}", "read_time": "15 min"}
                    ],
                    "practice_sites": [
                        {"name": "Practice Platform", "url": "https://khanacademy.org", "type": "exercises"}
                    ]
                }
            
            sessions.append({
                "date": session_date.isoformat(),
                "topic": topic,
                "duration_hours": hours,
                "priority": topic_metadata.get("priority", "medium"),
                "difficulty_level": topic_metadata.get("score", 5),
                "learning_objectives": [f"Understand {topic}"],
                "resources": resources,
                "prerequisites": topic_metadata.get("prerequisites", []),
                "expected_outcomes": [f"Master {topic}"],
                "assessment_method": "self-assessment",
                "category": topic_metadata.get("category", "general")
            })
        
        return {
            "study_sessions": sessions,
            "optimization_insights": {
                "total_study_hours": len(sessions) * preferred_hours,
                "coverage_percentage": 100,
                "retention_strategy": "spaced_repetition",
                "difficulty_curve": difficulty_preference,
                "personalization_notes": f"Adapted for {learning_style} learning style"
            },
            "progress_milestones": [
                {"date": (start_date + timedelta(days=horizon_days//3)).isoformat(), "milestone": "Foundation complete", "completion_target": 35},
                {"date": (start_date + timedelta(days=2*horizon_days//3)).isoformat(), "milestone": "Advanced topics", "completion_target": 70},
                {"date": (start_date + timedelta(days=horizon_days)).isoformat(), "milestone": "Full completion", "completion_target": 100}
            ],
            "adaptive_guidelines": {
                "if_ahead_of_schedule": "Add practice problems and deeper exploration",
                "if_behind_schedule": "Focus on core concepts and use summary resources",
                "resource_alternatives": "Mix of videos and text based on learning preference",
                "difficulty_adjustment": "Adjust based on comprehension speed"
            },
            "deadline_management": {
                "target_date": deadline or "flexible",
                "urgency_level": "normal",
                "critical_path_topics": [s["topic"] for s in sessions[:3]],
                "buffer_time": "Built-in flexibility"
            }
        }


def adjust_plan_based_on_progress(current_plan: Dict[str, Any], progress_data: Dict[str, Any]) -> Dict[str, Any]:
    """Adjust study plan based on user progress using Gemini 2.0 Flash."""
    import logging
    
    logger = logging.getLogger('xenia')
    logger.info("🔄 Adjusting plan based on user progress")
    
    prompt = f"""You are an adaptive learning system. Analyze the user's progress and adjust their study plan accordingly.

CURRENT STUDY PLAN:
{json.dumps(current_plan, indent=2)}

USER PROGRESS DATA:
{json.dumps(progress_data, indent=2)}

ANALYSIS REQUIRED:
1. Compare actual progress vs planned progress
2. Identify if user is ahead, on track, or behind schedule
3. Adjust future sessions based on performance
4. Recommend resource changes if needed
5. Update milestones and deadlines

Return ONLY valid JSON with the adjusted plan:
{{
  "adjustment_type": "ahead_of_schedule|on_track|behind_schedule",
  "adjustment_reasoning": "Detailed explanation of why adjustments are needed",
  "modified_sessions": [
    {{
      "date": "2025-09-06",
      "topic": "Adjusted Topic",
      "duration_hours": 2.0,
      "priority": "high",
      "changes_made": "Extended depth due to quick mastery",
      "new_resources": {{
        "youtube_videos": [{{"title": "Advanced Tutorial", "url": "...", "reason": "User ready for advanced content"}}],
        "practice_sites": [{{"name": "Advanced Practice", "url": "...", "reason": "Needs more challenging exercises"}}]
      }}
    }}
  ],
  "updated_milestones": [
    {{"date": "2025-09-10", "milestone": "Updated milestone", "completion_target": 85, "adjustment": "Moved up due to progress"}}
  ],
  "schedule_changes": {{
    "days_saved_or_added": 2,
    "new_completion_date": "2025-09-15",
    "urgency_level": "normal",
    "focus_areas": ["Topics that need more attention"]
  }},
  "recommendations": [
    "Continue current pace for strong topics",
    "Add more practice for weak areas",
    "Consider advanced resources for mastered topics"
  ]
}}
"""
    
    try:
        response = get_ai_response(prompt)
        clean_response = response.strip()
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        parsed = json.loads(clean_response.strip())
        logger.info(f"✅ Plan adjusted: {parsed.get('adjustment_type', 'unknown')}")
        return parsed
        
    except Exception as e:
        logger.error(f"Plan adjustment failed: {e}")
        
        # Simple fallback adjustment logic
        completion_rate = progress_data.get('completion_percentage', 50)
        sessions_completed = progress_data.get('sessions_completed', 0)
        planned_sessions = len(current_plan.get('study_sessions', []))
        
        if completion_rate > 80 and sessions_completed > 0:
            adjustment_type = "ahead_of_schedule"
            recommendations = ["Add advanced topics", "Explore deeper concepts"]
        elif completion_rate < 40:
            adjustment_type = "behind_schedule"
            recommendations = ["Focus on core concepts", "Use quick summary resources"]
        else:
            adjustment_type = "on_track"
            recommendations = ["Continue current approach", "Maintain consistent pace"]
        
        return {
            "adjustment_type": adjustment_type,
            "adjustment_reasoning": f"Based on {completion_rate}% completion rate",
            "modified_sessions": current_plan.get('study_sessions', []),
            "updated_milestones": current_plan.get('progress_milestones', []),
            "schedule_changes": {
                "days_saved_or_added": 0,
                "new_completion_date": "unchanged",
                "urgency_level": "normal",
                "focus_areas": ["Continue current topics"]
            },
            "recommendations": recommendations
        }


def get_topic_resources(topic: str, learning_style: str = "balanced") -> Dict[str, Any]:
    """Get comprehensive resources for a specific topic using Gemini 2.0 Flash."""
    import logging
    
    logger = logging.getLogger('xenia')
    logger.info(f"🔍 Finding resources for topic: {topic}")
    
    prompt = f"""You are a resource discovery expert. Find the best learning resources for the topic: "{topic}".

LEARNING STYLE: {learning_style}

Find comprehensive, high-quality resources. Return ONLY valid JSON:
{{
  "topic": "{topic}",
  "youtube_videos": [
    {{
      "title": "Complete {topic} Tutorial",
      "channel": "Actual Channel Name",
      "url": "https://youtube.com/watch?v=actual_video_id",
      "duration": "25 minutes",
      "difficulty": "beginner|intermediate|advanced",
      "rating": 4.8,
      "description": "Brief description of what this video covers"
    }}
  ],
  "articles_and_guides": [
    {{
      "title": "Comprehensive {topic} Guide",
      "source": "Educational Website",
      "url": "https://actual-site.com/guide",
      "read_time": "15 minutes",
      "type": "tutorial|reference|explanation",
      "quality_score": 9
    }}
  ],
  "practice_platforms": [
    {{
      "name": "Interactive Practice Site",
      "url": "https://practice-site.com",
      "type": "exercises|quizzes|simulations",
      "free": true,
      "features": ["Step-by-step solutions", "Progress tracking"]
    }}
  ],
  "documentation": [
    {{
      "title": "Official {topic} Documentation",
      "url": "https://docs.example.com",
      "type": "reference",
      "completeness": "comprehensive"
    }}
  ],
  "books_and_papers": [
    {{
      "title": "Essential {topic} Textbook",
      "author": "Expert Author",
      "type": "textbook|research_paper|guide",
      "availability": "free|paid|library",
      "relevance_score": 9
    }}
  ],
  "interactive_tools": [
    {{
      "name": "Topic Simulator",
      "url": "https://simulator.com",
      "type": "simulation|calculator|visualizer",
      "description": "Interactive tool for hands-on learning"
    }}
  ],
  "study_tips": [
    "Start with conceptual understanding before diving into details",
    "Practice regularly with varied examples",
    "Connect concepts to real-world applications"
  ]
}}
"""
    
    try:
        response = get_ai_response(prompt)
        clean_response = response.strip()
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        parsed = json.loads(clean_response.strip())
        logger.info(f"✅ Found {len(parsed.get('youtube_videos', []))} videos and {len(parsed.get('articles_and_guides', []))} articles")
        return parsed
        
    except Exception as e:
        logger.error(f"Resource discovery failed: {e}")
        
        # Fallback with search-based resources
        topic_encoded = topic.replace(" ", "+")
        return {
            "topic": topic,
            "youtube_videos": [
                {
                    "title": f"{topic} - Complete Tutorial",
                    "channel": "Educational Channel",
                    "url": f"https://youtube.com/results?search_query={topic_encoded}+tutorial",
                    "duration": "20 minutes",
                    "difficulty": "intermediate",
                    "rating": 4.5,
                    "description": f"Comprehensive introduction to {topic}"
                }
            ],
            "articles_and_guides": [
                {
                    "title": f"Ultimate {topic} Guide",
                    "source": "Study Resource",
                    "url": f"https://google.com/search?q={topic_encoded}+guide+tutorial",
                    "read_time": "15 minutes",
                    "type": "tutorial",
                    "quality_score": 8
                }
            ],
            "practice_platforms": [
                {
                    "name": "Khan Academy",
                    "url": "https://khanacademy.org",
                    "type": "exercises",
                    "free": True,
                    "features": ["Interactive exercises", "Progress tracking"]
                }
            ],
            "documentation": [
                {
                    "title": f"{topic} Reference",
                    "url": f"https://google.com/search?q={topic_encoded}+documentation",
                    "type": "reference",
                    "completeness": "partial"
                }
            ],
            "books_and_papers": [
                {
                    "title": f"Introduction to {topic}",
                    "author": "Various Authors",
                    "type": "textbook",
                    "availability": "library",
                    "relevance_score": 7
                }
            ],
            "interactive_tools": [
                {
                    "name": f"{topic} Practice Tool",
                    "url": f"https://google.com/search?q={topic_encoded}+interactive+tool",
                    "type": "practice",
                    "description": f"Interactive exercises for {topic}"
                }
            ],
            "study_tips": [
                f"Break down {topic} into smaller, manageable concepts",
                "Practice with real examples and applications",
                "Review regularly to reinforce understanding",
                "Connect new concepts to previously learned material"
            ]
        }
