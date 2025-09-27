#!/usr/bin/env python
"""Quick test to confirm real AI is working."""

import requests
import json

def test_real_ai():
    """Test with a question only real AI can answer properly."""
    
    print("=" * 60)
    print("🤖 TESTING REAL AI TUTOR")
    print("=" * 60)
    
    # Ask a question that requires real understanding
    question = "Write a Python function to find the nth Fibonacci number using recursion. Include base cases."
    
    print(f"\nQuestion: {question}")
    print("\nCalling tutor API...")
    print("-" * 40)
    
    try:
        response = requests.post(
            "http://localhost:8000/api/tutor/ask",
            json={"question": question, "user_id": "test-user"},
            headers={"X-User-Id": "test-user"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                tutor_data = data.get('data', {})
                
                # Try to extract the answer
                answer = None
                if isinstance(tutor_data, dict):
                    answer = tutor_data.get('answer', '')
                    if 'steps' in tutor_data and tutor_data['steps']:
                        print(f"✅ Received {len(tutor_data['steps'])} steps")
                        for i, step in enumerate(tutor_data['steps'][:3]):
                            print(f"\nStep {i+1}: {step.get('title', 'N/A')}")
                            detail = step.get('detail', '')[:200]
                            if detail:
                                print(f"  {detail}...")
                elif isinstance(tutor_data, str):
                    answer = tutor_data
                
                if answer:
                    # Check if it contains actual Python code
                    if "def " in answer and "fibonacci" in answer.lower():
                        print("\n" + "=" * 60)
                        print("✅ SUCCESS: USING REAL AI!")
                        print("=" * 60)
                        print("\nThe AI provided actual Python code for Fibonacci.")
                        print("\nAnswer preview:")
                        print("-" * 40)
                        # Show first 500 chars of answer
                        print(answer[:500])
                        if len(answer) > 500:
                            print("...")
                        return True
                    else:
                        # Try checking in JSON format
                        full_response = json.dumps(tutor_data)
                        if "def " in full_response and ("fib" in full_response.lower() or "recursion" in full_response.lower()):
                            print("\n" + "=" * 60)
                            print("✅ SUCCESS: USING REAL AI!")
                            print("=" * 60)
                            print("\nThe AI provided a detailed programming response.")
                            return True
                        else:
                            print("\n⚠️ Response doesn't contain expected code")
                            print(f"Response preview: {str(tutor_data)[:300]}")
                            return False
                else:
                    print("\n⚠️ No answer found in response")
                    return False
            else:
                print(f"\n❌ API returned success=false")
                print(f"Error: {data.get('error', 'Unknown')}")
                return False
        else:
            print(f"\n❌ HTTP {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("\n⚠️ Request timed out (AI might be slow)")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    result = test_real_ai()
    
    if not result:
        print("\n" + "=" * 60)
        print("TROUBLESHOOTING")
        print("=" * 60)
        print("\nIf the test failed, try:")
        print("1. Make sure backend is running: python run.py")
        print("2. Check your Gemini API key is valid")
        print("3. Check you have internet connection")
        print("4. Try a simpler question")
    
    print("\n" + "=" * 60)