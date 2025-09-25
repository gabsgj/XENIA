import time
import threading
from typing import Callable, Optional


class CircuitOpenError(Exception):
    pass


class CircuitBreaker:
    """Simple thread-safe circuit breaker.

    - failure_threshold: number of consecutive failures to open the circuit
    - recovery_timeout: seconds to wait before attempting half-open
    - half_open_successes: number of consecutive successes required to close
    """

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60, half_open_successes: int = 2):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_successes = half_open_successes

        self._lock = threading.Lock()
        self._failure_count = 0
        self._state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self._opened_at: Optional[float] = None
        self._half_open_success_count = 0

    def _now(self) -> float:
        return time.time()

    def call(self, func: Callable, *args, **kwargs):
        with self._lock:
            if self._state == "OPEN":
                # If timeout elapsed, move to HALF_OPEN
                if self._opened_at and (self._now() - self._opened_at) > self.recovery_timeout:
                    self._state = "HALF_OPEN"
                    self._half_open_success_count = 0
                else:
                    raise CircuitOpenError("Circuit is open")

        try:
            result = func(*args, **kwargs)
        except Exception as e:
            with self._lock:
                self._failure_count += 1
                if self._state == "HALF_OPEN":
                    # failure during half-open re-opens
                    self._state = "OPEN"
                    self._opened_at = self._now()
                    self._failure_count = 0
                elif self._failure_count >= self.failure_threshold:
                    self._state = "OPEN"
                    self._opened_at = self._now()
                    self._failure_count = 0
            raise
        else:
            with self._lock:
                if self._state == "HALF_OPEN":
                    self._half_open_success_count += 1
                    if self._half_open_success_count >= self.half_open_successes:
                        self._state = "CLOSED"
                        self._failure_count = 0
                        self._opened_at = None
                else:
                    # success resets failure count
                    self._failure_count = 0
            return result

    def force_open(self):
        with self._lock:
            self._state = "OPEN"
            self._opened_at = self._now()

    def force_close(self):
        with self._lock:
            self._state = "CLOSED"
            self._failure_count = 0
            self._opened_at = None
