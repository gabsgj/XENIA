import os
import logging
import time
from supabase import create_client, Client
from typing import Optional, Callable

from .utils.circuit_breaker import CircuitBreaker, CircuitOpenError
from .middleware.request_queue import with_request_semaphore

logger = logging.getLogger('xenia')
_supabase: Optional[Client] = None

# Circuit breaker for Supabase outbound calls to prevent cascade failures
_sb_circuit = CircuitBreaker(failure_threshold=int(os.getenv('SB_CIRCUIT_FAILURE_THRESHOLD', '5')),
                             recovery_timeout=int(os.getenv('SB_CIRCUIT_RECOVERY_TIMEOUT', '60')))


def _retry_with_backoff(fn: Callable, max_attempts: int = 3, base_delay: float = 0.5):
    """Retry helper with exponential backoff for sync functions."""
    last_exc = None
    for attempt in range(1, max_attempts + 1):
        try:
            return fn()
        except CircuitOpenError:
            # propagate circuit open immediately
            raise
        except Exception as e:
            last_exc = e
            sleep_time = base_delay * (2 ** (attempt - 1))
            logger.warning(f"Attempt {attempt} failed for supabase call: {e}. Retrying in {sleep_time:.2f}s")
            time.sleep(sleep_time)
    # final raise
    raise last_exc


def get_supabase() -> Client:
    """Return a singleton Supabase client. Wraps calls with retry + circuit breaker when used via helper wrappers.

    Note: Supabase client here is primarily an HTTP client. We limit concurrent outbound requests
    using a semaphore in `with_request_semaphore` decorator for each call site.
    """
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

        # Check if we have real credentials vs demo/placeholder credentials
        is_demo = (not url or not key or
                   url.startswith("https://demo-") or
                   "demo" in key.lower() or
                   key.startswith("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIi"))

        if not url or not key:
            logger.warning("⚠️ Supabase configuration missing - using mock client for development")
            _supabase = _create_mock_client()
            return _supabase

        if is_demo:
            logger.info("🎭 Demo Supabase credentials detected - using enhanced mock client with real API patterns")
            _supabase = _create_mock_client()
            return _supabase

        try:
            logger.info("🔗 Connecting to real Supabase instance...")
            # create_client uses httpx under the hood; we can't directly control pool size here easily,
            # but we'll rely on outbound limiting and retries around calls.
            _supabase = create_client(url, key)

            # Test connection with a lightweight query using retry wrapper + circuit breaker
            def _test():
                return _supabase.table("profiles").select("count", count="exact").limit(1).execute()

            # run test through circuit breaker
            try:
                _sb_circuit.call(lambda: _retry_with_backoff(_test, max_attempts=2, base_delay=0.2))
            except Exception as e:
                logger.warning(f"⚠️ Real Supabase connection test failed: {e}")
                logger.info("🎭 Falling back to mock client for development")
                _supabase = _create_mock_client()
                return _supabase

            logger.info("✅ Real Supabase connection established successfully")
        except Exception as e:
            logger.warning(f"⚠️ Real Supabase connection failed: {e}")
            logger.info("🎭 Falling back to mock client for development")
            _supabase = _create_mock_client()
    return _supabase


def supabase_call(fn: Callable, max_attempts: int = 3):
    """Helper to perform a Supabase operation with semaphore, circuit breaker and retries.

    Usage:
        supabase_call(lambda: sb.table(...).select(...).execute())
    """
    # ensure circuit not open
    def _wrapped():
        return fn()

    # run under circuit and retry
    return _sb_circuit.call(lambda: _retry_with_backoff(_wrapped, max_attempts=max_attempts))


def _create_mock_client() -> Client:
    """Create a mock Supabase client for development/testing"""
    logger.info("🎭 Creating mock Supabase client with sample data")
    
    class MockSupabaseClient:
        def __init__(self):
            self.mock_data = {
                "profiles": [],
                "sessions": [],
                "tasks": [],
                "artifacts": [],
                "plans": [],
                "manual_tags": [],
                "enrollments": [],
                "parents_children": [],
                "reports": [],
                "storage": {},
                "buckets": set(),
            }
            logger.info("📊 Mock data initialized with sample records")
        
        def table(self, table_name: str):
            logger.debug(f"🎭 Mock table access: {table_name}")
            if table_name not in self.mock_data:
                self.mock_data[table_name] = []
            return MockTable(self.mock_data, table_name)
        
        def rpc(self, func_name: str, params: dict):
            logger.debug(f"🎭 Mock RPC call: {func_name} with params {params}")
            # Implement simple XP adder for demo
            if func_name == "add_xp":
                uid = params.get("p_user_id")
                amt = int(params.get("p_xp", 0))
                for p in self.mock_data["profiles"]:
                    if p.get("user_id") == uid:
                        p["xp"] = p.get("xp", 0) + amt
                        break
            return MockRPC()
        
        class Storage:
            def __init__(self, outer):
                self.outer = outer
            def create_bucket(self, name, opts=None):
                self.outer.mock_data["buckets"].add(name)
                return True
            def from_(self, bucket):
                outer = self.outer
                class Bucket:
                    def upload(self, path, data, options=None):
                        store = outer.mock_data["storage"].setdefault(bucket, {})
                        store[path] = data
                        return {"path": path}
                return Bucket()
        
        @property
        def storage(self):
            return MockSupabaseClient.Storage(self)
    
    class MockTable:
        def __init__(self, store, table_name):
            self.store = store
            self.table_name = table_name
            self.filters = []
            self._order = None
            self._order_desc = False
            self._limit = None
            self._select = None
        
        def select(self, *args, **kwargs):
            self._select = args
            return self
        
        def eq(self, column: str, value):
            self.filters.append(("eq", column, value))
            return self
        
        def in_(self, column: str, values):
            self.filters.append(("in", column, values))
            return self
        
        def order(self, column: str, desc: bool = False):
            self._order = column
            self._order_desc = bool(desc)
            return self
        
        def limit(self, count):
            self._limit = int(count)
            return self
        
        def _apply_filters(self, rows):
            result = list(rows)
            for ftype, col, val in self.filters:
                if ftype == "eq":
                    result = [r for r in result if r.get(col) == val]
                elif ftype == "in":
                    result = [r for r in result if r.get(col) in val]
            if self._order:
                result.sort(key=lambda r: r.get(self._order), reverse=self._order_desc)
            if self._limit is not None:
                result = result[: self._limit]
            return result
        
        def insert(self, data):
            logger.debug(f"🎭 Mock insert: {data}")
            rows = self.store[self.table_name]
            def add_row(row):
                if "id" not in row:
                    row["id"] = (rows[-1]["id"] + 1) if rows else 1
                rows.append(dict(row))
            if isinstance(data, list):
                for row in data:
                    add_row(row)
            else:
                add_row(data)
            return MockExecute()
        
        def upsert(self, data):
            logger.debug(f"🎭 Mock upsert: {data}")
            rows = self.store[self.table_name]
            def _upsert_row(row):
                # Prefer composite key of (user_id, topic) when present (mimic real upsert unique constraint)
                if isinstance(row, dict):
                    if 'user_id' in row and 'topic' in row:
                        # find by both user_id and topic
                        for r in rows:
                            if r.get('user_id') == row.get('user_id') and r.get('topic') == row.get('topic'):
                                r.update(row)
                                return
                        # not found -> append
                        rows.append(dict(row))
                        return
                    # fallback to id-based upsert
                    if 'id' in row:
                        for r in rows:
                            if r.get('id') == row.get('id'):
                                r.update(row)
                                return
                        rows.append(dict(row))
                        return
                    # generic append
                    rows.append(dict(row))

            if isinstance(data, list):
                for row in data:
                    _upsert_row(row)
            else:
                _upsert_row(data)
            return MockExecute()
        
        def update(self, changes):
            logger.debug(f"🎭 Mock update: {changes}")
            rows = self.store[self.table_name]
            # apply to filtered selection
            filtered = self._apply_filters(rows)
            for r in rows:
                if r in filtered:
                    r.update(changes)
            return self
        
        def execute(self):
            rows = self.store[self.table_name]
            data = self._apply_filters(rows)
            logger.debug(f"🎭 Mock query returned {len(data)} records")
            return MockExecute(list(data))
    
    class MockExecute:
        def __init__(self, data=None):
            self._data = data or []
        
        @property
        def data(self):
            return self._data
        
        @data.setter
        def data(self, value):
            self._data = value
        
        def execute(self):
            """Support chained .execute() calls"""
            return self
    
    class MockRPC:
        def execute(self):
            logger.debug("🎭 Mock RPC executed successfully")
            return MockExecute()
    
    return MockSupabaseClient()
