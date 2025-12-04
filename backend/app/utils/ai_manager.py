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
    circuit_breaker_threshold: int = 5
    circuit_breaker_timeout: int = 300  # 5 minutes

@dataclass
class CircuitBreakerState:
    failure_count: int = 0
    last_failure_time: Optional[datetime] = None
    status: ProviderStatus = ProviderStatus.HEALTHY
    next_attempt_time: Optional[datetime] = None

# Rate limiting removed - no longer needed

class AIProviderManager:
    """Manages AI providers with circuit breaker, rate limiting, and timeout handling."""
    
    def __init__(self):
        self.providers = {}
        self.circuit_breakers = {}
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
                timeout=int(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "30"))
            )
        
        # OpenAI configuration
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key and not self._is_demo_key(openai_key, "openai"):
            self.providers['openai'] = ProviderConfig(
                name='openai',
                api_key=openai_key,
                timeout=int(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "30"))
            )
        
        # Anthropic configuration
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_key and not self._is_demo_key(anthropic_key, "anthropic"):
            self.providers['anthropic'] = ProviderConfig(
                name='anthropic',
                api_key=anthropic_key,
                timeout=int(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "30"))
            )
        
        # Initialize circuit breakers
        for provider_name, config in self.providers.items():
            self.circuit_breakers[provider_name] = CircuitBreakerState()
        
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
        """Check if provider can be used (circuit breaker check only)."""
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
        import threading
        import platform
        
        genai.configure(api_key=config.api_key)
        # Use gemini-2.5-flash for faster responses
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        model = genai.GenerativeModel(model_name)
        
        # Configure generation with timeout considerations
        generation_config = genai.types.GenerationConfig(
            temperature=0.7,
            max_output_tokens=2000,
            candidate_count=1,
        )
        
        # Cross-platform timeout handling using threading
        result = [None]
        exception = [None]
        
        def call_api():
            try:
                response = model.generate_content(prompt, generation_config=generation_config)
                result[0] = response
            except Exception as e:
                exception[0] = e
        
        # Start API call in separate thread
        thread = threading.Thread(target=call_api)
        thread.daemon = True
        thread.start()
        thread.join(timeout=config.timeout)
        
        if thread.is_alive():
            # Thread is still running, timeout occurred
            raise TimeoutError(f"Gemini API timeout after {config.timeout}s")
        
        if exception[0]:
            raise Exception(f"Gemini API error: {str(exception[0])}")
        
        if result[0] and result[0].text:
            return result[0].text.strip()
        else:
            raise Exception("Empty response from Gemini")
    
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
        
        # Check if this is a quiz generation request
        prompt_lower = prompt.lower()
        if 'quiz' in prompt_lower or 'mcq' in prompt_lower or 'multiple-choice' in prompt_lower or 'q:' in prompt_lower:
            # Return quiz-format response
            return self._get_quiz_fallback(prompt)
        
        # Default: return tutor JSON format
        from ..services.ai_mock import get_mock_provider
        
        try:
            mock_response = get_mock_provider().get_tutor_response(prompt)
            explanation = mock_response.get('explanation', 'Let me help you work through this problem.')
            steps = mock_response.get('steps', [])
            
            # Use the mock steps if available, otherwise create generic ones
            if steps and len(steps) > 0:
                formatted_steps = steps
            else:
                formatted_steps = [
                    {
                        "title": "Understanding the problem",
                        "detail": "Let me help you work through this step by step. First, let's identify what we're being asked to solve."
                    },
                    {
                        "title": "Applying the method",
                        "detail": explanation
                    },
                    {
                        "title": "Working toward the solution",
                        "detail": "Based on the information provided, here's how we can approach this systematically."
                    },
                    {
                        "title": "Conclusion",
                        "detail": "Review the steps above and apply them to similar problems for practice."
                    }
                ]
            
            return json.dumps({
                "steps": formatted_steps,
                "answer": explanation,
                "key_concepts": ["Problem solving", "Step-by-step analysis"]
            })
        except Exception as e:
            logger.error(f"Fallback response generation failed: {e}")
            return json.dumps({
                "steps": [
                    {
                        "title": "Service temporarily unavailable",
                        "detail": "The AI tutoring service is currently experiencing technical difficulties. Please try again in a few moments."
                    }
                ],
                "answer": "Service temporarily unavailable. Please try again shortly.",
                "key_concepts": []
            })
    
    def _get_quiz_fallback(self, prompt: str) -> str:
        """Generate a quiz-format fallback response."""
        import random
        
        # Extract topic from prompt if possible
        topic = "General Knowledge"
        if "topic:" in prompt.lower():
            try:
                topic = prompt.lower().split("topic:")[1].split("'")[1].strip()
            except:
                pass
        elif "'" in prompt:
            try:
                # Try to extract topic from quotes
                parts = prompt.split("'")
                if len(parts) >= 2:
                    topic = parts[1].strip()
            except:
                pass
        
        # Generate a reasonable fallback question
        questions = [
            {
                "q": f"Which of the following best describes the fundamental concept of {topic}?",
                "options": [
                    f"The core principles and foundations of {topic}",
                    f"Only the advanced techniques in {topic}",
                    f"Historical origins without practical application",
                    f"Unrelated theoretical concepts"
                ],
                "answer": "A"
            },
            {
                "q": f"What is an important aspect to consider when studying {topic}?",
                "options": [
                    "Understanding the underlying theory first",
                    "Memorizing without understanding",
                    "Skipping the basics entirely",
                    "Ignoring related concepts"
                ],
                "answer": "A"
            },
            {
                "q": f"In the context of {topic}, which approach is most effective for learning?",
                "options": [
                    "Practice with varied examples and problems",
                    "Reading without any practice",
                    "Avoiding challenging concepts",
                    "Learning in isolation without connections"
                ],
                "answer": "A"
            }
        ]
        
        try:
            q = random.choice(questions)
            return f"""Q: {q['q']}
A. {q['options'][0]}
B. {q['options'][1]}
C. {q['options'][2]}
D. {q['options'][3]}
Answer: {q['answer']}"""
        except Exception as e:
            logger.error(f"Quiz fallback generation failed: {e}")
            # Return a simple valid quiz format
            return f"""Q: What is an important concept in this subject?
A. Understanding the fundamentals
B. Skipping the basics
C. Ignoring the theory
D. Avoiding practice
Answer: A"""
    
    def get_provider_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all providers."""
        status = {}
        for provider_name in self.providers:
            circuit_breaker = self.circuit_breakers[provider_name]
            
            status[provider_name] = {
                "status": circuit_breaker.status.value,
                "failure_count": circuit_breaker.failure_count,
                "last_failure": circuit_breaker.last_failure_time.isoformat() if circuit_breaker.last_failure_time else None
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
