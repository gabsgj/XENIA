"""
Unit tests for the content filtering and topic extraction services.
"""
import unittest
from unittest.mock import patch, Mock, MagicMock
from app.services.ai_providers import filter_syllabus_content, extract_topics_with_gemini

class TestExtractionServices(unittest.TestCase):

    @patch('app.services.ai_providers.os.getenv')
    def test_filter_syllabus_content_no_gemini(self, mock_getenv):
        """Tests that the fallback filter works when Gemini is not available."""
        mock_getenv.return_value = None  # Simulate no GEMINI_API_KEY
        sample_syllabus = """
        **Course Title:** Introduction to AI
        **Instructor:** Dr. Evelyn Reed
        **Contact:** e.reed@university.edu
        **Core Topics:**
        1.  Introduction to AI
        2.  Machine Learning
        """
        filtered = filter_syllabus_content(sample_syllabus)
        self.assertNotIn("Dr. Evelyn Reed", filtered)
        self.assertNotIn("e.reed@university.edu", filtered)
        self.assertIn("Introduction to AI", filtered)

    @patch.dict('os.environ', {'GEMINI_API_KEY': 'test-real-key'})
    @patch('google.genai.Client')
    def test_extract_topics_with_gemini(self, mock_client_cls):
        """Tests that topics are extracted correctly using the new google-genai SDK."""
        # Mock the new google-genai Client pattern
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client

        mock_response = MagicMock()
        mock_response.text = '{"topics": ["AI Basics", "Advanced ML"]}'
        mock_client.models.generate_content.return_value = mock_response

        topics_data = extract_topics_with_gemini("Some academic text")
        self.assertEqual(len(topics_data["topics"]), 2)
        self.assertIn("AI Basics", topics_data["topics"])

if __name__ == '__main__':
    unittest.main()


