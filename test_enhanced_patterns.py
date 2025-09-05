#!/usr/bin/env python3
"""
Simple test for enhanced topic extraction patterns.
"""

import re
from typing import List

# Simple reproduction of the enhanced extraction logic
def test_enhanced_patterns():
    """Test the enhanced topic extraction patterns."""
    
    test_text = """
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

    print("🧪 Testing Enhanced Topic Extraction Patterns")
    print("=" * 60)
    
    topics = []
    lines = test_text.splitlines()
    
    # Pattern matching
    numbered_pattern = re.compile(r"^\s*(\d+[\.\)]\s+)(.+)$")
    colon_pattern = re.compile(r"^([^:]+):\s*(.+)$")
    
    # Track different types of extractions
    numbered_items = []
    bullet_items = []
    colon_items = []
    technical_terms = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Numbered items
        m = numbered_pattern.match(line)
        if m:
            topic = m.group(2).strip()
            numbered_items.append(topic)
            topics.append(topic)
            
        # Bullet points with various symbols
        raw = line.lstrip("-•*→▸◦▪▫ \t")
        if raw != line.strip() and len(raw.split()) >= 2:
            bullet_items.append(raw)
            topics.append(raw)
            
        # Colon-separated content
        m = colon_pattern.match(line)
        if m and len(m.group(1).strip()) >= 2:
            title = m.group(1).strip()
            description = m.group(2).strip()
            colon_items.append(f"{title}: {description}")
            topics.append(title)
            if len(description) >= 10:
                topics.append(description)
    
    # Extract technical terms
    tech_pattern = re.compile(r'\b(?:Array|List|Tree|Hash|Graph|Stack|Queue|Algorithm|Function|Method|Class|Object|Variable|Programming|Development|Language|System|Network|Security|Computing|Mathematics|Algebra|Calculus|Statistics|Probability|Intelligence|Learning|Processing)\b', re.IGNORECASE)
    tech_matches = tech_pattern.findall(test_text)
    technical_terms = list(set(tech_matches))
    topics.extend(technical_terms)
    
    # Remove duplicates while preserving order
    unique_topics = []
    seen = set()
    for topic in topics:
        topic_lower = topic.lower()
        if topic_lower not in seen:
            unique_topics.append(topic)
            seen.add(topic_lower)
    
    print(f"📊 Results Summary:")
    print(f"  • Numbered items: {len(numbered_items)}")
    print(f"  • Bullet points: {len(bullet_items)}")
    print(f"  • Colon-separated: {len(colon_items)}")
    print(f"  • Technical terms: {len(technical_terms)}")
    print(f"  • Total unique topics: {len(unique_topics)}")
    
    print(f"\n📚 All Extracted Topics ({len(unique_topics)}):")
    for i, topic in enumerate(unique_topics, 1):
        print(f"  {i:2d}. {topic}")
    
    # Check for comprehensive coverage
    expected_topics = [
        'data structures', 'algorithms', 'programming', 'database',
        'variables', 'functions', 'algebra', 'calculus', 'statistics',
        'python', 'javascript', 'machine learning', 'artificial intelligence',
        'array', 'linked list', 'binary tree', 'hash table'
    ]
    
    found_expected = 0
    for expected in expected_topics:
        for topic in unique_topics:
            if expected.lower() in topic.lower():
                found_expected += 1
                break
    
    coverage_percentage = (found_expected / len(expected_topics)) * 100
    
    print(f"\n📈 Coverage Analysis:")
    print(f"  • Expected key topics found: {found_expected}/{len(expected_topics)} ({coverage_percentage:.1f}%)")
    print(f"  • Enhancement successful: {'✅ Yes' if len(unique_topics) > 25 else '❌ No'}")
    print(f"  • Comprehensive coverage: {'✅ Yes' if coverage_percentage > 80 else '⚠️ Partial'}")
    
    return unique_topics

if __name__ == "__main__":
    extracted_topics = test_enhanced_patterns()
    print(f"\n🎯 Final Result: {len(extracted_topics)} topics extracted with enhanced patterns")
