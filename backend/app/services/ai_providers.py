"""
AI Providers for real AI API integration.
Supports OpenAI, Anthropic, and Gemini APIs.
"""
import os
import json
import re
from typing import Optional, Dict, Any, List
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
            gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
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
    
    topics_text = "\n".join([f"- {topic}" for topic in extracted_topics[:50]])  # Increased from 30
    focus_areas_text = ", ".join(focus_areas) if focus_areas else "No specific focus areas"
    
    prompt = f"""
You are an expert educational AI. Analyze and intelligently filter the extracted syllabus topics.
IMPORTANT: Be GENEROUS in topic inclusion. Err on the side of including MORE topics rather than fewer.
Include specialized terminology, subtopics, and detailed concepts for comprehensive learning coverage.

EXTRACTED TOPICS:
{topics_text}

ORIGINAL SYLLABUS CONTEXT:
{syllabus_content[:1500]}...

USER PREFERENCES:
- Learning Goals: {learning_goals}
- Focus Areas: {focus_areas_text}
- Difficulty Level: {difficulty_level}
- Time Available: {time_available}

FILTERING GUIDELINES:
1. INCLUDE MORE TOPICS: Be generous in topic inclusion - prefer keeping topics over excluding them
2. Remove only obvious administrative content (grading, policies, schedules)
3. Keep all academic topics, even if they seem minor or specialized
4. Include subtopics and detailed concepts for thorough coverage
5. Preserve technical terminology and specialized vocabulary
6. Group related topics into logical learning sequences
7. Prioritize based on importance but include lower-priority topics too
8. Estimate learning difficulty and time requirements realistically
9. Create a comprehensive learning path with detailed coverage

FILTERING TASKS:
1. Remove redundant, administrative, or non-essential topics
2. Identify core foundational topics vs. advanced topics
3. Group related topics into logical learning sequences
4. Prioritize based on importance and prerequisites
5. Estimate learning difficulty and time requirements
6. Suggest optimal learning order
7. INCLUDE MORE TOPICS: Be generous in topic inclusion - prefer keeping topics over excluding them
8. Preserve specialized terminology and technical concepts
9. Include subtopics and detailed concepts for comprehensive learning

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
            
            logger.info("    Creating Gemini model (2.5-flash)...")
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            logger.info("    Generating content...")
            response = model.generate_content(prompt, generation_config=genai.types.GenerationConfig(temperature=0.0, max_output_tokens=3000))
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
        
        # Fallback: More permissive filtering logic
        logger.info("🔄 Using enhanced fallback topic filtering...")
        
        # Remove only clearly administrative topics (more permissive)
        admin_keywords = ['syllabus overview', 'course policies', 'grading system', 'attendance policy', 'office hours schedule']
        filtered = [topic for topic in extracted_topics 
                   if not any(keyword in topic.lower() for keyword in admin_keywords)]
        
        # Enhanced prioritization - include more topics
        priority_topics = []
        for i, topic in enumerate(filtered[:40]):  # Increased from 20 to 40
            priority_topics.append({
                "topic": topic,
                "category": "foundational" if i < 8 else "intermediate" if i < 25 else "advanced",  # More generous categorization
                "priority": "critical" if i < 5 else "high" if i < 15 else "medium" if i < 30 else "low",
                "estimated_hours": 2.5 + (i % 4),  # Varied time estimates
                "difficulty_score": min(i // 3 + 3, 9),  # More gradual difficulty progression
                "prerequisites": [],
                "learning_objectives": [f"Understand {topic}", f"Apply {topic} concepts"],
                "why_important": "Essential curriculum topic" if i < 15 else "Important supporting topic",
                "suggested_resources": []
            })
        
        return {
            "filtered_topics": priority_topics,
            "learning_path": {
                "phase_1_foundation": [t["topic"] for t in priority_topics[:8]],  # Increased from 5
                "phase_2_core": [t["topic"] for t in priority_topics[8:20]],      # Increased coverage
                "phase_3_advanced": [t["topic"] for t in priority_topics[20:32]], # More advanced topics
                "phase_4_application": [t["topic"] for t in priority_topics[32:]] + ["Final project", "Review and integration"]
            },
            "filtering_insights": {
                "topics_removed": len(extracted_topics) - len(priority_topics),
                "topics_kept": len(priority_topics),
                "removal_reasons": ["Only clearly administrative content filtered"],
                "learning_sequence_rationale": "Comprehensive coverage with gradual progression",
                "time_estimate_total": sum(t["estimated_hours"] for t in priority_topics),
                "difficulty_progression": "gradual with comprehensive coverage"
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
GOAL: Comprehensive topic extraction - include as many relevant academic topics as possible.

SYLLABUS CONTENT:
{text}

Perform the following analysis with COMPREHENSIVE COVERAGE:

1. TOPIC EXTRACTION: Identify ALL core academic topics (exclude only administrative content)
2. DIFFICULTY SCORING: Rate each topic 1-10 based on complexity
3. PREREQUISITE ANALYSIS: Identify topic dependencies  
4. TIME ESTIMATION: Estimate study hours per topic
5. PRIORITY RANKING: Rank topics by importance and urgency
6. COMPREHENSIVE INCLUSION: Include specialized terms, subtopics, and detailed concepts

GUIDELINES:
- Include MORE topics rather than fewer
- Preserve technical terminology and specialized vocabulary
- Include both broad concepts and specific subtopics
- Cover mathematical formulas, equations, and technical terms
- Include programming concepts, algorithms, and methodologies
- Extract both theoretical and practical topics

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
            
            parsed["topics"] = valid_topics[:30]  # Increased limit from 20 to 30 topics
            return parsed
            
    except Exception as e:
        import logging
        logger = logging.getLogger('xenia')
        logger.error(f"AI syllabus analysis failed: {e}")
    
    # Enhanced fallback analysis with topic extraction
    try:
        from .weaktopics import extract_topics_from_text
        extracted_topics = extract_topics_from_text(text)[:20]  # Increased from 10
        
        fallback_topics = []
        for i, topic in enumerate(extracted_topics):
            fallback_topics.append({
                "topic": topic,
                "score": 4 + (i % 4),  # Vary difficulty scores (4-7)
                "category": "foundational" if i < 5 else "intermediate" if i < 12 else "advanced",
                "prerequisites": [],
                "estimated_hours": 2 + (i % 6),  # More varied time estimates
                "priority": "high" if i < 8 else "medium" if i < 15 else "low",
                "keywords": topic.lower().split()[:4]  # More keywords
            })
        
        return {
            "topics": fallback_topics,
            "difficulty": "intermediate",
            "estimated_total_hours": sum(t["estimated_hours"] for t in fallback_topics),
            "subject_area": "General Studies",
            "learning_objectives": ["Comprehensive understanding of all topics"],
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


def get_topic_resources(topic: str, learning_style: str = "balanced", difficulty_level: str = "intermediate",
                      user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
    """Get comprehensive resources for a specific topic using Gemini 2.0 Flash with enhanced personalization."""
    import logging
    
    logger = logging.getLogger('xenia')
    logger.info(f"🔍 Finding personalized resources for topic: {topic}")
    
    # Extract user preferences
    user_prefs = user_preferences or {}
    preferred_formats = user_prefs.get("preferred_formats", ["video", "article", "practice"])
    time_available = user_prefs.get("time_available", "moderate")
    free_resources_only = user_prefs.get("free_resources_only", True)
    
    prompt = f"""You are an expert educational resource curator. Find the best, most current learning resources for: "{topic}".

PERSONALIZATION REQUIREMENTS:
- Learning Style: {learning_style}
- Difficulty Level: {difficulty_level}
- Preferred Formats: {', '.join(preferred_formats)}
- Time Available: {time_available}
- Free Resources Only: {free_resources_only}

QUALITY CRITERIA:
1. Prioritize well-known educational platforms and creators
2. Include diverse learning formats (visual, text, interactive, practice)
3. Ensure resources are current and actively maintained
4. Focus on comprehensive, beginner-friendly explanations
5. Include hands-on practice opportunities

Return ONLY valid JSON with REAL, SPECIFIC resources (not generic examples):
{{
  "topic": "{topic}",
  "personalization_summary": {{
    "learning_style_optimization": "How resources match the {learning_style} learning style",
    "difficulty_progression": "Resource ordering from {difficulty_level} level",
    "time_estimate": "Total estimated learning time based on {time_available} availability"
  }},
  "youtube_videos": [
    {{
      "title": "Specific Video Title (not generic)",
      "channel": "Actual Channel Name",
      "url": "https://youtube.com/watch?v=REAL_VIDEO_ID",
      "duration": "exact minutes",
      "difficulty": "beginner|intermediate|advanced",
      "rating": 4.8,
      "description": "What specifically this video covers",
      "why_recommended": "Why this matches user preferences",
      "learning_outcomes": ["Specific skill 1", "Specific skill 2"]
    }}
  ],
  "articles_and_guides": [
    {{
      "title": "Specific Article/Guide Title",
      "source": "Actual Website/Platform Name",
      "url": "https://actual-domain.com/specific-path",
      "read_time": "X minutes",
      "type": "tutorial|reference|explanation|interactive",
      "quality_score": 9,
      "author": "Expert Author Name",
      "updated": "2024 or recent",
      "key_concepts": ["Concept 1", "Concept 2"]
    }}
  ],
  "practice_platforms": [
    {{
      "name": "Platform Name",
      "url": "https://platform.com",
      "type": "exercises|quizzes|simulations|coding",
      "free": true,
      "features": ["Specific feature 1", "Specific feature 2"],
      "difficulty_levels": ["beginner", "intermediate", "advanced"],
      "estimated_completion": "X hours"
    }}
  ],
  "documentation": [
    {{
      "title": "Official Documentation/Reference",
      "url": "https://official-docs.com",
      "type": "reference|api_docs|specification",
      "completeness": "comprehensive|partial",
      "maintenance": "actively_maintained|stable",
      "best_for": "Quick reference|Deep learning|Examples"
    }}
  ],
  "books_and_papers": [
    {{
      "title": "Specific Book/Paper Title",
      "author": "Author Name",
      "type": "textbook|research_paper|guide|handbook",
      "availability": "free|paid|library|open_access",
      "relevance_score": 9,
      "publication_year": 2023,
      "pages": 200,
      "level": "undergraduate|graduate|professional"
    }}
  ],
  "interactive_tools": [
    {{
      "name": "Tool Name",
      "url": "https://tool-site.com",
      "type": "simulation|calculator|visualizer|sandbox",
      "description": "What this tool helps you do",
      "supported_features": ["Feature 1", "Feature 2"],
      "browser_based": true
    }}
  ],
  "study_strategies": [
    {{
      "strategy": "Specific learning strategy",
      "description": "How to implement this strategy",
      "time_required": "X minutes/hours",
      "effectiveness": "high|medium|low",
      "best_for": "Visual learners|Beginners|Practice"
    }}
  ],
  "learning_path": {{
    "beginner": ["Resource 1", "Resource 2"],
    "intermediate": ["Resource 3", "Resource 4"], 
    "advanced": ["Resource 5", "Resource 6"],
    "practice": ["Practice resource 1", "Practice resource 2"]
  }},
  "study_tips": [
    "Specific, actionable tip for learning {topic}",
    "Another concrete strategy for mastering this topic",
    "How to avoid common pitfalls when studying {topic}"
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
        
        # Enhance parsed response with quality metrics
        if "youtube_videos" in parsed:
            for video in parsed["youtube_videos"]:
                video["recommendation_reason"] = video.get("why_recommended", "Matches search criteria")
                video["personalization_match"] = _calculate_video_match_score(video, learning_style, difficulty_level)
        
        if "articles_and_guides" in parsed:
            for article in parsed["articles_and_guides"]:
                article["recommendation_reason"] = f"High-quality {article.get('type', 'resource')} content"
                article["personalization_match"] = _calculate_article_match_score(article, learning_style)
        
        logger.info(f"✅ Found comprehensive resources: {len(parsed.get('youtube_videos', []))} videos, {len(parsed.get('articles_and_guides', []))} articles")
        return parsed
        
    except Exception as e:
        logger.error(f"Enhanced resource discovery failed: {e}")
        
        # Enhanced fallback with better personalization
        topic_encoded = topic.replace(" ", "+")
        
        # Generate learning style specific recommendations
        video_recommendations = _generate_learning_style_videos(topic, learning_style, difficulty_level)
        article_recommendations = _generate_learning_style_articles(topic, learning_style)
        practice_recommendations = _generate_practice_resources(topic, difficulty_level)
        
        return {
            "topic": topic,
            "personalization_summary": {
                "learning_style_optimization": f"Resources curated for {learning_style} learning style",
                "difficulty_progression": f"Starting at {difficulty_level} level with clear progression",
                "time_estimate": "2-4 hours for comprehensive coverage"
            },
            "youtube_videos": video_recommendations,
            "articles_and_guides": article_recommendations,
            "practice_platforms": practice_recommendations,
            "documentation": [
                {
                    "title": f"{topic} Reference Documentation",
                    "url": f"https://google.com/search?q={topic_encoded}+documentation+reference",
                    "type": "reference",
                    "completeness": "partial",
                    "best_for": "Quick reference and examples"
                }
            ],
            "books_and_papers": [
                {
                    "title": f"Introduction to {topic}",
                    "author": "Academic Authors",
                    "type": "textbook",
                    "availability": "library",
                    "relevance_score": 7,
                    "level": difficulty_level
                }
            ],
            "interactive_tools": [
                {
                    "name": f"{topic} Interactive Practice",
                    "url": f"https://google.com/search?q={topic_encoded}+interactive+tool+practice",
                    "type": "practice",
                    "description": f"Interactive exercises and simulations for {topic}",
                    "browser_based": True
                }
            ],
            "study_strategies": [
                {
                    "strategy": f"Spaced repetition for {topic}",
                    "description": "Review key concepts at increasing intervals",
                    "time_required": "15 minutes daily",
                    "effectiveness": "high",
                    "best_for": f"{learning_style} learners"
                }
            ],
            "learning_path": {
                "beginner": [f"Basic {topic} concepts", "Foundational principles"],
                "intermediate": [f"Applied {topic}", "Real-world examples"],
                "advanced": [f"Advanced {topic} techniques", "Expert-level applications"],
                "practice": ["Hands-on exercises", "Project-based learning"]
            },
            "study_tips": [
                f"Start with the fundamentals before diving into advanced {topic} concepts",
                f"Practice {topic} regularly with hands-on exercises and real examples",
                f"Connect {topic} concepts to practical applications in your field",
                "Use active recall techniques to reinforce your understanding",
                "Join study groups or online communities focused on this topic"
            ]
        }


def _calculate_video_match_score(video: Dict[str, Any], learning_style: str, difficulty_level: str) -> float:
    """Calculate how well a video matches user preferences."""
    score = 5.0
    
    # Learning style match
    if learning_style == "visual" and "tutorial" in video.get("title", "").lower():
        score += 2
    elif learning_style == "auditory" and "lecture" in video.get("title", "").lower():
        score += 2
    
    # Difficulty match
    video_difficulty = video.get("difficulty", "intermediate")
    if video_difficulty == difficulty_level:
        score += 1.5
    
    # Quality indicators
    if video.get("rating", 0) >= 4.5:
        score += 1
    
    return min(score, 10)


def _calculate_article_match_score(article: Dict[str, Any], learning_style: str) -> float:
    """Calculate how well an article matches user preferences."""
    score = 5.0
    
    # Learning style match
    if learning_style == "reading" and article.get("type") in ["tutorial", "guide"]:
        score += 2
    
    # Quality indicators
    if article.get("quality_score", 0) >= 8:
        score += 1
    
    return min(score, 10)


def _generate_learning_style_videos(topic: str, learning_style: str, difficulty_level: str) -> List[Dict[str, Any]]:
    """Generate learning style optimized video recommendations."""
    topic_encoded = topic.replace(" ", "+")
    
    if learning_style == "visual":
        search_terms = ["tutorial", "demonstration", "animated", "visual"]
    elif learning_style == "auditory":
        search_terms = ["lecture", "explanation", "podcast", "discussion"]
    else:
        search_terms = ["tutorial", "guide", "walkthrough"]
    
    videos = []
    for i, term in enumerate(search_terms[:3]):
        videos.append({
            "title": f"{topic} - {term.title()} for {difficulty_level.title()} Learners",
            "channel": "Educational Channel",
            "url": f"https://youtube.com/results?search_query={topic_encoded}+{term}+{difficulty_level}",
            "duration": f"{15 + i*5} minutes",
            "difficulty": difficulty_level,
            "rating": 4.5 + i*0.1,
            "description": f"Comprehensive {term} covering {topic} fundamentals",
            "why_recommended": f"Optimized for {learning_style} learning style",
            "personalization_match": 8 + i
        })
    
    return videos


def _generate_learning_style_articles(topic: str, learning_style: str) -> List[Dict[str, Any]]:
    """Generate learning style optimized article recommendations."""
    topic_encoded = topic.replace(" ", "+")
    
    articles = []
    if learning_style == "reading":
        article_types = ["comprehensive guide", "step-by-step tutorial", "reference documentation"]
    else:
        article_types = ["quick start guide", "visual tutorial", "interactive examples"]
    
    for i, article_type in enumerate(article_types):
        articles.append({
            "title": f"{topic} - {article_type.title()}",
            "source": "Educational Platform",
            "url": f"https://google.com/search?q={topic_encoded}+{article_type.replace(' ', '+')}",
            "read_time": f"{10 + i*5} minutes",
            "type": "tutorial" if "tutorial" in article_type else "guide",
            "quality_score": 8 + i,
            "author": "Expert Contributors",
            "key_concepts": [f"{topic} fundamentals", "Practical applications"],
            "recommendation_reason": f"Matches {learning_style} learning preferences"
        })
    
    return articles


def _generate_practice_resources(topic: str, difficulty_level: str) -> List[Dict[str, Any]]:
    """Generate practice resources based on difficulty level."""
    
    if difficulty_level == "beginner":
        practice_types = ["guided exercises", "interactive tutorials"]
    elif difficulty_level == "intermediate":
        practice_types = ["coding challenges", "practical projects"]
    else:
        practice_types = ["advanced simulations", "expert challenges"]
    
    platforms = []
    for practice_type in practice_types:
        platforms.append({
            "name": f"{topic} {practice_type.title()}",
            "url": f"https://google.com/search?q={topic.replace(' ', '+')}+{practice_type.replace(' ', '+')}",
            "type": "exercises" if "exercise" in practice_type else "projects",
            "free": True,
            "features": ["Progress tracking", "Instant feedback", "Solution explanations"],
            "difficulty_levels": [difficulty_level],
            "estimated_completion": f"{2 + len(practice_types)} hours"
        })
    
    return platforms

def filter_syllabus_content(extracted_text: str) -> str:
    """Use Gemini AI to filter out unnecessary content from extracted syllabus text.
    
    Removes administrative content, headers/footers, grading policies, etc.
    Keeps only academic content relevant for topic extraction.
    """
    import logging
    logger = logging.getLogger('xenia')
    
    # If text is too short, return as-is
    if len(extracted_text) < 500:
        return extracted_text
    
    prompt = f"""
You are an expert at cleaning syllabus documents for educational content extraction.

Your task is to filter the extracted text from a syllabus PDF and remove:
1. Administrative content (grading policies, attendance, office hours, course policies)
2. Headers and footers (page numbers, university logos, contact info)
3. Course logistics (prerequisites, textbooks, required materials)
4. Assessment details (exam schedules, assignment deadlines, marking schemes)
5. Contact information and administrative procedures
6. Generic course descriptions and learning objectives sections
7. Copyright notices and disclaimers
8. Table of contents and navigation elements

KEEP ONLY:
- Academic topics, units, and chapters
- Learning content, concepts, and subject matter
- Technical terminology and specialized vocabulary
- Course-specific content that students need to learn
- Detailed topic descriptions and subtopics

IMPORTANT: Be conservative in removal - if you're unsure, keep the content.

Return ONLY the filtered academic content, maintaining the original structure where possible.

ORIGINAL TEXT:
{extracted_text[:4000]}...

FILTERED ACADEMIC CONTENT:
"""
    
    try:
        # Use faster Gemini model
        gemini_key = os.getenv("GEMINI_API_KEY")
        is_demo_gemini = (gemini_key and ("demo" in gemini_key.lower() or gemini_key.startswith("AIzaSyDemo_")))
        
        if gemini_key and not is_demo_gemini:
            import google.generativeai as genai
            logger.info("🤖 Filtering syllabus content with Gemini...")
            genai.configure(api_key=gemini_key)
            
            # Use higher-capacity model: Gemini 2.5 Flash
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.0,  # deterministic filtering
                    max_output_tokens=4000,
                )
            )
            
            if response and response.text:
                filtered_text = response.text.strip()
                logger.info(f"✅ Content filtered: {len(extracted_text)} -> {len(filtered_text)} characters")
                return filtered_text
            else:
                logger.warning("⚠️ Gemini filtering returned empty response")
                return extracted_text
        else:
            logger.info("🎭 Using fallback content filtering...")
            
    except Exception as e:
        logger.error(f"❌ Content filtering failed: {e}")
        # As a robust fallback apply deterministic regex-based cleaning
        cleaned = []
        lines = extracted_text.splitlines()
        for line in lines:
            s = line.strip()
            # Skip empty or very short navigation lines
            if not s or len(s) < 3:
                continue
            # Remove page number lines like 'Page 1 of 10' or just numerics
            if re.match(r'^(page\s+\d+|\d+\s*/\s*\d+)$', s, re.I):
                continue
            # Remove emails, phones, urls
            if re.search(r"\b[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,6}\b", s):
                continue
            if re.search(r"\bhttps?://|www\.", s):
                continue
            if re.search(r"\(\d{3}\)\s*\d{3}-\d{4}|\d{3}[-\.\s]\d{3}[-\.\s]\d{4}", s):
                continue
            # Common administrative headings to drop
            admin_keywords = ['grading', 'attendance', 'office hours', 'course policies', 'textbook', 'required materials', 'assessment', 'exam', 'assignment', 'policy', 'contact', 'email', 'phone']
            if any(k in s.lower() for k in admin_keywords):
                continue
            # Drop lines that look like table-of-contents numbering without content
            if re.match(r'^\d+\.?\s*$', s):
                continue
            cleaned.append(s)

        # Keep blocks that look like topics: lines with commas, colons, bullets, arrows or title case
        topic_lines = []
        for s in cleaned:
            if re.search(r'\b(topic|chapter|week|unit|module)\b', s, re.I):
                topic_lines.append(s)
            elif re.search(r'[-\u2022\u25B8\u25BA\u25CF\u2023\u25E6]', s):
                topic_lines.append(s)
            elif len(s.split()) <= 6 and any(c.isupper() for c in s[:1]):
                # Short title-like lines
                topic_lines.append(s)
            elif ',' in s and len(s.split(',')) <= 6:
                topic_lines.append(s)

        if topic_lines:
            return "\n".join(topic_lines)
        return "\n".join(cleaned)
    

def extract_topics_with_gemini(extracted_text: str, max_topics: int = 100) -> List[Dict[str, Any]]:
    """Use Gemini 2.5 Flash to extract structured topics and subtopics from cleaned syllabus text.

    Returns a list of topic dicts: {"topic": str, "subtopics": [str], "notes": str}
    """
    import logging
    logger = logging.getLogger('xenia')

    # Avoid calling AI on very short text
    if not extracted_text or len(extracted_text.strip()) < 50:
        return []

    prompt = f"""
Extract the academic topics and subtopics from the following syllabus text.

Return STRICTLY valid JSON in this exact format:
{{"topics": [{{"topic":"Topic Name","subtopics":["sub1","sub2"],"notes":"short notes"}}]}}

Input text:
{extracted_text[:5000]}

Rules:
- Only include academic topics (no administrative content).
- Group closely related items as subtopics under the nearest main topic.
- Provide concise notes when relevant (1-2 sentences).
- Aim to provide up to {max_topics} topics in order of importance.
"""

    gemini_key = os.getenv("GEMINI_API_KEY")
    is_demo_gemini = (gemini_key and ("demo" in gemini_key.lower() or gemini_key.startswith("AIzaSyDemo_")))

    try:
        if gemini_key and not is_demo_gemini:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt, generation_config=genai.types.GenerationConfig(temperature=0.0, max_output_tokens=3000))
            text = response.text.strip()

            # strip fences
            if text.startswith('```'):
                # remove first code fence and optional language
                parts = text.split('\n', 1)
                if len(parts) > 1:
                    text = parts[1]
                if text.endswith('```'):
                    text = text[:-3]

            parsed = json.loads(text)
            topics = parsed.get('topics', [])
            # normalize to expected list of dicts
            normalized = []
            for t in topics:
                if isinstance(t, str):
                    normalized.append({"topic": t, "subtopics": [], "notes": ""})
                elif isinstance(t, dict):
                    normalized.append({
                        "topic": t.get('topic') or t.get('name'),
                        "subtopics": t.get('subtopics', []),
                        "notes": t.get('notes', '')
                    })
            logger.info(f"✅ Gemini extracted {len(normalized)} topics")
            return normalized
    except Exception as e:
        logger.error(f"Gemini topic extraction failed: {e}")

    # Fallback to local weak topic extractor
    try:
        from .weaktopics import extract_topics_from_text
        raw_topics = extract_topics_from_text(extracted_text)
        normalized = []
        for t in raw_topics[:max_topics]:
            if isinstance(t, str):
                normalized.append({"topic": t, "subtopics": [], "notes": ""})
            elif isinstance(t, dict):
                normalized.append({"topic": t.get('topic', ''), "subtopics": t.get('subtopics', []), "notes": ''})
        return normalized
    except Exception:
        return []
