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
    
    # Try Gemini first (since we have API key)
    gemini_key = os.getenv("GEMINI_API_KEY")
    logger.info(f"🤖 Attempting Gemini API call with key: {'✅ Present' if gemini_key else '❌ Missing'}")
    
    if gemini_key and gemini_key.strip():
        try:
            import google.generativeai as genai
            logger.info("   Configuring Gemini API...")
            genai.configure(api_key=gemini_key.strip())
            
            logger.info("   Creating Gemini model...")
            gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
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
    if openai_key and openai_key.strip():
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key.strip())
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"   ❌ OpenAI API error: {e}")
    
    # Try Anthropic
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_key and anthropic_key.strip():
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key.strip())
            response = client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"   ❌ Anthropic API error: {e}")
    
    # Fallback response if no API keys work
    logger.warning("   ⚠️ Using fallback response - no AI APIs available")
    return json.dumps({
        "steps": [
            {
                "title": "Understand the problem",
                "detail": "Break down what the question is asking step by step."
            },
            {
                "title": "Apply relevant concepts", 
                "detail": "Use the appropriate formulas, theorems, or methods to solve this problem."
            },
            {
                "title": "Show your work",
                "detail": "Work through the solution systematically, showing each calculation."
            },
            {
                "title": "Check your answer",
                "detail": "Verify your solution makes sense and satisfies the original problem."
            }
        ]
    })

def get_syllabus_analysis(text: str) -> Dict[str, Any]:
    """Analyze syllabus content using AI."""
    prompt = f"""
Analyze this syllabus content and extract key topics with difficulty scores (1-10):

{text}

Return JSON format:
{{
  "topics": [
    {{"topic": "Topic Name", "score": 7}}
  ],
  "difficulty": "intermediate",
  "estimated_hours": 45
}}
"""
    
    try:
        response = get_ai_response(prompt)
        return json.loads(response)
    except:
        # Fallback analysis
        return {
            "topics": [
                {"topic": "Mathematics", "score": 6},
                {"topic": "Science", "score": 7},
                {"topic": "Literature", "score": 5}
            ],
            "difficulty": "intermediate", 
            "estimated_hours": 40
        }

def get_assessment_analysis(text: str) -> Dict[str, Any]:
    """Analyze assessment content using AI."""
    prompt = f"""
Analyze this assessment/test content and identify weak areas:

{text}

Return JSON format:
{{
  "weak_areas": [
    {{"topic": "Topic Name", "score": 3}}
  ],
  "strengths": [
    {{"topic": "Strong Topic", "score": 8}}
  ],
  "overall_score": 65
}}
"""
    
    try:
        response = get_ai_response(prompt)
        return json.loads(response)
    except:
        # Fallback analysis
        return {
            "weak_areas": [
                {"topic": "Complex Problems", "score": 3},
                {"topic": "Advanced Concepts", "score": 4}
            ],
            "strengths": [
                {"topic": "Basic Concepts", "score": 8}
            ],
            "overall_score": 70
        }
