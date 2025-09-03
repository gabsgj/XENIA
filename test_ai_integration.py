#!/usr/bin/env python3
"""
Test script to verify AI integration is working properly.
"""
import os
import sys
import requests
import json

# Add backend to path
sys.path.append('backend')

def test_environment():
    """Test environment variables."""
    print("🔧 Testing environment variables...")
    ai_mock = os.getenv("AI_MOCK", "false")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    
    print(f"   AI_MOCK: {ai_mock}")
    print(f"   GEMINI_API_KEY: {'✅ Set' if gemini_key else '❌ Missing'}")
    
    return ai_mock.lower() == "false" and bool(gemini_key)

def test_ai_provider():
    """Test AI provider directly."""
    print("\n🤖 Testing AI provider...")
    try:
        from backend.app.services.ai_providers import get_ai_response
        response = get_ai_response("What is 2+2? Answer briefly.")
        print(f"   Response: {response[:100]}...")
        return True
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_tutor_endpoint():
    """Test tutor endpoint via HTTP."""
    print("\n🎓 Testing tutor endpoint...")
    try:
        url = "http://localhost:8000/api/tutor/ask"
        data = {
            "question": "What is 2+2?",
            "user_id": "test-user"
        }
        response = requests.post(url, json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Status: {response.status_code}")
            print(f"   Steps: {len(result.get('steps', []))}")
            return True
        else:
            print(f"   ❌ Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_analytics_endpoint():
    """Test analytics endpoint with UUID handling."""
    print("\n📊 Testing analytics endpoint...")
    try:
        url = "http://localhost:8000/api/analytics/student?user_id=demo-user"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Status: {response.status_code}")
            print(f"   Profile: {result.get('profile', {})}")
            return True
        else:
            print(f"   ❌ Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Testing XENIA AI Integration\n")
    
    results = []
    results.append(("Environment", test_environment()))
    results.append(("AI Provider", test_ai_provider()))
    results.append(("Tutor Endpoint", test_tutor_endpoint()))
    results.append(("Analytics Endpoint", test_analytics_endpoint()))
    
    print("\n📋 Test Results:")
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    all_passed = all(result[1] for result in results)
    print(f"\n🎯 Overall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())
