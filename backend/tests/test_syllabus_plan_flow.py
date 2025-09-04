import io
import json
import pytest
from app import create_app

@pytest.fixture
def app_client(monkeypatch):
    app = create_app()
    client = app.test_client()

    # Dummy Supabase behaviour capturing inserts/selects
    class DummyTable:
        def __init__(self, name):
            self.name = name
        def insert(self, rows):
            # store syllabus topics for later select
            if self.name == 'syllabus_topics':
                DummyStore.topics.extend([r['topic'] for r in rows])
            if self.name == 'artifacts':
                DummyStore.artifacts.append(rows)
            class Exec: 
                data = []
                def execute(self_inner): return self_inner
            return Exec()
        def upsert(self, *a, **k):
            class Exec:
                data = []
                def execute(self_inner): return self_inner
            return Exec()
        def select(self, *cols):
            return self
        def eq(self, col, val):
            self._eq = (col,val); return self
        def order(self, *a, **k): return self
        def limit(self, *a, **k): return self
        def execute(self):
            class Resp: pass
            r = Resp()
            if self.name == 'plans':
                r.data = []
            elif self.name == 'syllabus_topics':
                r.data = [{ 'topic': t, 'order_index': i } for i,t in enumerate(DummyStore.topics)]
            else:
                r.data = []
            return r
    class DummyStorage:
        def from_(self, *a, **k): return self
        def upload(self, *a, **k): return None
        def create_bucket(self, *a, **k): return None
    class DummySupabase:
        storage = DummyStorage()
        def table(self, name): return DummyTable(name)
    class DummyStore:
        topics = []
        artifacts = []
    from app import supabase_client as sc
    monkeypatch.setattr(sc, 'get_supabase', lambda: DummySupabase())
    # Avoid external embeddings (speed & determinism)
    from app.services import embeddings
    monkeypatch.setattr(embeddings, 'embed_texts', lambda texts, model=None: [])
    return client, DummyStore


def test_syllabus_upload_generates_plan(app_client):
    client, store = app_client
    # Upload a fake syllabus file
    data = {
        'file': (io.BytesIO(b"Topic: Algebra Basics\nTopic: Geometry Principles\nBullet point about Calculus"), 'syllabus.txt')
    }
    r = client.post('/api/upload/syllabus', content_type='multipart/form-data', data=data, headers={'X-User-Id':'00000000-0000-0000-0000-000000000001'})
    assert r.status_code == 200
    body = r.get_json()
    assert body['ok'] is True
    assert len(body['topics']) >= 2
    # Force plan fetch (should regenerate using stored topics)
    p = client.get('/api/plan/current', headers={'X-User-Id':'00000000-0000-0000-000000000000'})
    assert p.status_code == 200
    plan = p.get_json()
    assert 'sessions' in plan
    # Check at least one session uses a syllabus topic
    session_topics = { s['topic'] for s in plan['sessions'] }
    assert any(t in session_topics for t in body['topics'])
