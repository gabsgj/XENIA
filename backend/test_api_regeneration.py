#!/usr/bin/env python
"""
Test the plan regeneration API endpoint with deadline adjustment.
"""
import requests
import json
from datetime import datetime, timedelta

# API configuration
API_URL = "http://localhost:8000/api/plan/regenerate"

def test_api_regeneration():
    """Test the regeneration API endpoint."""
    
    print("=" * 60)
    print("TESTING PLAN REGENERATION API ENDPOINT")
    print("=" * 60)
    
    # Calculate new deadline (10 days from now)
    new_deadline = (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d')
    
    # Test payload
    payload = {
        "plan_id": "test-plan-123",
        "user_id": "test-user",
        "new_deadline": new_deadline,
        "hours_per_day": 2.0,
        "preserve_progress": True,
        "learning_pace": "moderate",
        "priority_adjustment": "balanced"
    }
    
    print(f"\nTest Configuration:")
    print(f"  New deadline: {new_deadline}")
    print(f"  Hours per day: {payload['hours_per_day']}")
    print(f"  Learning pace: {payload['learning_pace']}")
    print(f"  Priority adjustment: {payload['priority_adjustment']}")
    
    print(f"\nSending POST request to {API_URL}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        # Send the request
        response = requests.post(
            API_URL,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Regeneration successful!")
            
            if "regenerated_plan" in data:
                plan = data["regenerated_plan"]
                print(f"\nRegenerated Plan Details:")
                print(f"  Total sessions: {len(plan.get('sessions', []))}")
                
                # Count sessions by status
                sessions = plan.get('sessions', [])
                completed = sum(1 for s in sessions if s.get('status') == 'completed')
                pending = sum(1 for s in sessions if s.get('status') != 'completed')
                print(f"  Completed: {completed}, Pending: {pending}")
                
                # Check changes summary
                if "changes_summary" in plan:
                    summary = plan["changes_summary"]
                    print(f"\nChanges Summary:")
                    print(f"  Max sessions per day: {summary.get('max_sessions_per_day', 'N/A')}")
                    print(f"  Hours per day: {summary.get('hours_per_day', 'N/A')}")
                    if summary.get('deadline_extended'):
                        print(f"  ⚠️ Deadline was extended by {summary.get('extension_days')} days")
                
                # Show first few sessions
                print(f"\nFirst 5 sessions:")
                for i, session in enumerate(sessions[:5], 1):
                    print(f"  {i}. {session.get('topic', 'Unknown')} on {session.get('date', 'Unknown')} ({session.get('status', 'pending')})")
                    
        else:
            print(f"❌ Request failed!")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"\n⚠️ Could not connect to the server at {API_URL}")
        print("Make sure the backend server is running with: python main.py")
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")

if __name__ == "__main__":
    test_api_regeneration()