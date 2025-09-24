import io
from typing import Dict, Optional, List
from PIL import Image
import pytesseract
import logging
from ..services.weaktopics import get_remediation_steps
from .tutor_storage import save_message, fetch_history
from ..utils import is_valid_uuid
from ..errors import ApiError
import re
import traceback
from ..supabase_client import get_supabase_client
import asyncio

logger = logging.getLogger('xenia')

class EnhancedTutor:
    """Advanced AI tutor with sophisticated question understanding and OCR."""
    
    @staticmethod
    def extract_text_from_image(image_bytes: bytes) -> str:
        """Extract text from image with enhanced OCR processing."""
        try:
            img = Image.open(io.BytesIO(image_bytes))
            
            # Enhanced OCR with better configuration
            custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-=()[]{}.,;:!?/\\ '
            text = pytesseract.image_to_string(img, config=custom_config)
            
            # Clean up OCR artifacts
            cleaned_text = text.replace('|', 'I').replace('0', 'O')  # Common OCR mistakes
            cleaned_text = ' '.join(cleaned_text.split())  # Normalize whitespace
            
            logger.info(f"OCR extracted {len(cleaned_text)} characters from image")
            return cleaned_text
            
        except Exception as e:
            logger.error(f"OCR processing failed: {e}")
            return ""
    
    @staticmethod
    def analyze_question_type(question: str) -> Dict[str, str]:
        """Analyze question to determine type and appropriate solving strategy."""
        question_lower = question.lower()
        
        # Math question indicators
        math_indicators = ['solve', 'equation', 'calculate', 'find x', 'derivative', 'integral', 'limit', '+', '-', '*', '/', '=']
        if any(indicator in question_lower for indicator in math_indicators):
            return {"type": "mathematics", "strategy": "step_by_step_calculation"}
        
        # Science question indicators
        science_indicators = ['molecule', 'atom', 'force', 'energy', 'reaction', 'physics', 'chemistry', 'biology']
        if any(indicator in question_lower for indicator in science_indicators):
            return {"type": "science", "strategy": "conceptual_explanation"}
        
        # Programming question indicators
        code_indicators = ['algorithm', 'code', 'function', 'programming', 'python', 'java', 'javascript']
        if any(indicator in question_lower for indicator in code_indicators):
            return {"type": "programming", "strategy": "code_solution"}
        
        # General question
        return {"type": "general", "strategy": "comprehensive_explanation"}
    
    @staticmethod
    def _load_user_syllabus_context(user_id: str) -> Dict[str, str]:
        """Load user's syllabus context from database for personalized responses."""
        try:
            if not is_valid_uuid(user_id):
                return {"context": "basic", "subject_area": "General", "topics": ""}
            
            supabase = get_supabase_client()
            
            # Load syllabus topics from database
            topics_response = supabase.table('syllabus_topics').select('*').eq('user_id', user_id).limit(20).execute()
            
            # Load recent syllabus artifacts for additional context
            artifacts_response = supabase.table('syllabus_artifacts').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(3).execute()
            
            topics = []
            subject_areas = set()
            
            if topics_response.data:
                for topic_row in topics_response.data:
                    topic_name = topic_row.get('topic', '')
                    if topic_name:
                        topics.append(topic_name)
                        # Extract subject area from topic (first word/phrase before colon or dash)
                        if ':' in topic_name:
                            subject_areas.add(topic_name.split(':')[0].strip())
                        elif '-' in topic_name:
                            subject_areas.add(topic_name.split('-')[0].strip())
            
            # Auto-detect subject area based on topics
            subject_area = "General"
            topic_text = ' '.join(topics).lower()
            
            if any(word in topic_text for word in ['math', 'calculus', 'algebra', 'geometry', 'statistics']):
                subject_area = "Mathematics"
            elif any(word in topic_text for word in ['physics', 'chemistry', 'biology', 'science']):
                subject_area = "Science"
            elif any(word in topic_text for word in ['programming', 'computer', 'algorithm', 'coding', 'software']):
                subject_area = "Computer Science"
            elif any(word in topic_text for word in ['english', 'literature', 'writing', 'essay']):
                subject_area = "English"
            elif subject_areas:
                subject_area = list(subject_areas)[0]
            
            context_info = {
                "context": "personalized" if topics else "basic",
                "subject_area": subject_area,
                "topics": ", ".join(topics[:10]) if topics else "",  # Limit to first 10 topics
                "curriculum_level": "undergraduate" if len(topics) > 5 else "high_school"
            }
            
            logger.info(f"Loaded syllabus context for user {user_id}: {len(topics)} topics, subject: {subject_area}")
            return context_info
            
        except Exception as e:
            logger.warning(f"Failed to load syllabus context for user {user_id}: {e}")
            return {"context": "basic", "subject_area": "General", "topics": ""}
    
    @staticmethod
    def generate_advanced_solution(question: str, question_analysis: Dict, syllabus_context: Optional[Dict] = None) -> List[Dict]:
        """Generate advanced solution using AI with question-type awareness."""
        from .ai_providers import get_ai_response

        question_type = question_analysis.get("type", "general")
        strategy = question_analysis.get("strategy", "comprehensive_explanation")

        # Build context-aware prompt prefix
        context_prefix = ""
        if syllabus_context and syllabus_context.get("context") == "personalized":
            context_prefix = f"""
CONTEXT: You are tutoring a {syllabus_context.get('curriculum_level', 'student')} student in {syllabus_context.get('subject_area', 'General')}.
Current syllabus topics include: {syllabus_context.get('topics', 'various topics')}.
Please tailor your explanation to be relevant to their current curriculum and reference these topics when applicable.
"""
        
        # Craft specialized prompts based on question type
        if question_type == "mathematics":
            prompt = f"""
You are an expert mathematics tutor. Solve this step-by-step and format your response in Markdown:{context_prefix}

QUESTION: {question}

FORMATTING REQUIREMENTS:
- Use **bold** for key terms, formulas, and important concepts
- Use *italics* for emphasis and definitions
- Use `inline code` for variables and simple formulas
- Use LaTeX math notation wrapped in $...$ for equations (e.g., $F = ma$, $x = \\frac{{-b \\pm \\sqrt{{b^2-4ac}}}}{{2a}}$)
- Use numbered lists for steps (1, 2, 3...)
- Use bullet points (-) for examples or sub-points
- Break content into short, scannable paragraphs

Provide a structured solution in JSON format. IMPORTANT: Ensure the output is a single, valid JSON object with no extra text or markdown formatting. All keys and string values must be enclosed in double quotes.
{{
  "steps": [
    {{
      "title": "**Step 1: Identify what's given**",
      "detail": "Clear explanation of given information in **Markdown format** with proper $LaTeX$ math notation",
      "calculation": "Any relevant formula like $F = ma$ or calculation steps"
    }},
    {{
      "title": "**Step 2: Apply appropriate method**", 
      "detail": "Explanation of the *method* being used with **key concepts** highlighted",
      "calculation": "Detailed calculation with $mathematical$ expressions shown step by step"
    }},
    {{
      "title": "**Step 3: Solve and verify**",
      "detail": "Final calculation and *verification* process explained clearly",
      "calculation": "Final answer with units if applicable, formatted as $result = value$"
    }}
  ],
  "final_answer": "Clear final answer with proper **Markdown** formatting and $LaTeX$ if needed",
  "key_concepts": ["List of key mathematical concepts used"]
}}
"""
        elif question_type == "science":
            prompt = f"""
You are an expert science tutor. Explain this scientific concept or solve this problem and format your response in Markdown:{context_prefix}

QUESTION: {question}

FORMATTING REQUIREMENTS:
- Use **bold** for key scientific terms, laws, and important concepts
- Use *italics* for emphasis and definitions
- Use `inline code` for formulas, variables, and chemical equations
- Use LaTeX math notation wrapped in $...$ for equations (e.g., $E = mc^2$, $PV = nRT$)
- Use numbered lists for steps (1, 2, 3...)
- Use bullet points (-) for examples or sub-points
- Break content into short, scannable paragraphs

Provide a structured explanation in JSON format. IMPORTANT: Ensure the output is a single, valid JSON object with no extra text or markdown formatting. All keys and string values must be enclosed in double quotes.
{{
  "steps": [
    {{
      "title": "**Step 1: Understanding the concept**",
      "detail": "Clear explanation of underlying **scientific principles** with proper $LaTeX$ notation for formulas"
    }},
    {{
      "title": "**Step 2: Applying scientific method**",
      "detail": "How to approach this *scientifically* with **key concepts** highlighted"
    }},
    {{
      "title": "**Step 3: Solution or explanation**",
      "detail": "Detailed solution with *scientific reasoning* and proper **Markdown** formatting"
    }}
  ],
  "final_answer": "Clear conclusion or answer with proper **Markdown** formatting and $LaTeX$ if needed",
  "key_concepts": ["List of key scientific concepts"],
  "real_world_applications": ["How this applies in real life"]
}}
"""
        elif question_type == "programming":
            prompt = f"""
You are an expert programming tutor. Help solve this coding problem and format your response in Markdown:{context_prefix}

QUESTION: {question}

FORMATTING REQUIREMENTS:
- Use **bold** for key programming terms, algorithms, and important concepts
- Use *italics* for emphasis and definitions
- Use `inline code` for variables, functions, and short code snippets
- Use code blocks with language specification for longer code examples
- Use numbered lists for steps (1, 2, 3...)
- Use bullet points (-) for examples or sub-points
- Break content into short, scannable paragraphs

Provide a structured solution in JSON format. IMPORTANT: Ensure the output is a single, valid JSON object with no extra text or markdown formatting. All keys and string values must be enclosed in double quotes.
{{
  "steps": [
    {{
      "title": "**Step 1: Problem analysis**",
      "detail": "Break down what the problem is asking with **key requirements** highlighted",
      "code_snippet": "```python\\n# Relevant pseudocode or approach\\nfunction_name(parameters)\\n```"
    }},
    {{
      "title": "**Step 2: Algorithm design**",
      "detail": "Explain the *algorithm* or **approach** with proper Markdown formatting",
      "code_snippet": "```python\\n# Key algorithmic components\\nfor item in collection:\\n    process(item)\\n```"
    }},
    {{
      "title": "**Step 3: Implementation**",
      "detail": "Complete working solution with *detailed explanation*",
      "code_snippet": "```python\\n# Full working code solution\\ndef solve_problem():\\n    return result\\n```"
    }}
  ],
  "final_answer": "Complete solution with **proper explanation** and Markdown formatting",
  "key_concepts": ["Programming concepts used"],
  "time_complexity": "Big O analysis if applicable, formatted as $O(n)$ notation"
}}
"""
        else:
            prompt = f"""
You are an expert tutor. Provide a comprehensive explanation for this question and format your response in Markdown:{context_prefix}

QUESTION: {question}

FORMATTING REQUIREMENTS:
- Use **bold** for key terms, laws, and important concepts
- Use *italics* for emphasis and definitions
- Use `inline code` for formulas or variables
- Use LaTeX math notation wrapped in $...$ for equations when applicable
- Use numbered lists for steps (1, 2, 3...)
- Use bullet points (-) for examples or sub-points
- Break content into short, scannable paragraphs

Provide a structured explanation in JSON format. IMPORTANT: Ensure the output is a single, valid JSON object with no extra text or markdown formatting. All keys and string values must be enclosed in double quotes.
{{
  "steps": [
    {{
      "title": "**Step 1: Understanding the question**",
      "detail": "What exactly is being asked, with **key terms** highlighted"
    }},
    {{
      "title": "**Step 2: Key information and context**",
      "detail": "Important *background* and **context** with proper Markdown formatting"
    }},
    {{
      "title": "**Step 3: Detailed explanation**",
      "detail": "Comprehensive answer with *examples* and **key concepts** clearly marked"
    }}
  ],
  "final_answer": "Clear, complete answer with proper **Markdown** formatting",
  "key_concepts": ["Important concepts covered"]
}}
"""

        logger.info(f"Generating {question_type} solution using AI...")

        try:
            response = get_ai_response(prompt)
            
            # Clean and parse the response more robustly
            clean_response = response.strip()
            
            # Use regex to find the JSON object
            match = re.search(r'\{.*\}', clean_response, re.DOTALL)
            if match:
                json_text = match.group(0)
            else:
                # Handle cases where no JSON object is found
                raise ApiError("TUTOR_AI_INVALID_RESPONSE", "No JSON object found in AI response.", status=500)

            import json
            parsed = json.loads(json_text)
            
            if isinstance(parsed, dict) and 'steps' in parsed:
                logger.info(f"✅ Generated {len(parsed['steps'])} solution steps")
                return parsed['steps']
            else:
                logger.warning("AI response didn't contain expected 'steps' format")
                raise ApiError("TUTOR_AI_INVALID_RESPONSE", "AI response was not in the expected format.", status=500)

        except Exception as e:
            logger.error(f"Advanced solution generation failed: {e}")
            raise ApiError("TUTOR_AI_FAILED", f"The AI provider failed to generate a response: {e}", status=502)

def solve_question(
    question: Optional[str], image_bytes: Optional[bytes], user_id: str, include_history: bool = True
) -> Dict:
    """Enhanced question solving with advanced AI tutoring capabilities."""
    
    try:
        if not question and not image_bytes:
            raise ApiError("TUTOR_TIMEOUT", "No input provided to tutor", status=400)
        
        # Extract text from image if provided
        if not question and image_bytes:
            question = EnhancedTutor.extract_text_from_image(image_bytes)
            logger.info(f"Extracted question from image: {question[:100]}...")
        
        if not question or len(question.strip()) < 3:
            raise ApiError("TUTOR_INVALID_INPUT", "Question is too short or unclear", status=400)
        
        # Load user's syllabus context for personalized responses
        syllabus_context = EnhancedTutor._load_user_syllabus_context(user_id)
        logger.info(f"Syllabus context: {syllabus_context.get('subject_area', 'General')} - {syllabus_context.get('context', 'basic')}")
        
        # Analyze question type for targeted tutoring
        question_analysis = EnhancedTutor.analyze_question_type(question)
        logger.info(f"Question analysis: {question_analysis}")
        
        # Try advanced AI-powered solution first with syllabus context
        steps = EnhancedTutor.generate_advanced_solution(question, question_analysis, syllabus_context)
        
        if not steps:
            # This should ideally not be reached if generate_advanced_solution raises exceptions
            logger.warning("generate_advanced_solution returned no steps. This indicates a problem.")
            raise ApiError("TUTOR_NO_SOLUTION", "The AI tutor could not find a solution.", status=500)

        # Build comprehensive response with metadata
        # Per UI contract: if `steps` are present, keep `answer` as a short intro/summary only
        # Normalize and ensure sequential numbering on step titles so frontend can render them verbatim
        def _renumber_steps(steps_list, add_numbers=True):
          normalized = []
          for idx, st in enumerate(steps_list, start=1):
            if not isinstance(st, dict):
              st = {'title': str(st)}
            title = st.get('title', '') or ''
            logger.info(f"Original title {idx}: '{title}'")
            # strip existing leading numbering - be very aggressive
            # Remove patterns like: 1., 1), Step 1:, **1.**, etc.
            title_clean = re.sub(r'^\s*\*?\*?\s*(?:Step\s+)?\d+\s*[\)\.:\-\s]+\*?\*?\s*', '', title, flags=re.IGNORECASE).strip()
            # Also remove any remaining number patterns at the start
            title_clean = re.sub(r'^\s*\d+\s*[\)\.:\-\s]*', '', title_clean, flags=re.IGNORECASE).strip()
            # Clean up any double spaces or weird formatting
            title_clean = re.sub(r'\s+', ' ', title_clean).strip()
            if add_numbers:
              new_title = f"{idx}. {title_clean}" if title_clean else f"{idx}."
            else:
              new_title = title_clean
            logger.info(f"Renumbered title {idx}: '{new_title}'")
            st['title'] = new_title
            normalized.append(st)
          return normalized

        if steps:
          try:
            steps = _renumber_steps(steps, add_numbers=True)  # Set to False to remove numbering
          except Exception as e:
            logger.warning(f"Failed to renumber steps: {e}")
          answer = "Here are the steps to solve the problem."
        else:
          # This else block should not be reachable anymore
          answer = "I'm sorry, I couldn't generate an answer."

        # Save conversation to history if valid user
        if is_valid_uuid(user_id):
          try:
            save_message(user_id, 'user', question)
            save_message(user_id, 'ai', answer, steps=steps)
            logger.info(f"Saved tutor conversation for user {user_id}")
          except Exception as e:
            logger.warning(f"Could not save conversation: {e}")

        # Get conversation history if requested
        history: List[Dict] = []
        if include_history and is_valid_uuid(user_id):
          history = fetch_history(user_id)

        return {"question": question, "steps": steps, "answer": answer, "history": history}
    
    except ApiError:
        # Re-raise API errors as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in solve_question: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Return a more specific fallback response
        return {
            "question": question or "Unknown question",
            "steps": [],
            "answer": f"An unexpected error occurred: {e}. Please try again.",
            "history": []
        }
