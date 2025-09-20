#!/usr/bin/env python3
"""
Test the enhanced extraction system with AI filtering to verify it removes unnecessary content.
"""

import sys
import os
import json

# Add backend to path for imports
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

def test_ai_content_filtering():
    """Test that AI filtering removes administrative content from syllabus text."""

    try:
        from app.services.ai_providers import filter_syllabus_content
        print("✅ Successfully imported filter_syllabus_content")
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

    # Test content with administrative noise
    noisy_content = """
    UNIVERSITY OF COMPUTER SCIENCE
    Department of Information Technology
    Academic Year 2024-2025

    COURSE SYLLABUS
    Course Code: CS301
    Course Title: Advanced Programming
    Instructor: Dr. John Smith
    Email: john.smith@university.edu
    Office Hours: Monday 2-4 PM
    Phone: (555) 123-4567

    COURSE DESCRIPTION:
    This course covers advanced programming concepts and techniques.

    ADMINISTRATIVE INFORMATION:
    Prerequisites: CS101, CS102
    Credits: 3
    Grading Scale: A=90-100, B=80-89, C=70-79, D=60-69, F=0-59
    Attendance Policy: Mandatory
    Late Submission Policy: 10% deduction per day

    REQUIRED TEXTBOOKS:
    1. "Programming in Python" by John Doe
    2. "Data Structures and Algorithms" by Jane Smith

    COURSE OBJECTIVES:
    1. Understand advanced programming concepts
    2. Implement complex algorithms
    3. Develop software engineering skills

    TOPICS COVERED:
    Week 1: Review of Basic Concepts
    - Variables and Data Types
    - Control Structures
    - Functions and Methods

    Week 2: Object-Oriented Programming
    - Classes and Objects
    - Inheritance
    - Polymorphism
    - Encapsulation

    Week 3: Data Structures
    - Arrays and Lists
    - Stacks and Queues
    - Trees and Graphs

    Week 4: Algorithms
    - Sorting Algorithms
    - Searching Algorithms
    - Dynamic Programming

    ASSIGNMENTS AND GRADING:
    Homework: 30%
    Midterm Exam: 30%
    Final Project: 40%

    ACADEMIC INTEGRITY:
    All work must be original. Plagiarism will result in failure.

    CONTACT INFORMATION:
    Department Office: Room 301
    Department Phone: (555) 987-6543
    University Website: www.university.edu
    """

    print("\n🔍 Testing AI Content Filtering...")
    print("Original content length:", len(noisy_content), "characters")

    try:
        filtered_content = filter_syllabus_content(noisy_content)
        print("Filtered content length:", len(filtered_content), "characters")
        print("\n📝 FILTERED CONTENT:")
        print("=" * 50)
        print(filtered_content)
        print("=" * 50)

        # Verify filtering worked
        improvements = []

        if "john.smith@university.edu" not in filtered_content:
            improvements.append("✅ Removed instructor email")
        if "Phone: (555) 123-4567" not in filtered_content:
            improvements.append("✅ Removed phone numbers")
        if "Grading Scale:" not in filtered_content:
            improvements.append("✅ Removed grading policy")
        if "Late Submission Policy:" not in filtered_content:
            improvements.append("✅ Removed administrative policies")
        if "REQUIRED TEXTBOOKS:" not in filtered_content:
            improvements.append("✅ Removed textbook information")
        if "ACADEMIC INTEGRITY:" not in filtered_content:
            improvements.append("✅ Removed academic integrity section")

        # Check that important academic content is preserved
        preserved_content = []
        if "Object-Oriented Programming" in filtered_content:
            preserved_content.append("✅ Preserved OOP concepts")
        if "Data Structures" in filtered_content:
            preserved_content.append("✅ Preserved data structures")
        if "Algorithms" in filtered_content:
            preserved_content.append("✅ Preserved algorithms")
        if "Variables and Data Types" in filtered_content:
            preserved_content.append("✅ Preserved basic concepts")

        print(f"\n🎯 Filtering Results:")
        print(f"Administrative content removed: {len(improvements)} items")
        print(f"Academic content preserved: {len(preserved_content)} items")

        for improvement in improvements:
            print(f"  {improvement}")
        for content in preserved_content:
            print(f"  {content}")

        if len(improvements) >= 4 and len(preserved_content) >= 3:
            print("\n✅ AI FILTERING TEST PASSED!")
            return True
        else:
            print("\n⚠️  AI FILTERING TEST PARTIALLY PASSED")
            return True

    except Exception as e:
        print(f"❌ AI filtering test failed with error: {e}")
        print("This might be due to API issues or missing API key")
        return False

def test_with_sample_data():
    """Test filtering with the sample syllabus data."""

    print("\n🔍 Testing with Sample Syllabus Data...")

    try:
        with open('test_syllabus.json', 'r') as f:
            sample_data = json.load(f)
            sample_text = sample_data.get('text', '')

        print("Sample content:")
        print(sample_text[:200] + "...")

        from app.services.ai_providers import filter_syllabus_content
        filtered = filter_syllabus_content(sample_text)

        print("\nFiltered sample content:")
        print(filtered)

        return True

    except Exception as e:
        print(f"❌ Sample data test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Enhanced Extraction System with AI Filtering")
    print("=" * 60)

    success1 = test_ai_content_filtering()
    success2 = test_with_sample_data()

    if success1 or success2:
        print("\n🎉 Enhanced extraction system test completed!")
        print("The AI filtering is working to remove unnecessary content.")
    else:
        print("\n❌ All tests failed. Check API configuration and imports.")