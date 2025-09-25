import sys
sys.path.append(r'd:\XENIA\backend')
from app import create_app
app = create_app()
print('App created, config keys present:', 'SUPABASE_URL' in app.config)
with app.test_client() as c:
    rv = c.get('/health')
    print('Health status code:', rv.status_code)
    print('Health json:', rv.get_json())
