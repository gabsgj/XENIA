#!/usr/bin/env python3

"""
Quick test script to verify topic filtering is working correctly
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.weaktopics import extract_topics_from_text, is_administrative_content

def test_filtering():
    """Test the administrative content filtering"""
    
    # Sample syllabus text with mixed content
    sample_text = """
Chapter 1: Introduction to Machine Learning
Topic 2: Data Preprocessing Techniques
Unit 3: Supervised Learning Algorithms

3. User Manual: Instructions on how to set up, run and use the system.	practice + review	45 min
	pending

5/9/2025	Continuous Internal Evaluation Marks (CIE):	practice + review	45 min
	pending

5/9/2025	(8x2 =16 marks)

Topic 4: Neural Networks and Deep Learning
Chapter 5: Natural Language Processing
Unsupervised Learning Methods
Classification Algorithms
Regression Analysis

Setup Instructions: How to install dependencies
16 marks total for final evaluation
Practice session - 2 hours
Completed assignments due May 15, 2025
"""

    print("=== Testing Administrative Content Detection ===")
    
    # Test individual administrative items
    admin_items = [
        "3. User Manual: Instructions on how to set up, run and use the system.",
        "5/9/2025	Continuous Internal Evaluation Marks (CIE):",
        "(8x2 =16 marks)",
        "practice + review	45 min",
        "pending",
        "Setup Instructions: How to install dependencies",
        "16 marks total for final evaluation",
        "Practice session - 2 hours"
    ]
    
    print("\nAdministrative items (should be filtered out):")
    for item in admin_items:
        is_admin = is_administrative_content(item)
        print(f"  {'✓' if is_admin else '✗'} '{item}' -> {is_admin}")
    
    # Test academic items
    academic_items = [
        "Introduction to Machine Learning",
        "Data Preprocessing Techniques", 
        "Supervised Learning Algorithms",
        "Neural Networks and Deep Learning",
        "Natural Language Processing",
        "Unsupervised Learning Methods",
        "Classification Algorithms",
        "Regression Analysis"
    ]
    
    print("\nAcademic items (should NOT be filtered out):")
    for item in academic_items:
        is_admin = is_administrative_content(item)
        print(f"  {'✗' if not is_admin else '✓'} '{item}' -> {is_admin}")

    print("\n=== Testing Full Topic Extraction ===")
    
    extracted_topics = extract_topics_from_text(sample_text)
    
    print(f"\nExtracted {len(extracted_topics)} topics:")
    for i, topic in enumerate(extracted_topics, 1):
        print(f"  {i}. {topic}")
    
    # Verify no administrative content made it through
    admin_found = []
    for topic in extracted_topics:
        if is_administrative_content(topic):
            admin_found.append(topic)
    
    if admin_found:
        print(f"\n❌ FAILED: Administrative content found in results: {admin_found}")
        return False
    else:
        print(f"\n✅ SUCCESS: No administrative content in extracted topics")
        return True

if __name__ == "__main__":
    test_filtering()
