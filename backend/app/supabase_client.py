import os
import logging
from supabase import create_client, Client
from typing import Optional

logger = logging.getLogger('xenia')
_supabase: Optional[Client] = None
_mock_mode: bool = False


def get_supabase() -> Client:
    global _supabase, _mock_mode
    
    if _supabase is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
            "SUPABASE_ANON_KEY", ""
        )
        
        # Check if we're in mock mode or if Supabase config is missing
        if os.getenv("AI_MOCK", "false").lower() == "true" or not url or not key:
            _mock_mode = True
            logger.info("🔧 Using MOCK Supabase client (AI_MOCK=true or missing config)")
            # Return a mock client that won't actually connect
            return _create_mock_client()
        
        try:
            logger.info("🔗 Attempting to connect to real Supabase...")
            _supabase = create_client(url, key)
            # Test the connection
            _supabase.table("profiles").select("count", count="exact").limit(1).execute()
            logger.info("✅ Successfully connected to Supabase")
        except Exception as e:
            logger.warning(f"❌ Supabase connection failed: {e}")
            logger.info("🔧 Falling back to MOCK Supabase client")
            _mock_mode = True
            return _create_mock_client()
    
    return _supabase


def _create_mock_client() -> Client:
    """Create a mock Supabase client for development/testing"""
    logger.info("🎭 Creating mock Supabase client with sample data")
    
    class MockSupabaseClient:
        def __init__(self):
            self.mock_data = {
                "profiles": [
                    {"user_id": "demo-user", "xp": 1250, "level": 5, "streak_days": 7}
                ],
                "sessions": [
                    {"id": 1, "user_id": "demo-user", "duration_min": 45, "topic": "Mathematics", "created_at": "2024-01-15T10:00:00Z"},
                    {"id": 2, "user_id": "demo-user", "duration_min": 30, "topic": "Physics", "created_at": "2024-01-14T14:30:00Z"},
                    {"id": 3, "user_id": "demo-user", "duration_min": 60, "topic": "Chemistry", "created_at": "2024-01-13T09:15:00Z"}
                ],
                "tasks": [
                    {"id": 1, "user_id": "demo-user", "status": "done", "topic": "Calculus", "created_at": "2024-01-15T08:00:00Z"},
                    {"id": 2, "user_id": "demo-user", "status": "done", "topic": "Algebra", "created_at": "2024-01-14T16:00:00Z"},
                    {"id": 3, "user_id": "demo-user", "status": "pending", "topic": "Trigonometry", "created_at": "2024-01-13T10:00:00Z"}
                ],
                "artifacts": [],
                "plans": [],
                "manual_tags": [],
                "enrollments": [
                    {"user_id": "student1", "class_id": "class1"},
                    {"user_id": "student2", "class_id": "class1"}
                ],
                "parents_children": [
                    {"parent_user_id": "parent1", "child_user_id": "child1"},
                    {"parent_user_id": "parent1", "child_user_id": "child2"}
                ],
                "reports": [
                    {"class_id": "class1", "report_data": "Sample report data"}
                ],
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
            key = None
            if isinstance(data, dict):
                if "user_id" in data:
                    key = ("user_id", data["user_id"])
                elif "id" in data:
                    key = ("id", data["id"])
                else:
                    rows.append(dict(data))
                    return MockExecute()
                # find existing
                found = False
                for r in rows:
                    if r.get(key[0]) == key[1]:
                        r.update(data)
                        found = True
                        break
                if not found:
                    rows.append(dict(data))
            else:
                # list of rows
                for row in data:
                    self.upsert(row)
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
            self.data = data or []
        
        @property
        def data(self):
            return self._data
        
        @data.setter
        def data(self, value):
            self._data = value
    
    class MockRPC:
        def execute(self):
            logger.debug("🎭 Mock RPC executed successfully")
            return MockExecute()
    
    return MockSupabaseClient()
