#!/usr/bin/env python
"""Check API key configuration and test AI providers."""

import os
import sys
from dotenv import load_dotenv

def check_environment():
    """Check if API keys are properly configured."""
    
    print("=" * 60)
    print("XENIA API KEY DIAGNOSTIC")
    print("=" * 60)
    
    # Load .env file
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        print(f"✓ Found .env file at: {env_path}")
        load_dotenv(env_path)
    else:
        print(f"✗ No .env file found at: {env_path}")
    
    print("\n" + "-" * 60)
    print("API KEY STATUS:")
    print("-" * 60)
    
    api_keys = {
        'GEMINI_API_KEY': 'Google Gemini',
        'OPENAI_API_KEY': 'OpenAI',
        'ANTHROPIC_API_KEY': 'Anthropic Claude'
    }
    
    configured_count = 0
    for key, name in api_keys.items():
        value = os.getenv(key)
        if value:
            # Check if it's a placeholder
            if 'your-' in value.lower() or 'demo' in value.lower() or value.startswith('sk-demo'):
                print(f"⚠️  {name:20} - PLACEHOLDER VALUE (not valid)")
            else:
                print(f"✓  {name:20} - CONFIGURED ({len(value)} chars)")
                configured_count += 1
        else:
            print(f"✗  {name:20} - NOT SET")
    
    print("\n" + "-" * 60)
    print("OTHER SETTINGS:")
    print("-" * 60)
    
    settings = {
        'AI_FALLBACK_ENABLED': 'Fallback Mode',
        'AI_REQUEST_TIMEOUT_SECONDS': 'Timeout (seconds)',
        'AI_RATE_LIMIT_PER_MINUTE': 'Rate Limit (per min)',
        'SUPABASE_URL': 'Supabase URL',
        'FLASK_ENV': 'Flask Environment'
    }
    
    for key, name in settings.items():
        value = os.getenv(key, 'Not set')
        print(f"  {name:20} - {value}")
    
    print("\n" + "=" * 60)
    if configured_count == 0:
        print("⚠️  NO VALID API KEYS FOUND!")
        print("\nThis is why you're seeing 'Service is currently degraded'.")
        print("\nTo fix this:")
        print("1. Edit the .env file in the backend directory")
        print("2. Replace placeholder values with actual API keys")
        print("3. Restart the backend server")
    elif configured_count < 3:
        print(f"ℹ️  {configured_count} provider(s) configured")
        print("\nThe system will work but with limited redundancy.")
    else:
        print("✓ All providers configured!")
    
    print("=" * 60)
    
    return configured_count > 0

def test_ai_manager():
    """Test the AI manager to see provider status."""
    print("\n" + "=" * 60)
    print("AI PROVIDER MANAGER TEST")
    print("=" * 60)
    
    try:
        # Add backend directory to path
        sys.path.insert(0, os.path.dirname(__file__))
        
        from app.utils.ai_manager import get_ai_manager
        
        manager = get_ai_manager()
        status = manager.get_provider_status()
        
        print("\nProvider Status:")
        print("-" * 60)
        
        for provider, info in status.items():
            print(f"\n{provider.upper()}:")
            print(f"  Status: {info['status']}")
            print(f"  Failures: {info['failure_count']}")
            print(f"  Requests remaining: {info['requests_remaining']}")
            if info['wait_time_seconds'] > 0:
                print(f"  Rate limit wait: {info['wait_time_seconds']}s")
        
        # Check which providers are actually configured
        print("\n" + "-" * 60)
        print("Configured Providers:")
        if manager.providers:
            for name in manager.providers.keys():
                print(f"  ✓ {name}")
        else:
            print("  ✗ No providers configured!")
        
    except Exception as e:
        print(f"\n✗ Error testing AI manager: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    has_keys = check_environment()
    
    if has_keys or os.getenv('AI_FALLBACK_ENABLED', 'true').lower() == 'true':
        test_ai_manager()
    
    print("\n" + "=" * 60)
    print("DIAGNOSIS COMPLETE")
    print("=" * 60)