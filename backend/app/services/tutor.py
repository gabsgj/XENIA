import io
from typing import Dict, Optional, List
from PIL import Image
import pytesseract
import logging
from ..services.weaktopics import get_remediation_steps
from .tutor_storage import save_message, fetch_history
from ..utils import is_valid_uuid
from ..errors import ApiError

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
    def generate_advanced_solution(question: str, question_analysis: Dict) -> List[Dict]:
        """Generate advanced solution using AI with question-type awareness."""
        try:
            from .ai_providers import get_ai_response
            
            question_type = question_analysis.get("type", "general")
            strategy = question_analysis.get("strategy", "comprehensive_explanation")
            
            # Craft specialized prompts based on question type
            if question_type == "mathematics":
                prompt = f"""
You are an expert mathematics tutor. Solve this step-by-step:

QUESTION: {question}

Provide a structured solution in JSON format:
{{
  "steps": [
    {{
      "title": "Step 1: Identify what's given",
      "detail": "Clear explanation of given information",
      "calculation": "Any relevant formula or calculation"
    }},
    {{
      "title": "Step 2: Apply appropriate method", 
      "detail": "Explanation of the method being used",
      "calculation": "Detailed calculation with work shown"
    }},
    {{
      "title": "Step 3: Solve and verify",
      "detail": "Final calculation and verification",
      "calculation": "Final answer with units if applicable"
    }}
  ],
  "final_answer": "Clear final answer",
  "key_concepts": ["List of key mathematical concepts used"]
}}
"""
            elif question_type == "science":
                prompt = f"""
You are an expert science tutor. Explain this scientific concept or solve this problem:

QUESTION: {question}

Provide a structured explanation in JSON format:
{{
  "steps": [
    {{
      "title": "Step 1: Understanding the concept",
      "detail": "Clear explanation of underlying scientific principles"
    }},
    {{
      "title": "Step 2: Applying scientific method",
      "detail": "How to approach this scientifically"
    }},
    {{
      "title": "Step 3: Solution or explanation",
      "detail": "Detailed solution with scientific reasoning"
    }}
  ],
  "final_answer": "Clear conclusion or answer",
  "key_concepts": ["List of key scientific concepts"],
  "real_world_applications": ["How this applies in real life"]
}}
"""
            elif question_type == "programming":
                prompt = f"""
You are an expert programming tutor. Help solve this coding problem:

QUESTION: {question}

Provide a structured solution in JSON format:
{{
  "steps": [
    {{
      "title": "Step 1: Problem analysis",
      "detail": "Break down what the problem is asking",
      "code_snippet": "Relevant pseudocode or approach"
    }},
    {{
      "title": "Step 2: Algorithm design",
      "detail": "Explain the algorithm or approach",
      "code_snippet": "Key algorithmic components"
    }},
    {{
      "title": "Step 3: Implementation",
      "detail": "Complete working solution",
      "code_snippet": "Full working code solution"
    }}
  ],
  "final_answer": "Complete solution with explanation",
  "key_concepts": ["Programming concepts used"],
  "time_complexity": "Big O analysis if applicable"
}}
"""
            else:
                prompt = f"""
You are an expert tutor. Provide a comprehensive explanation for this question:

QUESTION: {question}

Provide a structured explanation in JSON format:
{{
  "steps": [
    {{
      "title": "Step 1: Understanding the question",
      "detail": "What exactly is being asked"
    }},
    {{
      "title": "Step 2: Key information and context",
      "detail": "Important background and context"
    }},
    {{
      "title": "Step 3: Detailed explanation",
      "detail": "Comprehensive answer with examples"
    }}
  ],
  "final_answer": "Clear, complete answer",
  "key_concepts": ["Important concepts covered"]
}}
"""
            
            logger.info(f"Generating {question_type} solution using AI...")
            
            response = get_ai_response(prompt)
            
            # Clean and parse the response
            clean_response = response.strip()
            if clean_response.startswith('```json'):
                clean_response = clean_response[7:]
            if clean_response.endswith('```'):
                clean_response = clean_response[:-3]
            
            import json
            parsed = json.loads(clean_response.strip())
            
            if isinstance(parsed, dict) and 'steps' in parsed:
                logger.info(f"✅ Generated {len(parsed['steps'])} solution steps")
                return parsed['steps']
            else:
                logger.warning("AI response didn't contain expected 'steps' format")
                
        except Exception as e:
            logger.error(f"Advanced solution generation failed: {e}")
        
        # Fallback to basic remediation steps
        return []


def solve_question(
    question: Optional[str], image_bytes: Optional[bytes], user_id: str, include_history: bool = True
) -> Dict:
    """Enhanced question solving with advanced AI tutoring capabilities."""
    
    if not question and not image_bytes:
        raise ApiError("TUTOR_TIMEOUT", "No input provided to tutor", status=400)
    
    # Extract text from image if provided
    if not question and image_bytes:
        question = EnhancedTutor.extract_text_from_image(image_bytes)
        logger.info(f"Extracted question from image: {question[:100]}...")
    
    if not question or len(question.strip()) < 3:
        raise ApiError("TUTOR_INVALID_INPUT", "Question is too short or unclear", status=400)
    
    # Analyze question type for targeted tutoring
    question_analysis = EnhancedTutor.analyze_question_type(question)
    logger.info(f"Question analysis: {question_analysis}")
    
    # Try advanced AI-powered solution first
    advanced_steps = EnhancedTutor.generate_advanced_solution(question, question_analysis)
    
    if advanced_steps:
        steps = advanced_steps
        logger.info(f"Using advanced AI solution with {len(steps)} steps")
    else:
        # Fallback to basic remediation steps
        logger.info("Falling back to basic remediation steps")
        steps = get_remediation_steps(user_id=user_id, question_text=question)
        
        # Try basic AI enrichment as additional fallback
        try:
            from .ai_providers import get_ai_response
            enriched_raw = get_ai_response(f"Provide step JSON only for: {question}")
            if enriched_raw:
                import json
                try:
                    parsed = json.loads(enriched_raw)
                    if isinstance(parsed, dict) and isinstance(parsed.get('steps'), list) and parsed['steps']:
                        steps = parsed['steps']
                        logger.info("Enhanced with basic AI steps")
                except Exception as e:
                    logger.warning(f"Basic AI enhancement failed: {e}")
        except Exception as e:
            logger.warning(f"AI enrichment failed: {e}")

    # Build comprehensive response with metadata
    answer_lines = []
    for idx, step in enumerate(steps):
        step_title = step.get('title', f'Step {idx+1}')
        step_detail = step.get('detail', '')
        step_calc = step.get('calculation', '')
        step_code = step.get('code_snippet', '')
        
        line = f"{idx+1}. {step_title}: {step_detail}"
        if step_calc:
            line += f"\n   Calculation: {step_calc}"
        if step_code:
            line += f"\n   Code: {step_code}"
            
        answer_lines.append(line)
    
    answer = "\n\n".join(answer_lines)
    
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
