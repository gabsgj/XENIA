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
from ..supabase_client import get_supabase
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
            
            supabase = get_supabase()
            
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
    def generate_advanced_solution(question: str, question_analysis: Dict, syllabus_context: Optional[Dict] = None) -> Dict:
        """Generate advanced solution using AI with question-type awareness.

        This implementation is intentionally compact and robust: it asks the AI
        to return a single JSON object containing a top-level `steps` array,
        sanitizes the response, and returns the parsed steps list or an empty
        list on parse/format errors so callers can apply fallbacks.
        """
        from .ai_providers import get_ai_response

        question_type = question_analysis.get("type", "general")

        preferred_provider = None
        if question_type == "mathematics":
            preferred_provider = "gemini"
        elif question_type == "programming":
            preferred_provider = "openai"

        context_note = "Please tailor answers to the student's syllabus when available." if syllabus_context and syllabus_context.get("context") == "personalized" else ""

        prompt = (
            f"You are an expert tutor. Return ONLY a single JSON object with a top-level steps array. "
            f"Each step should be an object with title and detail.\nQUESTION: {question}\n{context_note}"
        )

        try:
            if preferred_provider:
                response = get_ai_response(prompt, preferred_provider=preferred_provider)
            else:
                response = get_ai_response(prompt)

            clean_response = (response or "").strip()
            # strip common fences and codeblocks
            if clean_response.startswith('```json'):
                clean_response = clean_response[len('```json'):].strip()
            if clean_response.startswith('```') and clean_response.endswith('```'):
                clean_response = clean_response[3:-3].strip()

            # find JSON object
            m = re.search(r"\{.*\}", clean_response, re.DOTALL)
            if not m:
                logger.warning("Advanced AI: no JSON object found in response")
                return []

            json_text = m.group(0)
            # sanitize control characters
            sanitized = ''.join(ch for ch in json_text if ord(ch) >= 32 or ch in '\n\r\t')

            import json
            try:
                parsed = json.loads(sanitized)
            except Exception:
                # last-resort sanitization
                alt = sanitized.replace('```', '').replace('\x0c', '')
                alt = ''.join(ch for ch in alt if ord(ch) >= 32 or ch in '\n\r\t')
                try:
                    parsed = json.loads(alt)
                except Exception as e:
                    logger.warning(f"Advanced AI: failed to parse JSON: {e}")
                    return []

            if isinstance(parsed, dict) and isinstance(parsed.get('steps'), list):
                logger.info(f"✅ Generated {len(parsed['steps'])} solution steps (advanced)")
                # capture optional long-form answer/explanation if present in AI JSON
                answer_text = ''
                if isinstance(parsed.get('answer'), str) and parsed.get('answer').strip():
                    answer_text = parsed.get('answer').strip()
                elif isinstance(parsed.get('explanation'), str) and parsed.get('explanation').strip():
                    answer_text = parsed.get('explanation').strip()
                # return a structured dict so callers can access both steps and any full answer text
                return {
                    'steps': parsed['steps'],
                    'answer': answer_text,
                    'raw': clean_response
                }
            else:
                logger.warning("Advanced AI: parsed JSON missing 'steps' list")
                return {'steps': [], 'answer': '', 'raw': clean_response}

        except TimeoutError as e:
            logger.error(f"AI request timeout: {e}")
            raise ApiError("TUTOR_TIMEOUT", "The AI request timed out. Please try again.", status=408)
        except Exception as e:
            logger.warning(f"Advanced solution generation encountered an error but will fallback: {e}")
            return {'steps': [], 'answer': '', 'raw': ''}

def solve_question(
    question: Optional[str], image_bytes: Optional[bytes], user_id: str, include_history: bool = True, file_type: Optional[str] = None
) -> Dict:
    """Enhanced question solving with advanced AI tutoring capabilities."""
    
    try:
        if not question and not image_bytes:
            raise ApiError("TUTOR_INVALID_INPUT", "No input provided to tutor", status=400)
        
        # Extract text from file/image if provided
        if not question and image_bytes:
            # Handle supported image types via OCR, and text files via decode.
            ft = (file_type or '').lower()
            if ft in ('png','jpg','jpeg'):
                question = EnhancedTutor.extract_text_from_image(image_bytes)
                logger.info(f"Extracted question from image: {question[:100]}...")
            elif ft == 'txt':
                try:
                    question = image_bytes.decode('utf-8', errors='ignore')
                    logger.info(f"Extracted question from text file: {len(question)} chars")
                except Exception as e:
                    logger.warning(f"Failed to decode text file: {e}")
                    question = ''
            elif ft in ('pdf','doc','docx'):
                # Currently not supported for server-side parsing without extra deps. Return a friendly message.
                raise ApiError("TUTOR_INVALID_INPUT", "Unsupported file type for OCR. Please upload a PNG/JPG image or paste your question text.", status=400)
            else:
                # Unknown type, attempt OCR as a best-effort; if fails, proceed to validation below.
                question = EnhancedTutor.extract_text_from_image(image_bytes)
        
        if not question or len(question.strip()) < 3:
            raise ApiError("TUTOR_INVALID_INPUT", "Question is too short or unclear", status=400)
        
        # Load user's syllabus context for personalized responses
        syllabus_context = EnhancedTutor._load_user_syllabus_context(user_id)
        logger.info(f"Syllabus context: {syllabus_context.get('subject_area', 'General')} - {syllabus_context.get('context', 'basic')}")
        
        # Analyze question type for targeted tutoring
        question_analysis = EnhancedTutor.analyze_question_type(question)
        logger.info(f"Question analysis: {question_analysis}")
        
        # Try advanced AI-powered solution first with syllabus context
        advanced_steps = []
        advanced_answer_text = ''
        advanced_raw = ''
        try:
            advanced_result = EnhancedTutor.generate_advanced_solution(question, question_analysis, syllabus_context)
            # support legacy/list return for safety, but prefer structured dict
            if isinstance(advanced_result, dict):
                advanced_steps = advanced_result.get('steps', []) or []
                advanced_answer_text = advanced_result.get('answer', '') or ''
                advanced_raw = advanced_result.get('raw', '') or ''
            elif isinstance(advanced_result, list):
                advanced_steps = advanced_result
            else:
                advanced_steps = []
        except ApiError:
            # propagate API errors (timeouts, provider failures) up to caller so they can map to proper responses
            raise
        except Exception as e:
            logger.warning(f"generate_advanced_solution raised an exception, falling back: {e}")

        # If advanced AI produced usable steps, use them; otherwise fall back to remediation steps
        if advanced_steps:
            steps = advanced_steps
            logger.info(f"Using advanced AI solution with {len(steps)} steps")
            # Prefer a verbatim full answer/explanation from the AI when available
            if advanced_answer_text:
                answer = advanced_answer_text
            elif advanced_raw:
                # as a last resort, return the raw AI response (cleaned) so the frontend can render it
                answer = advanced_raw
            else:
                answer = "Here are the steps to solve the problem."
        else:
            logger.info("Falling back to basic remediation steps from weak-topics module")
            try:
                steps = get_remediation_steps(user_id=user_id, question_text=question)
            except Exception as e:
                logger.warning(f"get_remediation_steps failed: {e}")
                steps = []

        # Try basic AI enrichment as an additional fallback: request a simple JSON-only steps response
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
                    logger.warning(f"Basic AI enhancement failed to parse JSON: {e}")
        except Exception as e:
            logger.warning(f"AI enrichment failed: {e}")

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

        # If we have steps, renumber and build a suitable 'answer' text if needed
        if steps:
            try:
                steps = _renumber_steps(steps, add_numbers=True)  # Set to False to remove numbering
            except Exception as e:
                logger.warning(f"Failed to renumber steps: {e}")

            # If answer hasn't been provided by the advanced AI, build one from steps
            if not answer or answer == "Here are the steps to solve the problem.":
                if advanced_answer_text:
                    answer = advanced_answer_text
                else:
                    # Build a readable answer by concatenating step titles and details
                    try:
                        built = []
                        for s in steps:
                            t = s.get('title','')
                            d = s.get('detail','') or ''
                            built.append(f"{t}\n\n{d}".strip())
                        answer = "\n\n".join(built)
                    except Exception:
                        answer = "Here are the steps to solve the problem."
        else:
            # No steps found
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
