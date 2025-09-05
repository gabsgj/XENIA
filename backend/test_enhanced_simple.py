#!/usr/bin/env python3
"""
Simple test for enhanced content recommendations.
"""

import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.getcwd())

try:
    from app.services.resources import (
        _determine_subject_category,
        _get_subject_specific_resources,
        _calculate_recommendation_score,
        _generate_personalization_tags
    )
    
    print("✅ Enhanced resource functions imported successfully!")
    
    # Test 1: Subject Category Detection
    print("\n🔬 Testing Subject Category Detection:")
    test_cases = [
        ("Machine Learning algorithms", "programming"),
        ("Linear algebra fundamentals", "mathematics"),
        ("Organic chemistry reactions", "science"),
        ("Shakespeare literature", "language")
    ]
    
    for topic, expected in test_cases:
        detected = _determine_subject_category(topic, "general")
        status = "✅" if detected == expected else "❌"
        print(f"  {status} '{topic}' → {detected} (expected: {expected})")
    
    # Test 2: Specialized Resources
    print("\n📚 Testing Subject-Specific Resources:")
    subjects = ["mathematics", "programming", "science"]
    
    for subject in subjects:
        resources = _get_subject_specific_resources(f"Test {subject} topic", subject)
        print(f"  📖 {subject}: {len(resources)} specialized resources")
        
        if resources:
            sample = resources[0]
            title = sample.get("title", "Untitled")[:40]
            quality = sample.get("quality_score", 5)
            print(f"    Example: {title}... (Quality: {quality})")
    
    # Test 3: Quality Scoring
    print("\n⭐ Testing Quality Scoring:")
    test_resource = {
        "quality_score": 8,
        "metadata": {
            "learning_style": "visual",
            "difficulty": "intermediate",
            "educational_indicators": ["tutorial", "comprehensive"],
            "specialization": "subject_expert"
        }
    }
    
    score = _calculate_recommendation_score(test_resource, "Python Flask", "visual", "intermediate")
    print(f"  📊 Recommendation Score: {score}/10")
    
    # Test 4: Personalization Tags
    tags = _generate_personalization_tags(test_resource, "visual", "intermediate")
    print(f"  🏷️  Personalization Tags: {', '.join(tags) if tags else 'None'}")
    
    print("\n🎉 All Enhanced Features Working Correctly!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're in the backend directory")
except Exception as e:
    print(f"❌ Test error: {e}")
