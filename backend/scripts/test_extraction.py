"""
Test script for verifying the enhanced topic extraction pipeline.
"""
import os
import sys
import json

# Add backend to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ai_providers import filter_syllabus_content, extract_topics_with_gemini

def run_test():
    """Runs the extraction test with a sample syllabus."""
    
    sample_syllabus = """
    **Course Title:** Introduction to Artificial Intelligence
    **Course Code:** CS-550
    **Instructor:** Dr. Evelyn Reed
    **Email:** e.reed@university.edu
    **Office Hours:** Wednesdays, 2:00 PM - 4:00 PM

    **Course Description:**
    This course provides a comprehensive overview of the field of artificial intelligence,
    covering fundamental concepts and modern techniques.

    **Grading Policy:**
    - Assignments: 40%
    - Midterm Exam: 30%
    - Final Project: 30%

    **Core Topics:**
    1.  **Introduction to AI:** History, goals, and applications.
    2.  **Search Algorithms:** Uninformed and informed search, Heuristics.
    3.  **Knowledge Representation:** Logic, Frames, Semantic Nets.
    4.  **Machine Learning:**
        - Supervised Learning: Regression, Classification.
        - Unsupervised Learning: Clustering, Dimensionality Reduction.
    5.  **Natural Language Processing:**
        - Text Preprocessing
        - Language Models
    6.  **Computer Vision:** Image recognition and processing.

    **Required Textbooks:**
    - "Artificial Intelligence: A Modern Approach" by Russell and Norvig.
    """

    print("--- Running Extraction Test ---")
    
    # 1. Filter the syllabus content
    print("\n[Step 1] Filtering syllabus content...")
    filtered_text = filter_syllabus_content(sample_syllabus)
    print("Filtered Text:\n", filtered_text)
    
    # 2. Extract topics from the filtered text
    print("\n[Step 2] Extracting topics with Gemini...")
    topics_data = extract_topics_with_gemini(filtered_text)
    
    print("\n[Step 3] Verifying results...")
    
    try:
        topics = topics_data.get("topics", {})
        
        print("\nExtracted Topics:")
        for main_topic, subtopics in topics.items():
            print(f"- {main_topic}")
            for subtopic in subtopics:
                print(f"  - {subtopic}")
            
        # Verification checks
        assert len(topics) > 2, "Should extract at least 3 main topics."
        assert "Machine Learning" in topics, "Topic 'Machine Learning' not found."
        assert len(topics["Machine Learning"]) > 1, "Should have at least 2 subtopics for Machine Learning."
        
        # Check for filtered content
        assert "Dr. Evelyn Reed" not in filtered_text, "Instructor name not filtered."
        assert "e.reed@university.edu" not in filtered_text, "Email not filtered."
        
        print("\n--- Test Passed! ---")
        
    except (AssertionError) as e:
        print(f"\n--- Test Failed: {e} ---")
        print("Raw output from extraction:\n", topics_data)

if __name__ == "__main__":
    run_test()
