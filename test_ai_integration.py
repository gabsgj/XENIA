#!/usr/bin/env python3
"""Lightweight integration sanity checks for AI-related functionality.

Run standalone:
    python test_ai_integration.py

It will (optionally) hit local endpoints if the backend is running.
"""
from __future__ import annotations
import os
import requests
from dotenv import load_dotenv

load_dotenv('backend/.env')


def test_environment() -> bool:
        """Validate that at least one AI provider key is present."""
        gemini_key = os.getenv("GEMINI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        print("Environment Check:")
        print(f"   GEMINI_API_KEY set: {bool(gemini_key)}")
        print(f"   OPENAI_API_KEY set: {bool(openai_key)}")
        print(f"   ANTHROPIC_API_KEY set: {bool(anthropic_key)}")
        available = bool(gemini_key or openai_key or anthropic_key)
        print(f"   At least one provider available: {available}")
        return available

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
        url = "http://localhost:8000/api/analytics/student"
        headers = {'X-User-Id': 'test-user'}
        response = requests.get(url, headers=headers, timeout=10)
        
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
    raise SystemExit(main())
