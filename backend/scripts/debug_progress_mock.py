from app.supabase_client import get_supabase
from app.services.progress import record_quiz_result, get_user_progress

sb = get_supabase()
user_id = 'test-user-1'
# clear
if hasattr(sb, 'mock_data') and isinstance(sb.mock_data, dict):
    sb.mock_data['user_progress'] = [r for r in sb.mock_data.get('user_progress', []) if r.get('user_id') != user_id]
    sb.mock_data['user_progress_history'] = [r for r in sb.mock_data.get('user_progress_history', []) if r.get('user_id') != user_id]
print('before user_progress:', sb.mock_data.get('user_progress'))
print('before history:', sb.mock_data.get('user_progress_history'))

scores = [{'topic':'Algebra','correct':1,'wrong':0,'score':1.0},{'topic':'Calculus','correct':0,'wrong':1,'score':0.0}]
record_quiz_result(user_id, scores)
print('after user_progress:', sb.mock_data.get('user_progress'))
print('after history:', sb.mock_data.get('user_progress_history'))
print('get_user_progress:', get_user_progress(user_id))
