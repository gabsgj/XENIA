import random
from typing import List, Dict, Any
from .ai_providers import get_ai_response
from .resources import SUBJECT_RESOURCES, TOPIC_SPECIFIC_RESOURCES
import json

# High-quality fallback questions for common topics
FALLBACK_QUESTIONS = {
    "Linear Algebra": [
        {
            "question": "What is the determinant of a 2×2 matrix [[a, b], [c, d]]?",
            "options": ["ad - bc", "ac + bd", "ab + cd", "a + b + c + d"],
            "correct_index": 0
        },
        {
            "question": "Which of the following represents the identity matrix in 2D?",
            "options": ["[[1, 0], [0, 1]]", "[[0, 1], [1, 0]]", "[[1, 1], [1, 1]]", "[[0, 0], [0, 0]]"],
            "correct_index": 0
        },
        {
            "question": "What is the rank of a matrix?",
            "options": ["The dimension of its column space", "The number of non-zero rows", "The determinant value", "The trace of the matrix"],
            "correct_index": 0
        }
    ],
    "Calculus": [
        {
            "question": "What is the derivative of sin(x)?",
            "options": ["cos(x)", "-sin(x)", "tan(x)", "sec(x)"],
            "correct_index": 0
        },
        {
            "question": "What does the fundamental theorem of calculus state?",
            "options": ["Integration and differentiation are inverse operations", "Limits always exist", "All functions are continuous", "Derivatives are always positive"],
            "correct_index": 0
        },
        {
            "question": "What is ∫x² dx?",
            "options": ["(1/3)x³ + C", "x³ + C", "(1/2)x² + C", "2x + C"],
            "correct_index": 0
        }
    ],
    "Machine Learning": [
        {
            "question": "What type of learning algorithm is linear regression?",
            "options": ["Supervised learning", "Unsupervised learning", "Reinforcement learning", "Semi-supervised learning"],
            "correct_index": 0
        },
        {
            "question": "What does overfitting in machine learning mean?",
            "options": ["Model performs well on training data but poorly on new data", "Model performs poorly on training data", "Model has perfect accuracy", "Model takes too long to train"],
            "correct_index": 0
        },
        {
            "question": "Which algorithm is commonly used for classification problems?",
            "options": ["Logistic Regression", "Linear Regression", "K-means", "Principal Component Analysis"],
            "correct_index": 0
        }
    ],
    "Physics": [
        {
            "question": "What is Newton's second law of motion?",
            "options": ["F = ma", "E = mc²", "F = -kx", "P = mv"],
            "correct_index": 0
        },
        {
            "question": "What is the SI unit of energy?",
            "options": ["Joule", "Newton", "Watt", "Pascal"],
            "correct_index": 0
        },
        {
            "question": "What is the speed of light in vacuum?",
            "options": ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"],
            "correct_index": 0
        }
    ],
    "Chemistry": [
        {
            "question": "What is the atomic number of carbon?",
            "options": ["6", "12", "14", "16"],
            "correct_index": 0
        },
        {
            "question": "What type of bond is formed between sodium and chlorine?",
            "options": ["Ionic bond", "Covalent bond", "Hydrogen bond", "Metallic bond"],
            "correct_index": 0
        },
        {
            "question": "What is the pH of pure water at 25°C?",
            "options": ["7", "0", "14", "1"],
            "correct_index": 0
        }
    ],
    "Biology": [
        {
            "question": "What is the powerhouse of the cell?",
            "options": ["Mitochondria", "Nucleus", "Ribosome", "Endoplasmic reticulum"],
            "correct_index": 0
        },
        {
            "question": "What is the process by which plants make their own food?",
            "options": ["Photosynthesis", "Respiration", "Transpiration", "Osmosis"],
            "correct_index": 0
        },
        {
            "question": "What carries genetic information in cells?",
            "options": ["DNA", "RNA", "Proteins", "Carbohydrates"],
            "correct_index": 0
        }
    ]
}

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
You are an AI quiz generator.  
Your job is to create high-quality multiple-choice questions (MCQs) from study topics.  

⚠️ Rules:
- Each question must be clear and grammatically correct.  
- Provide exactly 4 options (A, B, C, D).  
- Only one option should be correct.  
- Do NOT include placeholders like "Correct concept" or "Wrong option".  
- Do NOT repeat the question inside the options.  
- Make the options concise but meaningful.  
- If the topic is vague, reframe it into a useful question.  

🎯 Output format:
Q: <question text>  
A. <option 1>  
B. <option 2>  
C. <option 3>  
D. <option 4>  
Answer: <correct option letter>  

Generate a high-quality MCQ for the topic: '{topic}'
{("User profile: " + str(user_profile)) if user_profile else ""}
{("Syllabus context: " + syllabus) if syllabus else ""}
"""
        try:
            response = get_ai_response(prompt)
            clean_response = response.strip()
            
            # Parse the new format
            lines = clean_response.split('\n')
            question = ""
            options = []
            correct_letter = ""
            
            for line in lines:
                line = line.strip()
                if line.startswith('Q:'):
                    question = line[2:].strip()
                elif line.startswith('A.') or line.startswith('B.') or line.startswith('C.') or line.startswith('D.'):
                    option_text = line[2:].strip()
                    options.append(option_text)
                elif line.startswith('Answer:'):
                    correct_letter = line[7:].strip().upper()
            
            # Convert letter to index
            letter_to_index = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
            correct_index = letter_to_index.get(correct_letter, 0)
            
            # Validate we got all required parts
            if question and len(options) == 4 and correct_letter in letter_to_index:
                questions.append({
                    "question": question,
                    "options": options,
                    "correct_index": correct_index,
                    "topic": topic
                })
            else:
                raise ValueError("Invalid AI response format")
                
        except Exception as e:
            # Use high-quality fallback questions
            topic_questions = FALLBACK_QUESTIONS.get(topic, [])
            if topic_questions:
                fallback_question = random.choice(topic_questions)
                questions.append({
                    "question": fallback_question["question"],
                    "options": fallback_question["options"],
                    "correct_index": fallback_question["correct_index"],
                    "topic": topic
                })
            else:
                # Generic fallback for unknown topics
                questions.append({
                    "question": f"What is a fundamental concept in {topic}?",
                    "options": [
                        f"The core principles of {topic}",
                        f"Advanced applications of {topic}",
                        f"Historical development of {topic}",
                        f"Current research in {topic}"
                    ],
                    "correct_index": 0,
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
