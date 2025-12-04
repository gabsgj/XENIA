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
    
    # Distribute questions across topics more evenly
    topics_cycle = topics * ((num_questions // len(topics)) + 1) if topics else ["General Knowledge"]
    
    for i in range(num_questions):
        topic = topics_cycle[i % len(topics_cycle)] if topics else "General Knowledge"
        
        # Use AI to generate a specific, educational question for the topic
        prompt = f"""Generate ONE multiple-choice question about: "{topic}"

Requirements:
- Ask about a SPECIFIC fact, concept, definition, or process related to this topic
- The question should test actual knowledge, not just recognition
- All 4 options must be plausible but only ONE is correct
- Options should be specific terms, values, or concepts - NOT generic phrases

Format your response EXACTLY like this:
Q: [Your specific question here]
A. [First option]
B. [Second option]
C. [Third option]
D. [Fourth option]
Answer: [A, B, C, or D]

Example for "JDBC":
Q: Which interface in JDBC is used to execute parameterized SQL queries?
A. Statement
B. PreparedStatement
C. CallableStatement
D. ResultSet
Answer: B

Now generate a question for: "{topic}"
"""
        try:
            response = get_ai_response(prompt)
            if not response:
                raise ValueError("Empty AI response")
            clean_response = response.strip()
            
            # Parse the new format
            lines = clean_response.split('\n')
            question = ""
            options = []
            correct_letter = ""
            
            for line in lines:
                line = line.strip()
                # Handle Q: format
                if line.startswith('Q:') or line.startswith('Q.'):
                    question = line[2:].strip()
                # Handle **Q:** markdown format
                elif line.startswith('**Q') and ':' in line:
                    question = line.split(':', 1)[1].replace('**', '').strip()
                # Handle Question: format
                elif line.lower().startswith('question:'):
                    question = line[9:].strip()
                # Handle options with various formats: A., A), (A), a., etc.
                elif len(line) >= 2 and line[0].upper() in 'ABCD':
                    if line[1] in '.):' or (len(line) > 2 and line[1] == ')' or line[1:3] == '. '):
                        # Extract option text after the letter and delimiter
                        option_text = line[2:].strip() if line[1] in '.)' else line[3:].strip()
                        if option_text:
                            options.append(option_text)
                # Handle Answer: format with various formats
                elif 'answer' in line.lower() and ':' in line:
                    answer_part = line.split(':', 1)[1].strip().upper()
                    # Extract the letter from various formats: "A", "A.", "Option A", etc.
                    for char in answer_part:
                        if char in 'ABCD':
                            correct_letter = char
                            break
                # Handle "Correct: A" or similar
                elif 'correct' in line.lower() and ':' in line:
                    answer_part = line.split(':', 1)[1].strip().upper()
                    for char in answer_part:
                        if char in 'ABCD':
                            correct_letter = char
                            break
            
            # Convert letter to index
            letter_to_index = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
            correct_index = letter_to_index.get(correct_letter, 0)
            
            # Validate we got all required parts
            if question and len(options) >= 4 and correct_letter in letter_to_index:
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
                # Generate more specific fallback based on topic keywords
                # This creates better questions than generic "what is fundamental"
                fallback = _generate_smart_fallback(topic, i)
                questions.append({
                    "question": fallback["question"],
                    "options": fallback["options"],
                    "correct_index": fallback["correct_index"],
                    "topic": topic
                })
    return {
        "quiz_id": random.randint(100000, 999999),
        "questions": questions
    }


def _generate_smart_fallback(topic: str, question_index: int) -> Dict[str, Any]:
    """Generate a more specific fallback question based on topic keywords."""
    topic_lower = topic.lower()
    
    # Java/Programming related
    if any(kw in topic_lower for kw in ['jdbc', 'database', 'sql', 'connection']):
        questions = [
            {"question": f"In {topic}, what is the primary purpose of a Connection object?",
             "options": ["To establish a link to the database", "To execute SQL queries", "To store query results", "To manage transactions only"],
             "correct_index": 0},
            {"question": f"Which method is used to execute a SELECT query in JDBC?",
             "options": ["executeQuery()", "executeUpdate()", "execute()", "runQuery()"],
             "correct_index": 0},
            {"question": f"What does JDBC stand for?",
             "options": ["Java Database Connectivity", "Java Data Base Connection", "Java Database Controller", "Java Data Binding Component"],
             "correct_index": 0},
        ]
        return random.choice(questions)
    
    if any(kw in topic_lower for kw in ['swing', 'awt', 'gui', 'component', 'container']):
        questions = [
            {"question": f"What is the main difference between AWT and Swing?",
             "options": ["Swing is lightweight, AWT uses native components", "AWT is newer than Swing", "Swing is faster than AWT", "AWT supports more components"],
             "correct_index": 0},
            {"question": f"Which class is the top-level container in Swing?",
             "options": ["JFrame", "JPanel", "JComponent", "JContainer"],
             "correct_index": 0},
            {"question": f"What design pattern does Swing's architecture follow?",
             "options": ["Model-View-Controller (MVC)", "Singleton", "Factory", "Observer only"],
             "correct_index": 0},
        ]
        return random.choice(questions)
    
    if any(kw in topic_lower for kw in ['java', 'class', 'object', 'method', 'interface']):
        questions = [
            {"question": f"What keyword is used to inherit from a class in Java?",
             "options": ["extends", "implements", "inherits", "super"],
             "correct_index": 0},
            {"question": f"Which access modifier makes a member accessible only within the same class?",
             "options": ["private", "protected", "public", "default"],
             "correct_index": 0},
            {"question": f"What is the purpose of the 'final' keyword in Java?",
             "options": ["To prevent modification/inheritance", "To make code run faster", "To declare constants only", "To end a program"],
             "correct_index": 0},
        ]
        return random.choice(questions)
    
    if any(kw in topic_lower for kw in ['exception', 'error', 'try', 'catch', 'throw']):
        questions = [
            {"question": f"Which block is always executed regardless of exceptions?",
             "options": ["finally", "catch", "try", "throw"],
             "correct_index": 0},
            {"question": f"What is the difference between checked and unchecked exceptions?",
             "options": ["Checked must be handled at compile time", "Unchecked are more severe", "Checked are runtime only", "There is no difference"],
             "correct_index": 0},
        ]
        return random.choice(questions)
    
    if any(kw in topic_lower for kw in ['thread', 'concurrent', 'synchron', 'parallel']):
        questions = [
            {"question": f"What keyword is used to prevent race conditions in Java?",
             "options": ["synchronized", "volatile", "atomic", "locked"],
             "correct_index": 0},
            {"question": f"Which method is used to start a thread in Java?",
             "options": ["start()", "run()", "execute()", "begin()"],
             "correct_index": 0},
        ]
        return random.choice(questions)
    
    # Generic but better fallback - ask about purpose/definition
    question_templates = [
        {"question": f"What is the primary purpose of {topic}?",
         "options": [f"To provide specific functionality for {topic.split()[0] if topic.split() else 'the system'}", 
                    "To handle unrelated system operations",
                    "To replace existing functionality entirely",
                    "To serve as a debugging tool only"],
         "correct_index": 0},
        {"question": f"Which statement best describes {topic}?",
         "options": [f"A component/concept that handles {topic.split()[-1] if topic.split() else 'specific'} operations",
                    "An obsolete feature no longer in use",
                    "A testing framework only",
                    "A user interface element"],
         "correct_index": 0},
    ]
    return question_templates[question_index % len(question_templates)]

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
