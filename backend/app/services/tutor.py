import io
from typing import Dict, Optional
from PIL import Image
import pytesseract
from ..supabase_client import get_supabase
from ..services.weaktopics import get_remediation_steps


def _ocr_image(image_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(image_bytes))
    return pytesseract.image_to_string(img)


def solve_question(question: Optional[str], image_bytes: Optional[bytes], user_id: str) -> Dict:
    if not question and not image_bytes:
        return {"error": "No input"}
    if not question and image_bytes:
        question = _ocr_image(image_bytes)
    # Generate structured remediation steps
    steps = get_remediation_steps(user_id=user_id, question_text=question or "")
    return {"question": question, "steps": steps}
