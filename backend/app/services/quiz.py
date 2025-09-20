import random
from typing import List, Dict, Any
from .ai_providers import get_ai_response
from .resources import SUBJECT_RESOURCES, TOPIC_SPECIFIC_RESOURCES
import json

def generate_quiz(topics: List[str], num_questions: int, options_count: int = 4, user_profile: Dict[str, Any] = None, syllabus: str = None) -> Dict[str, Any]:
    """
    Generate a quiz with AI-powered questions, personalized by user_profile and syllabus.
    Each question has 4 or 5 options, one correct answer.
    """
    if user_profile is None:
        user_profile = {}
    if syllabus is None:
        syllabus = ""
    questions = []
    for i in range(num_questions):
        topic = random.choice(topics)
        # Use AI to generate a question for the topic
        prompt = f"""
You are an expert quiz generator. Create a multiple-choice question for the topic: '{topic}'.
User profile: {user_profile}. 
Syllabus: {syllabus}.
Requirements:
- 1 question
- {options_count} options
- Only one correct answer
- Make it relevant to the topic and syllabus context
- Return valid JSON in this format:
{{
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "correct_index": 2
}}
"""
        try:
            response = get_ai_response(prompt)
            clean_response = response.strip()
            if clean_response.startswith('```json'):
                clean_response = clean_response[7:]
            if clean_response.endswith('```'):
                clean_response = clean_response[:-3]
            qdata = json.loads(clean_response)
            questions.append({
                "question": qdata["question"],
                "options": qdata["options"],
                "correct_index": qdata["correct_index"],
                "topic": topic
            })
        except Exception as e:
            # Fallback to mock if AI fails
            correct_answer = f"Correct concept for {topic}"
            wrong_answers = [f"Wrong option {j} for {topic}" for j in range(options_count - 1)]
            options = wrong_answers + [correct_answer]
            random.shuffle(options)
            correct_index = options.index(correct_answer)
            questions.append({
                "question": f"What is a key concept in {topic}?",
                "options": options,
                "correct_index": correct_index,
                "topic": topic
            })
    return {
        "quiz_id": random.randint(100000, 999999),
        "questions": questions
    }

def score_quiz(quiz: Dict[str, Any], user_answers: List[int]) -> Dict[str, Any]:
    """
    Score the quiz and return stats and per-question feedback.
    """
    questions = quiz["questions"]
    correct = 0
    wrong = 0
    feedback = []
    for i, q in enumerate(questions):
        user_ans = user_answers[i] if i < len(user_answers) else None
        is_correct = user_ans == q["correct_index"]
        if is_correct:
            correct += 1
        else:
            wrong += 1
        feedback.append({
            "question": q["question"],
            "options": q["options"],
            "correct_index": q["correct_index"],
            "user_answer": user_ans,
            "is_correct": is_correct
        })
    return {
        "total_questions": len(questions),
        "correct": correct,
        "wrong": wrong,
        "feedback": feedback
    }
