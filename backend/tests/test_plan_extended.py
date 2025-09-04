import json
from app import create_app


class TestPlanExtended:
    def test_generate_plan_with_hours(self, client):
        resp = client.post('/api/plan/generate', json={
            'user_id':'00000000-0000-0000-0000-000000000000',
            'horizon_days':14,
            'preferred_hours_per_day':2.0
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['preferred_hours_per_day'] == 2.0
        assert 'sessions' in data


    def test_topic_status_update(self, client):
        r = client.post('/api/resources/topics/status', json={
            'user_id':'00000000-0000-0000-0000-000000000000',
            'topic':'Algebra','status':'completed'
        })
        assert r.status_code == 200
        data = r.get_json()
        assert data['ok'] is True
