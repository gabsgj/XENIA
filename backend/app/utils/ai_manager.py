"""
AI Provider Manager with timeout handling, circuit breaker pattern, and rate limiting.
Provides robust AI integration with automatic fallbacks and error recovery.
"""
import os
import time
import json
import asyncio
import logging
from typing import Optional, Dict, Any, List, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
from threading import Lock
import traceback

logger = logging.getLogger('xenia')

class ProviderStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"
    CIRCUIT_OPEN = "circuit_open"

@dataclass
class ProviderConfig:
    name: str
    api_key: str
    timeout: int = 30
    max_retries: int = 2
    rate_limit_per_minute: int = 20
    circuit_breaker_threshold: int = 5
    circuit_breaker_timeout: int = 300  # 5 minutes

@dataclass
class CircuitBreakerState:
    failure_count: int = 0
    last_failure_time: Optional[datetime] = None
    status: ProviderStatus = ProviderStatus.HEALTHY
    next_attempt_time: Optional[datetime] = None

class RateLimiter:
    def __init__(self, max_requests_per_minute: int):
        self.max_requests = max_requests_per_minute
        self.requests = []
        self.lock = Lock()
    
    def can_make_request(self) -> bool:
        with self.lock:
            now = datetime.now()
            # Remove requests older than 1 minute
            self.requests = [req_time for req_time in self.requests 
                           if now - req_time < timedelta(minutes=1)]
            
            if len(self.requests) < self.max_requests:
                self.requests.append(now)
                return True
            return False
    
    def get_wait_time(self) -> int:
        """Get seconds to wait before next request is allowed"""
        with self.lock:
            if not self.requests:
                return 0
            oldest_request = min(self.requests)
            wait_time = 60 - (datetime.now() - oldest_request).total_seconds()
            return max(0, int(wait_time))

class AIProviderManager:
    """Manages AI providers with circuit breaker, rate limiting, and timeout handling."""
    
    def __init__(self):
        self.providers = {}
        self.circuit_breakers = {}
        self.rate_limiters = {}
        self.provider_order = ['gemini', 'openai', 'anthropic']
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize all available AI providers."""
        # Gemini configuration
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key and not self._is_demo_key(gemini_key, "gemini"):
            self.providers['gemini'] = ProviderConfig(
                name='gemini',
                api_key=gemini_key,
                timeout=int(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "30")),
                rate_limit_per_minute=int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "20"))
            )
        
        # OpenAI configuration
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key and not self._is_demo_key(openai_key, "openai"):
            self.providers['openai'] = ProviderConfig(
                name='openai',
                api_key=openai_key,
                timeout=int(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "30")),
                rate_limit_per_minute=int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "20"))
            )
        
        # Anthropic configuration
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_key and not self._is_demo_key(anthropic_key, "anthropic"):
            self.providers['anthropic'] = ProviderConfig(
                name='anthropic',
                api_key=anthropic_key,
                timeout=int(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "30")),
                rate_limit_per_minute=int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "20"))
            )
        
        # Initialize circuit breakers and rate limiters
        for provider_name, config in self.providers.items():
            self.circuit_breakers[provider_name] = CircuitBreakerState()
            self.rate_limiters[provider_name] = RateLimiter(config.rate_limit_per_minute)
        
        logger.info(f"Initialized AI providers: {list(self.providers.keys())}")
    
    def _is_demo_key(self, key: str, provider: str) -> bool:
        """Check if the API key is a demo/placeholder key."""
        demo_patterns = {
            'gemini': ['demo', 'AIzaSyDemo_', 'your-gemini-api-key'],
            'openai': ['demo', 'sk-demo-', 'your-openai-api-key'],
            'anthropic': ['demo', 'sk-ant-demo-', 'your-anthropic-api-key']
        }
        
        key_lower = key.lower()
        return any(pattern.lower() in key_lower for pattern in demo_patterns.get(provider, []))
    
    def _can_use_provider(self, provider_name: str) -> bool:
        """Check if provider can be used (rate limit + circuit breaker)."""
        if provider_name not in self.providers:
            return False
        
        # Check circuit breaker
        circuit_breaker = self.circuit_breakers[provider_name]
        now = datetime.now()
        
        if circuit_breaker.status == ProviderStatus.CIRCUIT_OPEN:
            if circuit_breaker.next_attempt_time and now < circuit_breaker.next_attempt_time:
                return False
            # Try to close circuit breaker
            circuit_breaker.status = ProviderStatus.DEGRADED
            logger.info(f"Attempting to close circuit breaker for {provider_name}")
        
        # Check rate limit
        rate_limiter = self.rate_limiters[provider_name]
        if not rate_limiter.can_make_request():
            wait_time = rate_limiter.get_wait_time()
            logger.warning(f"Rate limit exceeded for {provider_name}, wait {wait_time}s")
            return False
        
        return True
    
    def _record_success(self, provider_name: str):
        """Record successful API call."""
        circuit_breaker = self.circuit_breakers[provider_name]
        circuit_breaker.failure_count = 0
        circuit_breaker.status = ProviderStatus.HEALTHY
        circuit_breaker.next_attempt_time = None
        logger.debug(f"Recorded success for {provider_name}")
    
    def _record_failure(self, provider_name: str, error: Exception):
        """Record failed API call and update circuit breaker."""
        circuit_breaker = self.circuit_breakers[provider_name]
        circuit_breaker.failure_count += 1
        circuit_breaker.last_failure_time = datetime.now()
        
        config = self.providers[provider_name]
        if circuit_breaker.failure_count >= config.circuit_breaker_threshold:
            circuit_breaker.status = ProviderStatus.CIRCUIT_OPEN
            circuit_breaker.next_attempt_time = datetime.now() + timedelta(seconds=config.circuit_breaker_timeout)
            logger.error(f"Circuit breaker opened for {provider_name} after {circuit_breaker.failure_count} failures")
        else:
            circuit_breaker.status = ProviderStatus.DEGRADED
            logger.warning(f"Provider {provider_name} degraded, failure count: {circuit_breaker.failure_count}")
    
    def _call_gemini(self, prompt: str, config: ProviderConfig) -> str:
        """Call Gemini API with timeout handling."""
        import google.generativeai as genai
        
        genai.configure(api_key=config.api_key)
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        model = genai.GenerativeModel(model_name)
        
        # Configure generation with timeout considerations
        generation_config = genai.types.GenerationConfig(
            temperature=0.7,
            max_output_tokens=2000,
            candidate_count=1,
        )
        
        # Use asyncio for timeout handling
        async def generate_with_timeout():
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: model.generate_content(prompt, generation_config=generation_config)
            )
            return response
        
        # Run with timeout
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            response = loop.run_until_complete(
                asyncio.wait_for(generate_with_timeout(), timeout=config.timeout)
            )
            loop.close()
            
            if response and response.text:
                return response.text.strip()
            else:
                raise Exception("Empty response from Gemini")
                
        except asyncio.TimeoutError:
            raise TimeoutError(f"Gemini API timeout after {config.timeout}s")
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    def _call_openai(self, prompt: str, config: ProviderConfig) -> str:
        """Call OpenAI API with timeout handling."""
        from openai import OpenAI
        
        client = OpenAI(
            api_key=config.api_key,
            timeout=config.timeout
        )
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.7
        )
        
        if response.choices and response.choices[0].message.content:
            return response.choices[0].message.content.strip()
        else:
            raise Exception("Empty response from OpenAI")
    
    def _call_anthropic(self, prompt: str, config: ProviderConfig) -> str:
        """Call Anthropic API with timeout handling."""
        import anthropic
        
        client = anthropic.Anthropic(
            api_key=config.api_key,
            timeout=config.timeout
        )
        
        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=2000,
            temperature=0.7,
            messages=[{"role": "user", "content": prompt}]
        )
        
        if response.content and response.content[0].text:
            return response.content[0].text.strip()
        else:
            raise Exception("Empty response from Anthropic")
    
    def get_ai_response(self, prompt: str, preferred_provider: Optional[str] = None) -> str:
        """
        Get AI response with automatic fallback and error handling.
        
        Args:
            prompt: The prompt to send to the AI
            preferred_provider: Preferred provider to try first
            
        Returns:
            AI response text
            
        Raises:
            Exception: If all providers fail
        """
        if not prompt or not prompt.strip():
            raise ValueError("Empty prompt provided")
        
        # Determine provider order
        provider_order = self.provider_order.copy()
        if preferred_provider and preferred_provider in self.providers:
            provider_order.remove(preferred_provider)
            provider_order.insert(0, preferred_provider)
        
        last_error = None
        
        for provider_name in provider_order:
            if not self._can_use_provider(provider_name):
                continue
            
            config = self.providers[provider_name]
            logger.info(f"Attempting AI request with {provider_name} (timeout: {config.timeout}s)")
            
            try:
                start_time = time.time()
                
                # Call appropriate provider
                if provider_name == 'gemini':
                    response = self._call_gemini(prompt, config)
                elif provider_name == 'openai':
                    response = self._call_openai(prompt, config)
                elif provider_name == 'anthropic':
                    response = self._call_anthropic(prompt, config)
                else:
                    continue
                
                duration = time.time() - start_time
                logger.info(f"✅ {provider_name} responded in {duration:.2f}s ({len(response)} chars)")
                
                self._record_success(provider_name)
                return response
                
            except TimeoutError as e:
                duration = time.time() - start_time
                logger.error(f"⏰ {provider_name} timeout after {duration:.2f}s: {e}")
                self._record_failure(provider_name, e)
                last_error = e
                
            except Exception as e:
                duration = time.time() - start_time
                logger.error(f"❌ {provider_name} failed after {duration:.2f}s: {e}")
                self._record_failure(provider_name, e)
                last_error = e
        
        # All providers failed
        if os.getenv("AI_FALLBACK_ENABLED", "true").lower() == "true":
            logger.warning("🎭 All AI providers failed, using intelligent fallback")
            return self._get_fallback_response(prompt)
        else:
            raise Exception(f"All AI providers failed. Last error: {last_error}")
    
    def _get_fallback_response(self, prompt: str) -> str:
        """Generate intelligent fallback response when all providers fail."""
        from ..services.ai_mock import get_mock_provider
        
        try:
            mock_response = get_mock_provider().get_tutor_response(prompt)
            return json.dumps({
                "steps": [
                    {
                        "title": "**Step 1: Understanding the problem**",
                        "detail": "Let me help you work through this step by step. First, let's identify what we're being asked to solve."
                    },
                    {
                        "title": "**Step 2: Applying the method**",
                        "detail": mock_response.get('explanation', 'I need to analyze this problem and determine the best approach.')
                    },
                    {
                        "title": "**Step 3: Working toward the solution**",
                        "detail": "Based on the information provided, here's how we can approach this systematically."
                    }
                ],
                "final_answer": "I'm currently experiencing connectivity issues with the AI services. Please try again in a moment, or check that your API keys are properly configured.",
                "key_concepts": ["Problem solving", "Step-by-step analysis"]
            })
        except Exception as e:
            logger.error(f"Fallback response generation failed: {e}")
            return json.dumps({
                "steps": [
                    {
                        "title": "**Step 1: Service temporarily unavailable**",
                        "detail": "The AI tutoring service is currently experiencing technical difficulties."
                    },
                    {
                        "title": "**Step 2: What you can do**",
                        "detail": "Please try again in a few moments. If the issue persists, check your internet connection and API configuration."
                    },
                    {
                        "title": "**Step 3: Alternative resources**",
                        "detail": "In the meantime, consider reviewing your study materials or consulting additional learning resources."
                    }
                ],
                "final_answer": "Service temporarily unavailable. Please try again shortly.",
                "key_concepts": ["Technical troubleshooting", "Alternative learning strategies"]
            })
    
    def get_provider_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all providers."""
        status = {}
        for provider_name in self.providers:
            circuit_breaker = self.circuit_breakers[provider_name]
            rate_limiter = self.rate_limiters[provider_name]
            
            status[provider_name] = {
                "status": circuit_breaker.status.value,
                "failure_count": circuit_breaker.failure_count,
                "last_failure": circuit_breaker.last_failure_time.isoformat() if circuit_breaker.last_failure_time else None,
                "requests_remaining": rate_limiter.max_requests - len(rate_limiter.requests),
                "wait_time_seconds": rate_limiter.get_wait_time()
            }
        
        return status

# Global instance
_ai_manager = None

def get_ai_manager() -> AIProviderManager:
    """Get global AI manager instance."""
    global _ai_manager
    if _ai_manager is None:
        _ai_manager = AIProviderManager()
    return _ai_manager

def get_ai_response(prompt: str, preferred_provider: Optional[str] = None) -> str:
    """Convenience function to get AI response."""
    return get_ai_manager().get_ai_response(prompt, preferred_provider)
