#!/usr/bin/env python3
"""
Test script to verify production authentication is working
"""
import requests
import json
import uuid

# Production API base URL
API_BASE = "https://xenia.onrender.com/api"

def test_plan_generation():
    """Test plan generation with user ID"""
    print("🧪 Testing plan generation with user authentication...")
    
    # Generate a test user ID (simulating frontend behavior)
    test_user_id = str(uuid.uuid4())
    print(f"   Using test user ID: {test_user_id}")
    
    # Test data for plan generation
    plan_data = {
        "user_id": test_user_id,
        "horizon_days": 14,
        "preferred_hours_per_day": 2,
        "topics": [
            {
                "topic": "Linear Algebra",
                "importance": 0.9,
                "difficulty": 0.8,
                "hours_needed": 10
            },
            {
                "topic": "Calculus",
                "importance": 0.8,
                "difficulty": 0.7,
                "hours_needed": 8
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/plan/generate",
            json=plan_data,
            headers={
                "Content-Type": "application/json",
                "X-User-Id": test_user_id  # Also send in header for consistency
            },
            timeout=30
        )
        
        print(f"   Response status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Plan generation successful!")
            result = response.json()
            if 'sessions' in result:
                print(f"   📅 Generated {len(result['sessions'])} study sessions")
            return True
        else:
            print(f"   ❌ Plan generation failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False

def test_current_plan():
    """Test retrieving current plan (requires user ID in header)"""
    print("\n🧪 Testing current plan retrieval...")
    
    test_user_id = str(uuid.uuid4())
    
    try:
        response = requests.get(
            f"{API_BASE}/plan/current",
            headers={
                "X-User-Id": test_user_id
            },
            timeout=10
        )
        
        print(f"   Response status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Current plan retrieval successful!")
            return True
        elif response.status_code == 404:
            print("   ✅ No current plan found (expected for new user)")
            return True
        else:
            print(f"   ❌ Current plan retrieval failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False

def test_missing_user_id():
    """Test that endpoints properly reject requests without user ID"""
    print("\n🧪 Testing missing user ID validation...")
    
    try:
        response = requests.post(
            f"{API_BASE}/plan/generate",
            json={"horizon_days": 14},  # Missing user_id
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"   Response status: {response.status_code}")
        
        if response.status_code == 400:
            print("   ✅ Properly rejected request without user ID!")
            return True
        else:
            print(f"   ❌ Should have rejected request: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Testing XENIA Production Authentication System")
    print(f"   API Base: {API_BASE}")
    print("=" * 50)
    
    results = []
    results.append(test_plan_generation())
    results.append(test_current_plan())
    results.append(test_missing_user_id())
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"   ✅ Passed: {sum(results)}")
    print(f"   ❌ Failed: {len(results) - sum(results)}")
    
    if all(results):
        print("\n🎉 All authentication tests passed! Production ready!")
    else:
        print("\n⚠️  Some tests failed. Check authentication implementation.")
