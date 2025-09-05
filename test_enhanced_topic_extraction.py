#!/usr/bin/env python3
"""
Test enhanced topic extraction to verify more topics are being extracted.
"""

import sys
import os

# Add backend to path for imports
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

try:
    from app.services.weaktopics import extract_topics_from_text
    print("✅ Successfully imported extract_topics_from_text")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Available path:")
    for p in sys.path:
        print(f"  - {p}")
    sys.exit(1)

# Test syllabus content with various formats
test_syllabus = """
Advanced Computer Science Course

Topics:
1. Data Structures and Algorithms
2. Object-Oriented Programming
3. Database Management Systems

Chapter 1: Fundamentals
- Variables and Data Types
- Control Structures
- Functions and Methods

Mathematical Concepts:
• Linear Algebra
• Calculus
• Statistics and Probability

Programming Languages:
→ Python Programming
→ JavaScript Development  
→ SQL Database Queries

Advanced Topics:
▸ Machine Learning
▸ Artificial Intelligence
▸ Natural Language Processing

Technical Terms:
Array, Linked List, Binary Tree, Hash Table, Graph, Stack, Queue

Subject Areas:
Computer Science: Algorithm Design
Mathematics: Discrete Mathematics  
Engineering: Software Engineering

Formulas and Equations:
- Big O Notation
- Recursive Functions
- Mathematical Proofs

Additional Content:
Assembly Language, Compiler Design, Operating Systems, Computer Networks, 
Cybersecurity, Web Development, Mobile App Development, Cloud Computing

Course Policies and Administration:
- Grading System: 40% assignments, 60% exams
- Attendance Policy: Mandatory
- Office Hours: Tuesdays 2-4 PM
"""

def test_enhanced_extraction():
    """Test the enhanced topic extraction functionality."""
    print("🧪 Testing Enhanced Topic Extraction")
    print("=" * 50)
    
    # Extract topics using enhanced algorithm
    topics = extract_topics_from_text(test_syllabus)
    
    print(f"📊 Results: {len(topics)} topics extracted")
    print("\n📚 Extracted Topics:")
    for i, topic in enumerate(topics, 1):
        print(f"  {i:2d}. {topic}")
    
    # Test specific patterns
    print("\n🔍 Pattern Analysis:")
    
    # Check for numbered items
    numbered_topics = [t for t in topics if any(keyword in t.lower() for keyword in ['data structures', 'object-oriented', 'database management'])]
    print(f"  • Numbered items captured: {len(numbered_topics)}")
    
    # Check for bullet points
    bullet_topics = [t for t in topics if any(keyword in t.lower() for keyword in ['variables', 'control structures', 'functions'])]
    print(f"  • Bullet points captured: {len(bullet_topics)}")
    
    # Check for mathematical concepts
    math_topics = [t for t in topics if any(keyword in t.lower() for keyword in ['algebra', 'calculus', 'statistics'])]
    print(f"  • Mathematical concepts: {len(math_topics)}")
    
    # Check for programming concepts
    prog_topics = [t for t in topics if any(keyword in t.lower() for keyword in ['python', 'javascript', 'sql'])]
    print(f"  • Programming topics: {len(prog_topics)}")
    
    # Check for advanced topics
    advanced_topics = [t for t in topics if any(keyword in t.lower() for keyword in ['machine learning', 'artificial intelligence', 'nlp'])]
    print(f"  • Advanced topics: {len(advanced_topics)}")
    
    # Check for technical terms
    tech_terms = [t for t in topics if any(keyword in t.lower() for keyword in ['array', 'linked list', 'binary tree', 'hash table'])]
    print(f"  • Technical terms: {len(tech_terms)}")
    
    # Check if administrative content is filtered
    admin_topics = [t for t in topics if any(keyword in t.lower() for keyword in ['grading system', 'attendance policy', 'office hours'])]
    print(f"  • Administrative content filtered: {len(admin_topics)} (should be 0)")
    
    print(f"\n✅ Enhanced extraction completed: {len(topics)} total topics")
    
    return topics

if __name__ == "__main__":
    extracted_topics = test_enhanced_extraction()
    
    print(f"\n📈 Summary:")
    print(f"  • Total topics extracted: {len(extracted_topics)}")
    print(f"  • Enhancement successful: {'Yes' if len(extracted_topics) > 20 else 'No'}")
    print(f"  • Comprehensive coverage: {'Yes' if len(extracted_topics) > 30 else 'Partial'}")
