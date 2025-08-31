import pytest
import os
from app.services.ai_mock import AIMockProvider, get_mock_provider, is_mock_enabled


class TestAIMockProvider:
    def test_mock_provider_creation(self):
        provider = AIMockProvider()
        assert provider is not None
        assert len(provider.mock_embeddings) > 0

    def test_embedding_generation(self):
        provider = AIMockProvider()
        text = "test text"
        embedding = provider.get_embedding(text)
        assert len(embedding) == 768
        assert all(isinstance(x, float) for x in embedding)

    def test_multiple_embeddings(self):
        provider = AIMockProvider()
        texts = ["text1", "text2", "text3"]
        embeddings = provider.get_embeddings(texts)
        assert len(embeddings) == 3
        assert all(len(emb) == 768 for emb in embeddings)

    def test_tutor_response(self):
        provider = AIMockProvider()
        question = "solve x^2 + 5x + 6 = 0"
        response = provider.get_tutor_response(question)
        assert "steps" in response
        assert "explanation" in response
        assert len(response["steps"]) > 0

    def test_syllabus_analysis(self):
        provider = AIMockProvider()
        text = "This is a math syllabus covering algebra and calculus"
        analysis = provider.analyze_syllabus(text)
        assert "topics" in analysis
        assert "difficulty" in analysis
        assert "estimated_hours" in analysis

    def test_assessment_analysis(self):
        provider = AIMockProvider()
        text = "Student assessment results showing areas of improvement"
        analysis = provider.analyze_assessment(text)
        assert "weak_areas" in analysis
        assert "strengths" in analysis
        assert "overall_score" in analysis

    def test_study_plan_generation(self):
        provider = AIMockProvider()
        topics = [
            {"topic": "Algebra", "score": 3},
            {"topic": "Calculus", "score": 2},
        ]
        plan = provider.generate_study_plan(topics, 7)
        assert "sessions" in plan
        assert "horizon_days" in plan
        assert plan["horizon_days"] == 7


class TestMockIntegration:
    def test_mock_enabled_flag(self):
        # Test with AI_MOCK=true
        os.environ["AI_MOCK"] = "true"
        assert is_mock_enabled() is True
        
        # Test with AI_MOCK=false
        os.environ["AI_MOCK"] = "false"
        assert is_mock_enabled() is False

    def test_get_mock_provider_singleton(self):
        provider1 = get_mock_provider()
        provider2 = get_mock_provider()
        assert provider1 is provider2
