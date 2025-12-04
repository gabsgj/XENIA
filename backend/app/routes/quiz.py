import logging
from flask import Blueprint, request, jsonify
from ..errors import ApiError
from ..utils import normalize_user_id, is_valid_uuid
from ..services.quiz import generate_quiz, score_quiz
from ..services.progress import record_quiz_result

quiz_bp = Blueprint("quiz", __name__)

@quiz_bp.post("/generate")
def generate_quiz_api():
    data = request.get_json(silent=True) or {}
    raw_user_id = data.get("user_id") or request.headers.get("X-User-Id") or ""
    if not raw_user_id:
        raise ApiError("AUTH_401", "Missing user_id")
    user_id = normalize_user_id(raw_user_id)
    if not is_valid_uuid(user_id):
        raise ApiError("AUTH_403", "Invalid user_id")
    topics = data.get("topics", [])
    num_questions = int(data.get("num_questions", 10))
    options_count = int(data.get("options_count", 4))
    duration = int(data.get("duration", 10))  # in minutes
    # Accept user_profile and syllabus from frontend
    user_profile = data.get("user_profile", "")
    syllabus = data.get("syllabus", "")
    from ..services.topic_store import get_topics as store_get_topics
    if not topics:
        topics = store_get_topics(user_id)
    if not topics or num_questions < 1:
        raise ApiError("QUIZ_INVALID", "Must provide topics and number of questions")
    quiz = generate_quiz(topics, num_questions, options_count, user_profile=user_profile, syllabus=syllabus)
    quiz["duration"] = duration
    quiz["topics"] = topics
    quiz["user_id"] = user_id
    quiz["user_profile"] = user_profile
    quiz["syllabus"] = syllabus
    return jsonify({"success": True, "quiz": quiz})

@quiz_bp.post("/submit")
def submit_quiz_api():
    data = request.get_json(silent=True) or {}
    quiz = data.get("quiz")
    user_answers = data.get("user_answers", [])
    if not quiz or not user_answers:
        raise ApiError("QUIZ_SUBMIT_INVALID", "Missing quiz or answers")
    stats = score_quiz(quiz, user_answers)
    # Record progress for each topic from the quiz questions (not from topics list)
    user_id = quiz.get("user_id")
    if not user_id or not is_valid_uuid(user_id):
        raise ApiError("AUTH_403", "Invalid user_id in quiz data")
    topic_scores = []
    # Aggregate scores by topic from the feedback
    topic_score_map = {}
    for idx, fb in enumerate(stats.get("feedback", [])):
        # Get topic from the question itself if available
        question = quiz.get("questions", [])[idx] if idx < len(quiz.get("questions", [])) else {}
        topic = question.get("topic", "General")
        if topic not in topic_score_map:
            topic_score_map[topic] = {"correct": 0, "wrong": 0}
        if fb.get("is_correct"):
            topic_score_map[topic]["correct"] += 1
        else:
            topic_score_map[topic]["wrong"] += 1
    
    for topic, scores in topic_score_map.items():
        total = scores["correct"] + scores["wrong"]
        score = scores["correct"] / total if total > 0 else 0.0
        topic_scores.append({"topic": topic, "correct": scores["correct"], "wrong": scores["wrong"], "score": score})
    
    if user_id:
        record_quiz_result(user_id, topic_scores)
    return jsonify({"success": True, "stats": stats})
