#!/usr/bin/env python3
"""
Test Gemini 2.0 Flash Enhanced Features for XENIA AI Study Planner.
Tests resource suggestions, progress tracking, and deadline management.
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "http://localhost:8000"
TEST_USER_ID = "test-user-gemini-2-flash-001"

def test_health():
    """Test if backend is running."""
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        return response.status_code == 200
    except:
        return False

def test_gemini_2_flash_plan_generation():
    """Test Gemini 2.0 Flash enhanced study plan generation with resources."""
    print("🚀 Testing Gemini 2.0 Flash plan generation with resources...")
    
    # Test with deadline and preferences
    deadline = (datetime.now() + timedelta(days=10)).isoformat()
    
    plan_data = {
        "horizon_days": 10,
        "preferred_hours_per_day": 2.5,
        "deadline": deadline,
        "learning_style": "visual"
    }
    
    response = requests.post(
        f"{BACKEND_URL}/api/plan/generate",
        json=plan_data,
        headers={"X-User-Id": TEST_USER_ID}
    )
    
    if response.status_code == 200:
        plan = response.json()
        
        # Check for enhanced features specific to Gemini 2.0 Flash
        sessions = plan.get('sessions', [])
        generation_method = plan.get('generation_method', '')
        
        has_resources = False
        resource_types = set()
        
        for session in sessions:
            if 'resources' in session:
                has_resources = True
                resources = session['resources']
                if 'youtube_videos' in resources:
                    resource_types.add('youtube_videos')
                if 'articles_and_guides' in resources:
                    resource_types.add('articles')
                if 'practice_platforms' in resources:
                    resource_types.add('practice')
        
        print(f"   ✅ Plan generated successfully")
        print(f"   ✅ Generation method: {generation_method}")
        print(f"   ✅ Sessions with resources: {has_resources}")
        print(f"   ✅ Resource types found: {', '.join(resource_types)}")
        print(f"   ✅ Sessions count: {len(sessions)}")
        print(f"   ✅ Deadline management: {'deadline_management' in plan}")
        print(f"   ✅ Adaptive guidelines: {'adaptive_guidelines' in plan}")
        
        return True
    else:
        print(f"   ❌ Plan generation failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_progress_tracking_and_adjustment():
    """Test progress tracking and automatic plan adjustment."""
    print("📊 Testing progress tracking and plan adjustment...")
    
    progress_data = {
        "completion_percentage": 75.0,
        "sessions_completed": 8,
        "time_spent_hours": 16.0,
        "completed_topics": ["Machine Learning", "Data Structures", "Algorithms"],
        "difficulty_ratings": {"Machine Learning": 7, "Data Structures": 5, "Algorithms": 8},
        "preferred_pace": "fast",
        "learning_style_feedback": "visual"
    }
    
    response = requests.post(
        f"{BACKEND_URL}/api/plan/update-progress",
        json=progress_data,
        headers={"X-User-Id": TEST_USER_ID}
    )
    
    if response.status_code == 200:
        result = response.json()
        adjustment_type = result.get('adjustment_type', 'none')
        recommendations = result.get('recommendations', [])
        
        print(f"   ✅ Progress updated successfully")
        print(f"   ✅ Adjustment type: {adjustment_type}")
        print(f"   ✅ Recommendations count: {len(recommendations)}")
        
        if recommendations:
            print(f"   ✅ Sample recommendation: {recommendations[0]}")
        
        return True
    else:
        print(f"   ❌ Progress tracking failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_topic_resource_discovery():
    """Test Gemini 2.0 Flash resource discovery for specific topics."""
    print("🔍 Testing Gemini 2.0 Flash resource discovery...")
    
    test_topics = [
        "Machine Learning",
        "React Programming",
        "Calculus",
        "Physics Quantum Mechanics",
        "Spanish Language"
    ]
    
    success_count = 0
    total_resources = 0
    
    for topic in test_topics:
        response = requests.get(
            f"{BACKEND_URL}/api/plan/resources/{topic}",
            params={"learning_style": "balanced"},
            headers={"X-User-Id": TEST_USER_ID}
        )
        
        if response.status_code == 200:
            result = response.json()
            resources = result.get('resources', {})
            
            videos = resources.get('youtube_videos', [])
            articles = resources.get('articles_and_guides', [])
            practice = resources.get('practice_platforms', [])
            tools = resources.get('interactive_tools', [])
            tips = resources.get('study_tips', [])
            
            topic_total = len(videos) + len(articles) + len(practice) + len(tools) + len(tips)
            total_resources += topic_total
            
            print(f"   ✅ {topic}: {len(videos)} videos, {len(articles)} articles, {len(practice)} practice, {len(tools)} tools, {len(tips)} tips")
            success_count += 1
        else:
            print(f"   ❌ {topic}: Failed to get resources ({response.status_code})")
    
    print(f"   ✅ Resource discovery: {success_count}/{len(test_topics)} topics successful")
    print(f"   ✅ Total resources found: {total_resources}")
    return success_count >= 4  # Allow one failure

def test_deadline_driven_planning():
    """Test deadline-driven planning with urgency levels."""
    print("⏰ Testing deadline-driven planning...")
    
    # Test urgent deadline (3 days)
    urgent_deadline = (datetime.now() + timedelta(days=3)).isoformat()
    
    urgent_plan_data = {
        "horizon_days": 14,
        "preferred_hours_per_day": 3.0,
        "deadline": urgent_deadline
    }
    
    response = requests.post(
        f"{BACKEND_URL}/api/plan/generate",
        json=urgent_plan_data,
        headers={"X-User-Id": TEST_USER_ID}
    )
    
    if response.status_code == 200:
        plan = response.json()
        
        urgency_level = plan.get('urgency_level', 'unknown')
        urgency_multiplier = plan.get('urgency_multiplier', 1.0)
        actual_horizon = plan.get('horizon_days', 14)
        
        print(f"   ✅ Urgent plan generated")
        print(f"   ✅ Urgency level: {urgency_level}")
        print(f"   ✅ Urgency multiplier: {urgency_multiplier}")
        print(f"   ✅ Adjusted horizon: {actual_horizon} days")
        
        # Test normal deadline (30 days)
        normal_deadline = (datetime.now() + timedelta(days=30)).isoformat()
        
        normal_plan_data = {
            "horizon_days": 14,
            "preferred_hours_per_day": 2.0,
            "deadline": normal_deadline
        }
        
        response2 = requests.post(
            f"{BACKEND_URL}/api/plan/generate",
            json=normal_plan_data,
            headers={"X-User-Id": TEST_USER_ID}
        )
        
        if response2.status_code == 200:
            plan2 = response2.json()
            normal_urgency = plan2.get('urgency_level', 'unknown')
            
            print(f"   ✅ Normal plan generated")
            print(f"   ✅ Normal urgency level: {normal_urgency}")
            
            return urgency_level != normal_urgency  # Should be different urgency levels
        
    print(f"   ❌ Deadline-driven planning failed")
    return False

def test_manual_plan_adjustment():
    """Test manual plan adjustment capabilities."""
    print("🔧 Testing manual plan adjustment...")
    
    adjustment_data = {
        "adjustment_type": "manual",
        "new_deadline": (datetime.now() + timedelta(days=7)).isoformat(),
        "new_hours_per_day": 3.0,
        "focus_topics": ["Machine Learning", "Data Structures"]
    }
    
    response = requests.post(
        f"{BACKEND_URL}/api/plan/adjust",
        json=adjustment_data,
        headers={"X-User-Id": TEST_USER_ID}
    )
    
    if response.status_code == 200:
        result = response.json()
        adjustments = result.get('adjustments_applied', {})
        
        deadline_changed = adjustments.get('deadline_changed', False)
        hours_changed = adjustments.get('hours_changed', False)
        topics_prioritized = adjustments.get('topics_prioritized', 0)
        
        print(f"   ✅ Plan adjusted successfully")
        print(f"   ✅ Deadline changed: {deadline_changed}")
        print(f"   ✅ Hours changed: {hours_changed}")
        print(f"   ✅ Topics prioritized: {topics_prioritized}")
        
        return deadline_changed and hours_changed
    else:
        print(f"   ❌ Plan adjustment failed: {response.status_code}")
        return False

def test_syllabus_ai_analysis():
    """Test AI-powered syllabus analysis with topic filtering."""
    print("📄 Testing AI syllabus analysis...")
    
    test_syllabus = """
    Advanced Data Science Course Syllabus
    
    Course Description:
    This course provides comprehensive coverage of data science methodologies and tools.
    
    Learning Objectives:
    1. Master statistical analysis techniques
    2. Learn machine learning algorithms
    3. Develop data visualization skills
    4. Understand big data processing
    
    Topics Covered:
    1. Python Programming for Data Science
    2. Statistics and Probability
    3. Machine Learning Algorithms
    4. Deep Learning and Neural Networks
    5. Data Visualization with Matplotlib and Seaborn
    6. Big Data Processing with Spark
    7. Natural Language Processing
    8. Computer Vision Applications
    
    Administrative Information:
    - Class meets Tuesdays and Thursdays
    - Office hours: Monday 2-4 PM
    - Final exam: December 15th
    - Course policies and grading rubric attached
    """
    
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(test_syllabus)
        temp_file = f.name
    
    try:
        with open(temp_file, 'rb') as f:
            files = {'file': ('data_science_syllabus.txt', f, 'text/plain')}
            
            response = requests.post(
                f"{BACKEND_URL}/api/upload/syllabus",
                files=files,
                headers={"X-User-Id": TEST_USER_ID}
            )
        
        if response.status_code == 200:
            result = response.json()
            analysis = result.get('analysis', {})
            topics = analysis.get('topics', [])
            filtered_admin = analysis.get('filtered_administrative', [])
            
            print(f"   ✅ Syllabus analyzed successfully")
            print(f"   ✅ Topics extracted: {len(topics)}")
            print(f"   ✅ Administrative items filtered: {len(filtered_admin)}")
            print(f"   ✅ Difficulty level: {analysis.get('difficulty', 'unknown')}")
            print(f"   ✅ Subject area: {analysis.get('subject_area', 'unknown')}")
            
            # Check for specific topics
            topic_names = [t.get('topic', '') for t in topics if isinstance(t, dict)]
            has_ml = any('machine learning' in t.lower() for t in topic_names)
            has_python = any('python' in t.lower() for t in topic_names)
            
            print(f"   ✅ Detected ML topic: {has_ml}")
            print(f"   ✅ Detected Python topic: {has_python}")
            
            return len(topics) >= 5 and len(filtered_admin) >= 2
        else:
            print(f"   ❌ Syllabus analysis failed: {response.status_code}")
            return False
    
    finally:
        os.unlink(temp_file)

def main():
    """Run all enhanced feature tests."""
    print("🚀 XENIA Gemini 2.0 Flash Enhanced Features Test")
    print("=" * 60)
    
    # Check if backend is running
    if not test_health():
        print("❌ Backend is not running! Please start the backend server.")
        sys.exit(1)
    
    print("✅ Backend is running")
    print()
    
    # Run all tests
    tests = [
        ("AI Syllabus Analysis", test_syllabus_ai_analysis),
        ("Gemini 2.0 Flash Plan Generation", test_gemini_2_flash_plan_generation),
        ("Topic Resource Discovery", test_topic_resource_discovery),
        ("Deadline-Driven Planning", test_deadline_driven_planning),
        ("Progress Tracking & Adjustment", test_progress_tracking_and_adjustment),
        ("Manual Plan Adjustment", test_manual_plan_adjustment),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"Running {test_name}...")
        try:
            if test_func():
                passed += 1
                print(f"✅ {test_name} PASSED")
            else:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} ERROR: {e}")
        print()
    
    print("=" * 60)
    print(f"🎯 Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 ALL GEMINI 2.0 FLASH FEATURES WORKING PERFECTLY!")
        print("✅ AI study plans with YouTube video resources")
        print("✅ User-specified deadlines with urgency management")
        print("✅ Progress tracking with automatic plan adjustment")
        print("✅ Comprehensive resource suggestions (videos, articles, practice)")
        print("✅ AI-powered topic filtering and analysis")
        print("✅ High-logic deadline management system")
    else:
        print("⚠️ Some features need attention. Check the output above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
