import io
from typing import Dict, Optional, List
from PIL import Image
import pytesseract
from ..services.weaktopics import get_remediation_steps
from .tutor_storage import save_message, fetch_history
from ..utils import is_valid_uuid
from ..errors import ApiError


def _ocr_image(image_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(image_bytes))
    return pytesseract.image_to_string(img)


def solve_question(
    question: Optional[str], image_bytes: Optional[bytes], user_id: str, include_history: bool = True
) -> Dict:
    if not question and not image_bytes:
        raise ApiError("TUTOR_TIMEOUT", "No input provided to tutor", status=400)
    if not question and image_bytes:
        question = _ocr_image(image_bytes)
    # Generate structured remediation steps (primary path)
    steps = get_remediation_steps(user_id=user_id, question_text=question or "")
    # Attempt AI enrichment via ai_providers (optional) and merge if JSON parsable
    try:
        from .ai_providers import get_ai_response
        enriched_raw = get_ai_response(f"Provide step JSON only for: {question}") if question else None
        if enriched_raw:
            import json
            try:
                parsed = json.loads(enriched_raw)
                if isinstance(parsed, dict) and isinstance(parsed.get('steps'), list) and parsed['steps']:
                    # Prefer AI steps if they look valid
                    steps = parsed['steps']
            except Exception:
                pass
    except Exception:
        pass

    # Build a human-readable answer string
    answer_lines = [f"{idx+1}. {s.get('title')}: {s.get('detail')}" for idx, s in enumerate(steps)]
    answer = "\n".join(answer_lines)
    if is_valid_uuid(user_id):
        try:
            save_message(user_id, 'user', question or '(image question)')
            save_message(user_id, 'ai', answer, steps=steps)
        except Exception:
            pass
    history: List[Dict] = []
    if include_history and is_valid_uuid(user_id):
        history = fetch_history(user_id)
    return {"question": question, "steps": steps, "answer": answer, "history": history}
