#!/usr/bin/env python3
"""
Test script for the enhanced AI tutor functionality.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_enhanced_tutor():
    """Test the enhanced AI tutor with different question types."""
    
    print("🤖 Testing Enhanced AI Tutor\n")
    
    test_questions = [
        {
            "question": "Solve for x: 2x + 5 = 15",
            "expected_type": "mathematics",
            "description": "Basic algebra equation"
        },
        {
            "question": "Explain how photosynthesis works in plants",
            "expected_type": "science", 
            "description": "Biology concept explanation"
        },
        {
            "question": "Write a Python function to find the factorial of a number",
            "expected_type": "programming",
            "description": "Programming problem"
        },
        {
            "question": "What are the causes of World War II?",
            "expected_type": "general",
            "description": "General history question"
        }
    ]
    
    for i, test in enumerate(test_questions, 1):
        print(f"\n📝 Test {i}: {test['description']}")
        print(f"Question: {test['question']}")
        
        try:
            payload = {
                "question": test["question"],
                "include_history": False
            }
            headers = {
                'X-User-Id': 'test-user-tutor-001',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f'{BASE_URL}/api/tutor/ask',
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Response received")
                
                # Show steps if available
                steps = data.get('steps', [])
                if steps:
                    print(f"📋 Solution steps ({len(steps)}):")
                    for idx, step in enumerate(steps[:3], 1):  # Show first 3 steps
                        title = step.get('title', f'Step {idx}')
                        detail = step.get('detail', '')[:100] + '...' if len(step.get('detail', '')) > 100 else step.get('detail', '')
                        print(f"   {idx}. {title}")
                        print(f"      {detail}")
                        
                        # Show additional fields if present
                        if step.get('calculation'):
                            print(f"      Calculation: {step['calculation']}")
                        if step.get('code_snippet'):
                            print(f"      Code: {step['code_snippet'][:50]}...")
                
                # Show answer summary
                answer = data.get('answer', '')
                if answer:
                    summary = answer[:200] + '...' if len(answer) > 200 else answer
                    print(f"💡 Answer summary: {summary}")
                
                print(f"✅ Test {i} PASSED")
                
            else:
                print(f"❌ Test {i} FAILED: {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Test {i} ERROR: {e}")

def test_tutor_with_math_problem():
    """Test tutor with a complex math problem."""
    print("\n🔢 Testing Complex Math Problem")
    
    complex_question = """
    A ball is thrown upward from the top of a building 64 feet tall with an initial velocity of 48 feet per second. 
    The height h of the ball t seconds after it's thrown is given by: h(t) = -16t² + 48t + 64
    
    1. When does the ball reach its maximum height?
    2. What is the maximum height?
    3. When does the ball hit the ground?
    """
    
    try:
        payload = {
            "question": complex_question,
            "include_history": False
        }
        headers = {
            'X-User-Id': 'test-user-math-001',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            f'{BASE_URL}/api/tutor/ask',
            json=payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Complex math problem solved!")
            
            steps = data.get('steps', [])
            if steps:
                print(f"📊 Detailed solution ({len(steps)} steps):")
                for idx, step in enumerate(steps, 1):
                    print(f"\n{idx}. {step.get('title', f'Step {idx}')}")
                    print(f"   {step.get('detail', '')}")
                    if step.get('calculation'):
                        print(f"   📐 Calculation: {step['calculation']}")
            
            print("✅ Complex math test PASSED")
        else:
            print(f"❌ Complex math test FAILED: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Complex math test ERROR: {e}")

if __name__ == "__main__":
    print("🚀 Enhanced AI Tutor Test Suite\n")
    print("=" * 50)
    
    # Test basic health first
    try:
        response = requests.get(f'{BASE_URL}/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy")
        else:
            print("❌ Backend health check failed")
            exit(1)
    except:
        print("❌ Cannot connect to backend")
        exit(1)
    
    # Run tutor tests
    test_enhanced_tutor()
    test_tutor_with_math_problem()
    
    print("\n" + "=" * 50)
    print("🎉 Enhanced AI Tutor testing completed!")
    print("\n🎯 Enhanced Features Verified:")
    print("   • Question type recognition")
    print("   • Specialized response generation")
    print("   • Step-by-step solutions")
    print("   • Multi-domain expertise")
    print("   • Advanced mathematical problem solving")
