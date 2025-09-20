import requests
import json
import random
import uuid
from app import create_app


def test_quiz_endpoints_via_test_client():
    """Use Flask test client so tests don't need a running server."""
    app = create_app()
    client = app.test_client()

    user_id = str(uuid.uuid4())  # Generate a proper UUID instead of demo-user-123
    topics = ["linear algebra", "machine learning", "calculus"]
    num_questions = 5
    options_count = 4
    duration = 10

    gen_resp = client.post(
        "/api/quiz/generate",
        data=json.dumps({
            "user_id": user_id,
            "topics": topics,
            "num_questions": num_questions,
            "options_count": options_count,
            "duration": duration,
        }),
        content_type="application/json",
    )
    assert gen_resp.status_code == 200
    gen_json = gen_resp.get_json()
    assert gen_json.get("success") is True
    quiz = gen_json.get("quiz")
    assert quiz and "questions" in quiz

    # Simulate user answers (random)
    user_answers = [random.randint(0, options_count - 1) for _ in range(num_questions)]

    sub_resp = client.post(
        "/api/quiz/submit",
        data=json.dumps({"quiz": quiz, "user_answers": user_answers}),
        content_type="application/json",
    )
    assert sub_resp.status_code == 200
    sub_json = sub_resp.get_json()
    assert sub_json.get("success") is True
    assert "stats" in sub_json
