"""
AI Mock Provider for testing and development without external API keys.
Provides deterministic responses for all AI operations.
"""
import os
import hashlib
import json
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta


class AIMockProvider:
    """Mock AI provider that returns deterministic responses based on input."""
    
    def __init__(self):
        self.mock_embeddings = self._generate_mock_embeddings()
        self.mock_responses = {
            "syllabus_analysis": {
                "topics": [
                    {"topic": "Algebra Fundamentals", "score": 8},
                    {"topic": "Linear Equations", "score": 7},
                    {"topic": "Quadratic Functions", "score": 6},
                    {"topic": "Polynomial Operations", "score": 5},
                    {"topic": "Rational Expressions", "score": 4},
                ],
                "difficulty": "intermediate",
                "estimated_hours": 45,
            },
            "assessment_analysis": {
                "weak_areas": [
                    {"topic": "Complex Numbers", "score": 2},
                    {"topic": "Trigonometry", "score": 3},
                    {"topic": "Calculus Basics", "score": 4},
                ],
                "strengths": [
                    {"topic": "Basic Algebra", "score": 8},
                    {"topic": "Linear Equations", "score": 7},
                ],
                "overall_score": 65,
            },
            "tutor_response": {
                "steps": [
                    {
                        "title": "Understand the Problem",
                        "detail": "First, let's break down what this question is asking. We need to solve a quadratic equation.",
                    },
                    {
                        "title": "Recall the Formula",
                        "detail": "For quadratic equations in the form ax² + bx + c = 0, we use the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a",
                    },
                    {
                        "title": "Apply the Formula",
                        "detail": "Let's substitute our values: a = 1, b = -5, c = 6. So x = (5 ± √(25 - 24)) / 2 = (5 ± 1) / 2",
                    },
                    {
                        "title": "Calculate the Solutions",
                        "detail": "This gives us x = 3 and x = 2. Let's verify by plugging these back into the original equation.",
                    },
                ],
                "explanation": "The solutions to x² - 5x + 6 = 0 are x = 2 and x = 3. You can verify this by substituting these values back into the equation.",
            },
        }
    
    def _generate_mock_embeddings(self) -> List[List[float]]:
        """Generate deterministic mock embeddings."""
        # Create a simple deterministic embedding based on a seed
        seed = "mock_embedding_seed"
        hash_obj = hashlib.md5(seed.encode())
        base_values = [float(x) / 255.0 for x in hash_obj.digest()]
        
        # Extend to 768 dimensions (standard embedding size)
        embeddings = []
        for i in range(10):  # Generate 10 different embeddings
            # Create variation based on index
            variation = [x + (i * 0.1) for x in base_values]
            # Extend to 768 dimensions by repeating and scaling
            full_embedding = []
            for j in range(768):
                full_embedding.append(variation[j % len(variation)] * 0.1)
            embeddings.append(full_embedding)
        
        return embeddings
    
    def get_embedding(self, text: str, model: Optional[str] = None) -> List[float]:
        """Get a deterministic embedding for the given text."""
        # Use text hash to select embedding
        text_hash = hashlib.md5(text.encode()).hexdigest()
        index = int(text_hash[:2], 16) % len(self.mock_embeddings)
        return self.mock_embeddings[index]
    
    def get_embeddings(self, texts: List[str], model: Optional[str] = None) -> List[List[float]]:
        """Get deterministic embeddings for multiple texts."""
        return [self.get_embedding(text, model) for text in texts]
    
    def analyze_syllabus(self, text: str) -> Dict[str, Any]:
        """Analyze syllabus text and return structured topics."""
        # Add some variation based on text content
        text_hash = hashlib.md5(text.encode()).hexdigest()
        variation = int(text_hash[:4], 16) % 100
        
        response = self.mock_responses["syllabus_analysis"].copy()
        
        # Add some variation to make it feel more realistic
        for topic in response["topics"]:
            topic["score"] = max(1, min(10, topic["score"] + (variation % 3) - 1))
        
        response["estimated_hours"] = max(20, response["estimated_hours"] + (variation % 20) - 10)
        
        return response
    
    def analyze_assessment(self, text: str) -> Dict[str, Any]:
        """Analyze assessment text and return weak areas."""
        text_hash = hashlib.md5(text.encode()).hexdigest()
        variation = int(text_hash[:4], 16) % 100
        
        response = self.mock_responses["assessment_analysis"].copy()
        
        # Add variation to scores
        for area in response["weak_areas"]:
            area["score"] = max(1, min(10, area["score"] + (variation % 3) - 1))
        
        for strength in response["strengths"]:
            strength["score"] = max(1, min(10, strength["score"] + (variation % 3) - 1))
        
        response["overall_score"] = max(0, min(100, response["overall_score"] + (variation % 20) - 10))
        
        return response
    
    def get_tutor_response(self, question: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Get a structured tutor response for a question."""
        question_lower = question.lower()
        
        # Topic-specific educational responses
        topic_responses = {
            "bernoulli": {
                "steps": [
                    {
                        "title": "Understanding Bernoulli's Principle",
                        "detail": "Bernoulli's principle states that for an inviscid flow of a non-conducting fluid, an increase in the speed of the fluid occurs simultaneously with a decrease in pressure or a decrease in the fluid's potential energy."
                    },
                    {
                        "title": "The Bernoulli Equation",
                        "detail": "The equation is: P + ½ρv² + ρgh = constant, where P is pressure, ρ is fluid density, v is velocity, g is gravitational acceleration, and h is height."
                    },
                    {
                        "title": "Real-World Applications",
                        "detail": "Bernoulli's principle explains how airplane wings generate lift, why shower curtains get sucked inward, and how carburetors and atomizers work."
                    },
                    {
                        "title": "Key Insight",
                        "detail": "The principle is a manifestation of conservation of energy for flowing fluids. Faster moving fluid has more kinetic energy, so it must have less pressure energy to maintain the total energy constant."
                    }
                ],
                "explanation": "Bernoulli's principle describes the relationship between fluid speed and pressure - as fluid speed increases, pressure decreases. This fundamental concept in fluid dynamics explains phenomena from airplane flight to blood flow."
            },
            "derivative": {
                "steps": [
                    {"title": "Definition of Derivative", "detail": "The derivative measures the rate of change of a function. It's defined as the limit: f'(x) = lim(h→0) [f(x+h) - f(x)]/h"},
                    {"title": "Basic Rules", "detail": "Power rule: d/dx[xⁿ] = nxⁿ⁻¹. Sum rule: d/dx[f+g] = f'+g'. Product rule: d/dx[fg] = f'g + fg'"},
                    {"title": "Geometric Interpretation", "detail": "The derivative at a point equals the slope of the tangent line to the curve at that point."},
                    {"title": "Applications", "detail": "Derivatives are used to find rates of change, optimize functions, and model real-world phenomena like velocity and acceleration."}
                ],
                "explanation": "The derivative is a fundamental concept in calculus that measures instantaneous rate of change."
            },
            "integral": {
                "steps": [
                    {"title": "Definition of Integral", "detail": "Integration is the reverse of differentiation. The definite integral ∫[a,b] f(x)dx represents the signed area under the curve f(x) from a to b."},
                    {"title": "Fundamental Theorem of Calculus", "detail": "If F is an antiderivative of f, then ∫[a,b] f(x)dx = F(b) - F(a). This connects derivatives and integrals."},
                    {"title": "Basic Integration Rules", "detail": "∫xⁿdx = xⁿ⁺¹/(n+1) + C for n≠-1. ∫eˣdx = eˣ + C. ∫sin(x)dx = -cos(x) + C"},
                    {"title": "Applications", "detail": "Integrals calculate areas, volumes, work done by forces, and solve differential equations."}
                ],
                "explanation": "Integration is a fundamental operation in calculus used to find areas, accumulate quantities, and reverse differentiation."
            }
        }
        
        # Check for topic matches
        for topic, response in topic_responses.items():
            if topic in question_lower:
                return response.copy()
        
        # Default educational response
        return {
            "steps": [
                {
                    "title": "Understanding the Question",
                    "detail": f"Let's break down what you're asking: '{question}'. This requires careful analysis of the key concepts involved."
                },
                {
                    "title": "Key Concepts",
                    "detail": "To answer this question effectively, we need to identify and understand the fundamental principles and definitions related to the topic."
                },
                {
                    "title": "Step-by-Step Approach",
                    "detail": "Working through this systematically: First, establish the basics. Then, apply the relevant formulas or principles. Finally, verify the solution makes sense."
                },
                {
                    "title": "Summary",
                    "detail": "Review the key points and practice with similar problems to reinforce your understanding."
                }
            ],
            "explanation": "I've provided a structured approach to help you understand this topic. Focus on mastering each step before moving to the next."
        }
    
    def generate_study_plan(self, topics: List[Dict], horizon_days: int = 14) -> Dict[str, Any]:
        """Generate a study plan based on topics and time horizon."""
        plan = {
            "horizon_days": horizon_days,
            "sessions": [],
            "estimated_completion": (datetime.now() + timedelta(days=horizon_days)).isoformat(),
        }
        
        # Generate sessions based on topics
        for i, topic in enumerate(topics[:10]):  # Limit to 10 topics
            topic_name = topic.get("topic", f"Topic {i+1}")
            score = topic.get("score", 5)
            
            # More sessions for lower scores (weaker topics)
            num_sessions = max(1, 5 - score // 2)
            
            for j in range(num_sessions):
                session_day = (i + j) % horizon_days
                session_date = datetime.now() + timedelta(days=session_day)
                
                plan["sessions"].append({
                    "date": session_date.strftime("%Y-%m-%d"),
                    "topic": topic_name,
                    "focus": "practice + review" if j == 0 else "review + application",
                    "duration_min": 45 if j == 0 else 30,
                    "priority": "high" if score < 5 else "medium",
                })
        
        # Sort sessions by date
        plan["sessions"].sort(key=lambda x: x["date"])
        
        return plan


# Global mock provider instance
_mock_provider: Optional[AIMockProvider] = None


def get_mock_provider() -> AIMockProvider:
    """Get or create the global mock provider instance."""
    global _mock_provider
    if _mock_provider is None:
        _mock_provider = AIMockProvider()
    return _mock_provider


def is_mock_enabled() -> bool:
    """Check if AI mock mode is enabled."""
    return os.getenv("AI_MOCK", "false").lower() == "true"
