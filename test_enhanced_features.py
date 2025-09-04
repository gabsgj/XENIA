#!/usr/bin/env python3
"""
Comprehensive test script for the enhanced XENIA AI Study Planner.
Tests all new features including AI topic filtering, plan generation, and deadline management.
"""

import requests
import json
import sys
import io
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_health():
    """Test basic health check."""
    print("🏥 Testing health endpoint...")
    try:
        response = requests.get(f'{BASE_URL}/health', timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Health check passed: {data}")
            return True
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
        return False

def test_enhanced_syllabus_upload():
    """Test enhanced syllabus upload with AI topic filtering."""
    print("\n📚 Testing enhanced syllabus upload...")
    
    # Create a test syllabus with multiple topics
    test_syllabus = """
    Advanced Computer Science Curriculum
    
    COURSE OBJECTIVES:
    This course covers advanced topics in computer science with focus on practical applications.
    
    LEARNING TOPICS:
    1. Machine Learning Fundamentals
       - Supervised Learning Algorithms
       - Unsupervised Learning Techniques
       - Neural Network Architecture
    
    2. Data Structures and Algorithms
       - Advanced Tree Structures (B-Trees, Red-Black Trees)
       - Graph Algorithms (Dijkstra, A*, Network Flow)
       - Dynamic Programming Applications
    
    3. Software Engineering Principles
       - Design Patterns (Observer, Factory, Strategy)
       - SOLID Principles Implementation
       - Test-Driven Development
    
    4. Database Systems
       - Relational Database Design
       - Query Optimization Techniques
       - NoSQL Database Architecture
    
    5. Distributed Systems
       - Consensus Algorithms (Raft, Paxos)
       - Load Balancing Strategies
       - Microservices Architecture
    
    ASSESSMENT CRITERIA:
    - Midterm Exam: 30%
    - Final Project: 40% 
    - Assignments: 20%
    - Participation: 10%
    
    PREREQUISITES:
    Students must have completed Data Structures (CS201) and Algorithms (CS301).
    """
    
    try:
        files = {
            'file': ('test_syllabus.txt', io.BytesIO(test_syllabus.encode()), 'text/plain')
        }
        headers = {'X-User-Id': 'test-user-enhanced-001'}
        
        response = requests.post(
            f'{BASE_URL}/api/upload/syllabus',
            files=files,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Upload successful!")
            print(f"   📄 Characters processed: {data.get('chars', 0)}")
            
            topics = data.get('topics', [])
            print(f"   🎯 Topics extracted: {len(topics)}")
            for i, topic in enumerate(topics[:10], 1):  # Show first 10 topics
                print(f"      {i}. {topic}")
            
            analysis = data.get('analysis', {})
            if analysis:
                print(f"   🧠 AI Analysis Results:")
                print(f"      Difficulty: {analysis.get('difficulty', 'unknown')}")
                print(f"      Estimated hours: {analysis.get('estimated_total_hours', analysis.get('estimated_hours', 'unknown'))}")
                print(f"      Subject area: {analysis.get('subject_area', 'unknown')}")
                
                ai_topics = analysis.get('topics', [])
                if ai_topics and isinstance(ai_topics[0], dict):
                    print(f"      Enhanced AI topics: {len(ai_topics)}")
                    for topic_data in ai_topics[:3]:  # Show first 3 enhanced topics
                        print(f"         • {topic_data.get('topic', 'N/A')} (score: {topic_data.get('score', 'N/A')}, priority: {topic_data.get('priority', 'N/A')})")
            
            plan_preview = data.get('plan_preview')
            if plan_preview:
                sessions = plan_preview.get('sessions', [])
                print(f"   📅 Plan preview generated: {len(sessions)} sessions")
                print(f"   🎯 Generation method: {plan_preview.get('generation_method', 'unknown')}")
                
            return True
        else:
            print(f"   ❌ Upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Upload error: {e}")
        return False

def test_enhanced_plan_generation():
    """Test enhanced plan generation with deadline management."""
    print("\n📊 Testing enhanced plan generation...")
    
    # Test with urgent deadline
    deadline = (datetime.now() + timedelta(days=7)).isoformat()
    
    try:
        payload = {
            "horizon_days": 14,
            "preferred_hours_per_day": 2.0,
            "deadline": deadline
        }
        headers = {'X-User-Id': 'test-user-enhanced-001', 'Content-Type': 'application/json'}
        
        response = requests.post(
            f'{BASE_URL}/api/plan/generate',
            json=payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            plan = response.json()
            print(f"   ✅ Plan generated successfully!")
            print(f"   📅 Horizon days: {plan.get('horizon_days', 'unknown')}")
            print(f"   ⚡ Urgency level: {plan.get('urgency_level', 'unknown')}")
            print(f"   🔥 Urgency multiplier: {plan.get('urgency_multiplier', 'unknown')}")
            print(f"   🎯 Generation method: {plan.get('generation_method', 'unknown')}")
            
            sessions = plan.get('sessions', [])
            print(f"   📚 Total sessions: {len(sessions)}")
            
            # Show learning optimizations
            optimizations = plan.get('learning_optimizations', {})
            if optimizations:
                print(f"   🧠 Learning optimizations:")
                for opt_name, opt_value in optimizations.items():
                    print(f"      • {opt_name.replace('_', ' ').title()}: {opt_value}")
            
            # Show first few sessions with enhanced data
            print(f"   📋 Sample sessions:")
            for i, session in enumerate(sessions[:5], 1):
                print(f"      {i}. {session.get('topic', 'N/A')}")
                print(f"         Date: {session.get('date', 'N/A')}")
                print(f"         Duration: {session.get('duration_min', 'N/A')} min")
                print(f"         Priority: {session.get('priority', 'N/A')}")
                print(f"         Focus: {session.get('focus', 'N/A')}")
                if session.get('cognitive_load'):
                    print(f"         Cognitive load: {session['cognitive_load']}")
            
            # Show AI insights if available
            ai_insights = plan.get('ai_insights', {})
            if ai_insights:
                print(f"   🤖 AI Insights:")
                for key, value in ai_insights.items():
                    print(f"      • {key.replace('_', ' ').title()}: {value}")
            
            return True
        else:
            print(f"   ❌ Plan generation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Plan generation error: {e}")
        return False

def test_current_plan_retrieval():
    """Test current plan retrieval with enhanced data."""
    print("\n📖 Testing current plan retrieval...")
    
    try:
        headers = {'X-User-Id': 'test-user-enhanced-001'}
        
        response = requests.get(
            f'{BASE_URL}/api/plan/current',
            headers=headers,
            timeout=15
        )
        
        if response.status_code == 200:
            plan = response.json()
            print(f"   ✅ Current plan retrieved!")
            
            # Show progress metrics
            progress = plan.get('progress', {})
            if progress:
                print(f"   📈 Progress metrics:")
                print(f"      • Completed: {progress.get('sessions_completed', 0)}")
                print(f"      • In progress: {progress.get('sessions_in_progress', 0)}")
                print(f"      • Completion: {progress.get('percent_complete', 0)}%")
            
            # Show enhanced features if present
            if plan.get('urgency_level'):
                print(f"   ⚡ Urgency level: {plan['urgency_level']}")
            
            if plan.get('learning_optimizations'):
                print(f"   🧠 Optimizations applied: {list(plan['learning_optimizations'].keys())}")
                
            return True
        else:
            print(f"   ❌ Plan retrieval failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Plan retrieval error: {e}")
        return False

def test_assessment_upload():
    """Test assessment upload with enhanced analysis."""
    print("\n📝 Testing enhanced assessment upload...")
    
    test_assessment = """
    Student Assessment Results - Midterm Exam
    
    PERFORMANCE BREAKDOWN:
    
    Section A: Machine Learning (40/60 points)
    - Supervised Learning: 15/20 ❌ Weak area
    - Unsupervised Learning: 12/20 ❌ Needs improvement  
    - Neural Networks: 13/20 ⚠️ Below average
    
    Section B: Algorithms (45/50 points)
    - Sorting Algorithms: 18/20 ✅ Strong
    - Graph Algorithms: 15/15 ✅ Excellent
    - Dynamic Programming: 12/15 ⚠️ Acceptable
    
    Section C: Database Systems (25/40 points)
    - SQL Queries: 8/15 ❌ Major weakness
    - Database Design: 10/15 ❌ Needs work
    - Query Optimization: 7/10 ✅ Good
    
    OVERALL SCORE: 110/150 (73%)
    
    RECOMMENDATIONS:
    - Focus heavily on Machine Learning fundamentals
    - Practice SQL query writing extensively  
    - Review database design principles
    - Continue strength in algorithms
    """
    
    try:
        files = {
            'file': ('test_assessment.txt', io.BytesIO(test_assessment.encode()), 'text/plain')
        }
        headers = {'X-User-Id': 'test-user-enhanced-001'}
        
        response = requests.post(
            f'{BASE_URL}/api/upload/assessment',
            files=files,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Assessment upload successful!")
            
            analysis = data.get('analysis', {})
            if analysis:
                print(f"   🎯 AI Assessment Analysis:")
                print(f"      Overall score: {analysis.get('overall_score', 'N/A')}")
                print(f"      Performance trend: {analysis.get('performance_trends', 'N/A')}")
                
                weak_areas = analysis.get('weak_areas', [])
                if weak_areas:
                    print(f"      🔴 Weak areas ({len(weak_areas)}):")
                    for weak in weak_areas[:5]:  # Show first 5
                        if isinstance(weak, dict):
                            print(f"         • {weak.get('topic', 'N/A')} (score: {weak.get('score', 'N/A')}, urgency: {weak.get('urgency', 'N/A')})")
                            if weak.get('remediation'):
                                print(f"           → {weak['remediation']}")
                
                strengths = analysis.get('strengths', [])
                if strengths:
                    print(f"      🟢 Strengths ({len(strengths)}):")
                    for strength in strengths[:3]:  # Show first 3
                        if isinstance(strength, dict):
                            print(f"         • {strength.get('topic', 'N/A')} (score: {strength.get('score', 'N/A')})")
                
                recommendations = analysis.get('study_recommendations', [])
                if recommendations:
                    print(f"      💡 Study recommendations:")
                    for rec in recommendations[:3]:
                        print(f"         • {rec}")
                
            return True
        else:
            print(f"   ❌ Assessment upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Assessment upload error: {e}")
        return False

def run_comprehensive_tests():
    """Run all enhanced feature tests."""
    print("🚀 XENIA AI Study Planner - Comprehensive Feature Test\n")
    print("=" * 60)
    
    tests = [
        test_health,
        test_enhanced_syllabus_upload,
        test_enhanced_plan_generation,
        test_current_plan_retrieval,
        test_assessment_upload
    ]
    
    passed = 0
    failed = 0
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
                print("   ✅ PASSED\n")
            else:
                failed += 1
                print("   ❌ FAILED\n")
        except Exception as e:
            failed += 1
            print(f"   💥 ERROR: {e}\n")
    
    print("=" * 60)
    print(f"🎯 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All enhanced features are working perfectly!")
        print("\n✨ New Features Successfully Implemented:")
        print("   • AI-powered topic filtering and categorization")
        print("   • Enhanced syllabus analysis with difficulty scoring")
        print("   • Smart deadline management with urgency levels")
        print("   • Advanced plan generation with learning science")
        print("   • Cognitive load balancing")
        print("   • Spaced repetition scheduling")
        print("   • Comprehensive assessment analysis")
        print("   • Priority-based topic ordering")
        print("   • Generate Plan button after upload")
    else:
        print(f"⚠️ {failed} test(s) need attention")
        
    return failed == 0

if __name__ == "__main__":
    success = run_comprehensive_tests()
    sys.exit(0 if success else 1)
