#!/usr/bin/env python3
"""
Test Gemini API connection directly.
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_gemini_api():
    """Test Gemini API directly."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    print(f"Gemini API Key: {gemini_key[:20]}..." if gemini_key else "No API key found")
    
    if not gemini_key:
        print("❌ No Gemini API key found")
        return False
    
    try:
        import google.generativeai as genai
        print("✅ google.generativeai imported successfully")
        
        genai.configure(api_key=gemini_key)
        print("✅ API key configured")
        
        model = genai.GenerativeModel('gemini-pro')
        print("✅ Model created")
        
        response = model.generate_content("What is 2+2? Answer in one sentence.")
        print(f"✅ Response: {response.text}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_gemini_api()
