import os
from supabase import create_client, Client
from typing import Optional

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
            # Return a mock client that won't actually connect
            return _create_mock_client()
        
        try:
            _supabase = create_client(url, key)
            # Test the connection
            _supabase.table("profiles").select("count", count="exact").limit(1).execute()
        except Exception as e:
            print(f"Warning: Supabase connection failed: {e}")
            _mock_mode = True
            return _create_mock_client()
    
    return _supabase


def _create_mock_client() -> Client:
    """Create a mock Supabase client for development/testing"""
    class MockSupabaseClient:
        def __init__(self):
            self.mock_data = {
                "profiles": [
                    {"user_id": "demo-user", "xp": 1250, "level": 5, "streak_days": 7}
                ],
                "sessions": [
                    {"user_id": "demo-user", "duration_min": 45, "topic": "Mathematics", "created_at": "2024-01-15T10:00:00Z"},
                    {"user_id": "demo-user", "duration_min": 30, "topic": "Physics", "created_at": "2024-01-14T14:30:00Z"},
                    {"user_id": "demo-user", "duration_min": 60, "topic": "Chemistry", "created_at": "2024-01-13T09:15:00Z"}
                ],
                "tasks": [
                    {"user_id": "demo-user", "status": "done", "topic": "Calculus", "created_at": "2024-01-15T08:00:00Z"},
                    {"user_id": "demo-user", "status": "done", "topic": "Algebra", "created_at": "2024-01-14T16:00:00Z"},
                    {"user_id": "demo-user", "status": "pending", "topic": "Trigonometry", "created_at": "2024-01-13T10:00:00Z"}
                ],
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
                ]
            }
        
        def table(self, table_name: str):
            return MockTable(self.mock_data.get(table_name, []))
        
        def rpc(self, func_name: str, params: dict):
            return MockRPC()
    
    class MockTable:
        def __init__(self, data):
            self.data = data
            self.filters = []
        
        def select(self, *args, **kwargs):
            return self
        
        def eq(self, column: str, value):
            self.filters.append(("eq", column, value))
            return self
        
        def in_(self, column: str, values):
            self.filters.append(("in", column, values))
            return self
        
        def limit(self, count):
            return self
        
        def insert(self, data):
            return MockExecute()
        
        def update(self, data):
            return self
        
        def execute(self):
            # Apply filters to mock data
            filtered_data = self.data.copy()
            for filter_type, column, value in self.filters:
                if filter_type == "eq":
                    filtered_data = [item for item in filtered_data if item.get(column) == value]
                elif filter_type == "in":
                    filtered_data = [item for item in filtered_data if item.get(column) in value]
            
            return MockExecute(filtered_data)
    
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
            return MockExecute()
    
    return MockSupabaseClient()
