import json
from app import create_app

def test_generate_plan_with_hours(monkeypatch):
    app = create_app()
    client = app.test_client()

    # Monkeypatch Supabase client minimal methods if needed
    from app import supabase_client as sc
    def fake_get_supabase():
        class Dummy:
            def table(self, *a, **k):
                class T:
                    def upsert(self, *a, **k):
                        class E: 
                            def execute(self): return type('R',(),{'data':[]})()
                        return E()
                    def select(self, *a, **k):
                        return self
                    def eq(self, *a, **k):
                        return self
                    def limit(self, *a, **k):
                        return self
                    def execute(self):
                        return type('R',(),{'data':[]})()
                return T()
        return Dummy()
    monkeypatch.setattr(sc, 'get_supabase', fake_get_supabase)

    resp = client.post('/api/plan/generate', json={
        'user_id':'00000000-0000-0000-0000-000000000000',
        'horizon_days':14,
        'preferred_hours_per_day':2.0
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['preferred_hours_per_day'] == 2.0
    assert 'sessions' in data


def test_topic_status_update(monkeypatch):
    app = create_app()
    client = app.test_client()
    from app import supabase_client as sc
    updated = {}
    class DummyTable:
        def __init__(self): pass
        def update(self, vals):
            updated.update(vals);return self
        def eq(self, *a, **k): return self
        def execute(self): return type('R',(),{'data':[]})()
    class Dummy:
        def table(self, name): return DummyTable()
    monkeypatch.setattr(sc, 'get_supabase', lambda: Dummy())
    r = client.post('/api/resources/topics/status', json={
        'user_id':'00000000-0000-0000-0000-000000000000',
        'topic':'Algebra','status':'completed'
    })
    assert r.status_code == 200
    assert updated['status']=='completed'
