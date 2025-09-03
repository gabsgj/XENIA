#!/usr/bin/env python3
"""
Debug AI integration step by step.
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_environment():
    """Test environment setup."""
    print("🔧 Environment Variables:")
    ai_mock = os.getenv("AI_MOCK", "not_set")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    
    print(f"   AI_MOCK: {ai_mock}")
    print(f"   GEMINI_API_KEY: {'✅ Set (' + gemini_key[:10] + '...)' if gemini_key else '❌ Missing'}")
    
    return ai_mock.lower() == "false" and bool(gemini_key)

def test_gemini_direct():
    """Test Gemini API directly."""
    print("\n🤖 Testing Gemini API directly:")
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        print("   ❌ No API key")
        return False
    
    try:
        import google.generativeai as genai
        print("   ✅ Import successful")
        
        genai.configure(api_key=gemini_key)
        print("   ✅ API configured")
        
        model = genai.GenerativeModel('gemini-pro')
        print("   ✅ Model created")
        
        # Simple test
        response = model.generate_content("Say 'Hello from Gemini!' and nothing else.")
        print(f"   ✅ Response: {response.text.strip()}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return False

def test_ai_provider():
    """Test our AI provider."""
    print("\n🔧 Testing AI Provider:")
    
    try:
        # Add backend to path
        sys.path.insert(0, 'backend')
        from app.services.ai_providers import get_ai_response
        
        response = get_ai_response("Say 'Hello from AI Provider!' and nothing else.")
        print(f"   Response: {response}")
        
        # Check if it's the fallback response
        if "Understand the problem" in response:
            print("   ❌ Got fallback response")
            return False
        else:
            print("   ✅ Got real AI response")
            return True
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return False

def main():
    """Run all tests."""
    print("🧪 Debugging AI Integration\n")
    
    env_ok = test_environment()
    gemini_ok = test_gemini_direct()
    provider_ok = test_ai_provider()
    
    print(f"\n📋 Results:")
    print(f"   Environment: {'✅' if env_ok else '❌'}")
    print(f"   Gemini Direct: {'✅' if gemini_ok else '❌'}")
    print(f"   AI Provider: {'✅' if provider_ok else '❌'}")
    
    if not gemini_ok:
        print("\n💡 Gemini API is not working. Check:")
        print("   - API key is valid")
        print("   - google-generativeai package is installed")
        print("   - Network connectivity")
    
    if gemini_ok and not provider_ok:
        print("\n💡 Gemini works but AI Provider doesn't. Check:")
        print("   - Environment variable loading in backend")
        print("   - Import paths")

if __name__ == "__main__":
    main()
