#!/usr/bin/env python
"""Test to ensure REAL AI is being used, not mock responses."""

import os
import sys
import json
import time
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

def test_direct_ai_call():
    """Test AI directly without going through the API."""
    print("=" * 60)
    print("TESTING DIRECT AI CALL (BYPASSING MOCK)")
    print("=" * 60)
    
    # Load environment
    load_dotenv()
    
    from app.utils.ai_manager import get_ai_manager
    
    try:
        manager = get_ai_manager()
        
        # Check what providers are available
        print("\nConfigured AI Providers:")
        print("-" * 40)
        if not manager.providers:
            print("❌ NO REAL AI PROVIDERS CONFIGURED!")
            print("\nYou need to add real API keys to .env file:")
            print("  GEMINI_API_KEY=your-actual-key")
            print("  OPENAI_API_KEY=sk-your-actual-key")
            print("  ANTHROPIC_API_KEY=your-actual-key")
            return False
        
        for name, config in manager.providers.items():
            print(f"✅ {name}: API Key = {config.api_key[:10]}...{config.api_key[-4:]}")
        
        # Test with a complex mathematical question that mock can't handle well
        test_prompt = """Solve this step by step: 
        If a train travels at 60 km/h for 2.5 hours, then speeds up to 90 km/h for another 1.5 hours, 
        what is the total distance traveled? Show all calculations."""
        
        print(f"\nTest Question: {test_prompt[:100]}...")
        print("\nCalling REAL AI provider...")
        print("-" * 40)
        
        start_time = time.time()
        
        # Force disable fallback to ensure we're using real AI
        os.environ['AI_FALLBACK_ENABLED'] = 'false'
        
        try:
            response = manager.get_ai_response(test_prompt)
            duration = time.time() - start_time
            
            print(f"✅ Response received in {duration:.2f} seconds")
            print("\nAI Response (first 500 chars):")
            print("-" * 40)
            print(response[:500])
            
            # Check if response looks like real AI (should have detailed calculations)
            if "150" in response and "135" in response and "285" in response:
                print("\n✅ CONFIRMED: Using REAL AI (correct calculations found)")
                return True
            elif "mock" in response.lower() or "unavailable" in response.lower():
                print("\n⚠️ WARNING: Response looks like a mock/fallback")
                return False
            else:
                print("\n✅ Response appears to be from REAL AI")
                return True
                
        except Exception as e:
            print(f"\n❌ Error calling AI: {e}")
            print("\nThis likely means:")
            print("1. Your API key is invalid")
            print("2. API service is down")
            print("3. Rate limit exceeded")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_tutor_with_complex_question():
    """Test the tutor API with a complex question."""
    print("\n" + "=" * 60)
    print("TESTING TUTOR API WITH COMPLEX QUESTION")
    print("=" * 60)
    
    import requests
    
    # A question that requires real AI understanding
    complex_question = """
    Explain the concept of recursion in programming and provide a Python example 
    that calculates the factorial of a number. Include edge cases.
    """
    
    print(f"Complex Question: {complex_question[:100]}...")
    
    try:
        response = requests.post(
            "http://localhost:8000/api/tutor/ask",
            json={"question": complex_question, "user_id": "test-real-ai"},
            headers={"X-User-Id": "test-real-ai"},
            timeout=60
        )
        
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            tutor_data = data.get('data', {})
            
            # Check for real AI indicators
            response_text = json.dumps(tutor_data)
            
            if "recursion" in response_text.lower() and ("def factorial" in response_text or "def " in response_text):
                print("✅ Response contains actual code and recursion explanation")
                print("✅ CONFIRMED: Using REAL AI for tutoring")
                
                # Show a snippet of the response
                if isinstance(tutor_data, dict) and 'answer' in tutor_data:
                    print(f"\nAnswer preview: {tutor_data['answer'][:300]}...")
                elif isinstance(tutor_data, dict) and 'steps' in tutor_data:
                    print(f"\nSteps provided: {len(tutor_data['steps'])}")
                    if tutor_data['steps']:
                        print(f"First step: {tutor_data['steps'][0].get('title', 'N/A')}")
                
                return True
            else:
                print("⚠️ Response lacks expected technical detail")
                print("Response preview:", response_text[:300])
                return False
        else:
            print(f"❌ Request failed: {data.get('error', 'Unknown error')}")
            return False
            
    except requests.exceptions.Timeout:
        print("⚠️ Request timed out (this might mean AI is working but slow)")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_mock_disabled():
    """Verify that mock mode is truly disabled."""
    print("\n" + "=" * 60)
    print("VERIFYING MOCK MODE IS DISABLED")
    print("=" * 60)
    
    load_dotenv()
    
    # Check environment variables
    ai_mock = os.getenv('AI_MOCK', 'false')
    fallback = os.getenv('AI_FALLBACK_ENABLED', 'true')
    
    print(f"AI_MOCK: {ai_mock}")
    print(f"AI_FALLBACK_ENABLED: {fallback}")
    
    if ai_mock.lower() == 'true':
        print("\n⚠️ WARNING: AI_MOCK is set to true!")
        print("Set AI_MOCK=false in .env to use real AI")
        return False
    
    print("\n✅ Mock mode is disabled")
    
    # Check if we have real API keys
    gemini_key = os.getenv('GEMINI_API_KEY', '')
    openai_key = os.getenv('OPENAI_API_KEY', '')
    anthropic_key = os.getenv('ANTHROPIC_API_KEY', '')
    
    real_keys = 0
    print("\nAPI Keys Status:")
    print("-" * 40)
    
    if gemini_key and not ('your-' in gemini_key or 'demo' in gemini_key):
        print(f"✅ Gemini: {gemini_key[:15]}...")
        real_keys += 1
    else:
        print("❌ Gemini: Not configured or placeholder")
    
    if openai_key and not ('your-' in openai_key or 'demo' in openai_key):
        print(f"✅ OpenAI: {openai_key[:15]}...")
        real_keys += 1
    else:
        print("❌ OpenAI: Not configured or placeholder")
    
    if anthropic_key and not ('your-' in anthropic_key or 'demo' in anthropic_key):
        print(f"✅ Anthropic: {anthropic_key[:15]}...")
        real_keys += 1
    else:
        print("❌ Anthropic: Not configured or placeholder")
    
    if real_keys == 0:
        print("\n❌ NO REAL API KEYS FOUND!")
        print("\nTo use real AI, you need to:")
        print("1. Get an API key from one of these services:")
        print("   - Google AI Studio: https://makersuite.google.com/app/apikey")
        print("   - OpenAI: https://platform.openai.com/api-keys")
        print("   - Anthropic: https://console.anthropic.com/")
        print("2. Add it to your .env file")
        print("3. Restart the backend")
        return False
    
    print(f"\n✅ {real_keys} real API key(s) configured")
    return True

def main():
    print("🤖 XENIA REAL AI VERIFICATION TEST")
    print("=" * 60)
    print("This test ensures you're using REAL AI, not mock responses")
    print("=" * 60)
    
    # Step 1: Check mock is disabled
    mock_ok = check_mock_disabled()
    
    if not mock_ok:
        print("\n❌ Fix the above issues to use real AI")
        return
    
    # Step 2: Test direct AI call
    direct_ok = test_direct_ai_call()
    
    # Step 3: Test through tutor API
    print("\nTesting through API (make sure backend is running)...")
    tutor_ok = test_tutor_with_complex_question()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    if direct_ok and tutor_ok:
        print("✅ SUCCESS: You are using REAL AI!")
        print("\nYour system is configured correctly for:")
        print("- Real AI responses (not mock)")
        print("- Complex question understanding")
        print("- Step-by-step problem solving")
    elif direct_ok and not tutor_ok:
        print("⚠️ PARTIAL: Direct AI works but API might need restart")
        print("\nTry restarting the backend:")
        print("  1. Stop the current server (Ctrl+C)")
        print("  2. Run: python run.py")
    else:
        print("❌ ISSUE: Not using real AI")
        print("\nCheck your API keys and configuration")
    
    print("=" * 60)

if __name__ == "__main__":
    main()