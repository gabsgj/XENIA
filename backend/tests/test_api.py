import pytest
from app import create_app


class TestHealthEndpoint:
    def test_health_check(self, client):
        response = client.get('/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'ok'


class TestUploadEndpoints:
    def test_upload_syllabus_no_file(self, client):
        response = client.post('/api/upload/syllabus')
        assert response.status_code == 400
        data = response.get_json()
        assert data['errorCode'] == 'SYLLABUS_INVALID_FORMAT'

    def test_upload_assessment_no_file(self, client):
        response = client.post('/api/upload/assessment')
        assert response.status_code == 400
        data = response.get_json()
        assert data['errorCode'] == 'ASSESSMENT_PARSE_FAIL'


class TestPlanEndpoints:
    def test_generate_plan_no_user_id(self, client):
        response = client.post('/api/plan/generate', json={})
        assert response.status_code == 400
        data = response.get_json()
        assert data['errorCode'] == 'PLAN_400'

    def test_generate_plan_with_user_id(self, client):
        response = client.post('/api/plan/generate', 
                             json={'user_id': 'test-user', 'horizon_days': 7})
        assert response.status_code == 200
        data = response.get_json()
        assert 'sessions' in data
        assert 'weak_topics' in data


class TestTutorEndpoints:
    def test_tutor_no_input(self, client):
        response = client.post('/api/tutor/ask')
        assert response.status_code == 400
        data = response.get_json()
        assert data['errorCode'] == 'TUTOR_TIMEOUT'

    def test_tutor_with_question(self, client):
        response = client.post('/api/tutor/ask', 
                             json={'question': 'How do I solve quadratic equations?', 'user_id': 'test-user'})
        assert response.status_code == 200
        data = response.get_json()
        assert 'steps' in data
