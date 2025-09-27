"""Middleware utilities to limit concurrent outbound requests and queue them.

This uses an asyncio-compatible semaphore for async contexts and a threading.Semaphore
for sync contexts. It exposes a decorator `with_request_semaphore` to wrap functions
that perform external requests (e.g., Supabase HTTP calls).
"""
import asyncio
import threading
import time
from functools import wraps
from typing import Callable

# Concurrent request limiting disabled - set to very high value
DEFAULT_MAX_CONCURRENT = 10000

# Semaphore for sync code
_sync_semaphore = threading.BoundedSemaphore(DEFAULT_MAX_CONCURRENT)

# Semaphore for async code
_async_semaphore = asyncio.Semaphore(DEFAULT_MAX_CONCURRENT)


def with_request_semaphore(func: Callable):
    """Decorator for sync functions - rate limiting disabled."""

    @wraps(func)
    def wrapper(*args, **kwargs):
        # Rate limiting disabled - directly call function
        return func(*args, **kwargs)

    return wrapper


def async_with_request_semaphore(func: Callable):
    """Decorator for async functions - rate limiting disabled."""

    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Rate limiting disabled - directly call function
        return await func(*args, **kwargs)

    return wrapper
