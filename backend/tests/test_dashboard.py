import json
import pytest
from flask import Flask
from app.routes.dashboard import get_dashboard

class FakeTable:
    def __init__(self, data):
        self._data = data
    def select(self, *args, **kwargs):
        return self
    def eq(self, key, val):
        # filter by user_id if provided
        if key == 'user_id':
            self._data = [d for d in self._data if d.get('user_id') == val]
        return self
    def order(self, *args, **kwargs):
        return self
    def limit(self, n):
        return self
    def execute(self):
        class R:
            def __init__(self, data):
                self.data = data
        return R(self._data)

class FakeSupabase:
    def __init__(self, sessions, quizzes, profiles):
        self._sessions = sessions
        self._quizzes = quizzes
        self._profiles = profiles
    def table(self, name):
        if name == 'sessions':
            return FakeTable(list(self._sessions))
        if name == 'quiz_attempts':
            return FakeTable(list(self._quizzes))
        if name == 'profiles':
            return FakeTable(list(self._profiles))
        return FakeTable([])

def test_dashboard_user_isolated(monkeypatch):
    # Seed data for two users
    u1 = 'user_A'
    u2 = 'user_B'
    sessions = [
        {'id': 's1', 'user_id': u1, 'duration_min': 30, 'topic':'Math', 'created_at':'2025-09-24T10:00:00Z', 'status':'completed'},
        {'id': 's2', 'user_id': u2, 'duration_min': 45, 'topic':'Physics', 'created_at':'2025-09-24T11:00:00Z', 'status':'completed'},
    ]
    quizzes = [
        {'id':'q1','user_id':u1,'title':'Polymorphism','score':80,'taken_at':'2025-09-24T12:00:00Z'},
        {'id':'q2','user_id':u2,'title':'Thermo','score':70,'taken_at':'2025-09-24T12:30:00Z'}
    ]
    profiles = [{'user_id': u1, 'xp':100, 'level':1, 'streak_days':2}]

    fake = FakeSupabase(sessions, quizzes, profiles)
    monkeypatch.setattr('app.routes.dashboard.get_supabase', lambda: fake)

    # Call endpoint with user_A header
    from flask import Request
    class FakeRequest:
        headers = {'X-User-Id': u1}
    # monkeypatch request context by calling function directly with header mechanism
    from app.routes import dashboard as dashboard_module
    # Temporary set request headers via flask testing client
    from app import create_app
    app = create_app()
    client = app.test_client()
    resp = client.get('/api/dashboard/', headers={'X-User-Id': u1})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['stats']['totalStudyTimeMin'] == 30
    assert data['stats']['quizzesTaken'] == 1
    # Ensure user B data not present
    assert all(q['title'] != 'Thermo' for q in data['quizzesTakenDetails'])
