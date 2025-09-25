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

DEFAULT_MAX_CONCURRENT = int(__import__('os').getenv('MAX_CONCURRENT_REQUESTS', '50'))

# Semaphore for sync code
_sync_semaphore = threading.BoundedSemaphore(DEFAULT_MAX_CONCURRENT)

# Semaphore for async code
_async_semaphore = asyncio.Semaphore(DEFAULT_MAX_CONCURRENT)


def with_request_semaphore(func: Callable):
    """Decorator for sync functions to limit concurrent execution."""

    @wraps(func)
    def wrapper(*args, **kwargs):
        acquired = _sync_semaphore.acquire(timeout=30)
        if not acquired:
            raise RuntimeError("Request queue timeout - too many concurrent requests")
        try:
            return func(*args, **kwargs)
        finally:
            try:
                _sync_semaphore.release()
            except Exception:
                pass

    return wrapper


def async_with_request_semaphore(func: Callable):
    """Decorator for async functions to limit concurrent execution."""

    @wraps(func)
    async def wrapper(*args, **kwargs):
        async with _async_semaphore:
            return await func(*args, **kwargs)

    return wrapper
