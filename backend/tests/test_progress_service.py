import datetime
from app.services.progress import record_quiz_result, get_user_progress
from app.supabase_client import get_supabase


def test_record_and_get_progress():
    user_id = "test-user-1"
    sb = get_supabase()
    # clear any existing mock rows for this user
    if hasattr(sb, 'mock_data'):
        sb.mock_data.setdefault('user_progress', [])[:] = [r for r in sb.mock_data.get('user_progress', []) if r.get('user_id') != user_id]
        sb.mock_data.setdefault('user_progress_history', [])[:] = [r for r in sb.mock_data.get('user_progress_history', []) if r.get('user_id') != user_id]

    topic_scores = [
        {"topic": "Algebra", "correct": 1, "wrong": 0, "score": 1.0},
        {"topic": "Calculus", "correct": 0, "wrong": 1, "score": 0.0},
    ]
    record_quiz_result(user_id, topic_scores)
    progress = get_user_progress(user_id)
    assert "Algebra" in progress
    assert progress["Algebra"]["quizzes_taken"] == 1
    assert progress["Algebra"]["correct"] == 1
    assert progress["Algebra"]["wrong"] == 0
    assert progress["Algebra"]["last_score"] == 1.0
    assert "Calculus" in progress
    assert progress["Calculus"]["quizzes_taken"] == 1
    assert progress["Calculus"]["correct"] == 0
    assert progress["Calculus"]["wrong"] == 1
    assert progress["Calculus"]["last_score"] == 0.0
