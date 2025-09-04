import pytest
import os
import sys
from pathlib import Path
from unittest.mock import Mock, patch

# Ensure backend root on sys.path so `import app` resolves when running from repo root
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv(BACKEND_ROOT.parent / '.env')  # load project .env if exists
except Exception:
    pass

from app import create_app


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing."""
    mock_client = Mock()
    mock_response = Mock()
    mock_response.data = []
    mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_response
    mock_client.table.return_value.upsert.return_value.execute.return_value = mock_response
    mock_client.storage.from_.return_value.upload.return_value = None
    mock_client.storage.create_bucket.return_value = None
    
    with patch('app.supabase_client.create_client', return_value=mock_client):
        yield mock_client


@pytest.fixture
def client(mock_supabase):
    """Test client with mocked dependencies."""
    # Set up test environment variables
    os.environ['SUPABASE_URL'] = 'https://test.supabase.co'
    os.environ['SUPABASE_ANON_KEY'] = 'test-anon-key'
    os.environ['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-key'
    
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client
