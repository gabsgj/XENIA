#!/usr/bin/env python
"""Test the tutor API endpoint directly."""

import requests
import json
import time

def test_tutor_status():
    """Test the /api/tutor/status endpoint."""
    print("=" * 60)
    print("TESTING TUTOR STATUS ENDPOINT")
    print("=" * 60)
    
    try:
        response = requests.get("http://localhost:8000/api/tutor/status")
        data = response.json()
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Data:\n{json.dumps(data, indent=2)}")
        
        if data.get('success') and data.get('data'):
            service_data = data['data']
            service_status = service_data.get('service', 'unknown')
            providers = service_data.get('available_providers', [])
            
            print("\n" + "-" * 60)
            print(f"Service Status: {service_status.upper()}")
            print(f"Available Providers: {', '.join(providers) if providers else 'None'}")
            print(f"Fallback Enabled: {service_data.get('fallback_enabled', False)}")
            
            if service_status == "degraded":
                print("\n⚠️  Service shows as DEGRADED because:")
                if len(providers) == 0:
                    print("  - No AI providers are available")
                elif len(providers) == 1:
                    print("  - Only 1 provider is available (limited redundancy)")
                print("  - This is just a warning; the service still works!")
            
    except Exception as e:
        print(f"✗ Error: {e}")

def test_tutor_ask():
    """Test the /api/tutor/ask endpoint with a simple question."""
    print("\n" + "=" * 60)
    print("TESTING TUTOR ASK ENDPOINT")
    print("=" * 60)
    
    test_question = "What is 2 + 2?"
    print(f"Question: {test_question}")
    
    try:
        response = requests.post(
            "http://localhost:8000/api/tutor/ask",
            json={"question": test_question, "user_id": "test-user"},
            headers={"X-User-Id": "test-user"}
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Time: {response.elapsed.total_seconds():.2f} seconds")
        
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            print("✓ Tutor responded successfully!")
            
            # Extract the actual response
            if data.get('data'):
                tutor_data = data['data']
                if isinstance(tutor_data, dict):
                    if 'answer' in tutor_data:
                        print(f"\nAnswer: {tutor_data['answer'][:200]}...")
                    if 'steps' in tutor_data:
                        print(f"Steps provided: {len(tutor_data.get('steps', []))}")
                elif isinstance(tutor_data, str):
                    print(f"\nResponse: {tutor_data[:200]}...")
        else:
            print("✗ Tutor request failed")
            print(f"Error: {data.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"✗ Error: {e}")

def main():
    print("XENIA TUTOR API TEST")
    print("=" * 60)
    print("Make sure the backend is running on http://localhost:8000")
    print("=" * 60)
    
    # Test status endpoint
    test_tutor_status()
    
    # Test ask endpoint
    test_tutor_ask()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()