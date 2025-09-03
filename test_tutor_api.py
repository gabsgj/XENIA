#!/usr/bin/env python3
"""
Test the AI tutor endpoint directly.
"""
import requests
import json

def test_tutor():
    """Test the tutor endpoint with a simple question."""
    url = "http://localhost:8000/api/tutor/ask"
    
    test_cases = [
        {
            "question": "What is 2+2? Explain step by step.",
            "user_id": "test-user"
        },
        {
            "question": "Solve x^2 - 5x + 6 = 0",
            "user_id": "test-user"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['question']}")
        
        try:
            response = requests.post(url, json=test_case, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Status: {response.status_code}")
                print(f"📝 Steps: {len(result.get('steps', []))}")
                
                # Check if it's the fallback response
                steps = result.get('steps', [])
                if steps and steps[0].get('title') == 'Understand the problem' and 'Break down what the question is asking' in steps[0].get('detail', ''):
                    print("⚠️  Got fallback response - AI API not working")
                else:
                    print("✅ Got real AI response!")
                    
                # Print first step as sample
                if steps:
                    print(f"📖 First step: {steps[0].get('title', 'N/A')}")
                    print(f"   Detail: {steps[0].get('detail', 'N/A')[:100]}...")
                    
            else:
                print(f"❌ Status: {response.status_code}")
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_tutor()
