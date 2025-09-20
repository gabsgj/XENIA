import os
import json
from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    print("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables to run this test.")
    exit(1)

sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

user_id = 'integration-test-user'

# Insert a history row
history_row = {
    'user_id': user_id,
    'topic': 'Integration Testing Topic',
    'correct': 1,
    'wrong': 0,
    'score': 1.0,
}
print('Inserting history row...')
resp = sb.table('user_progress_history').insert(history_row).execute()
print('Insert response:', resp)

# Upsert aggregate: try to find existing and update, otherwise insert
existing = sb.table('user_progress').select('*').eq('user_id', user_id).eq('topic', history_row['topic']).limit(1).execute().data
if existing:
    rec = existing[0]
    new_quizzes = int(rec.get('quizzes_taken', 0)) + 1
    new_correct = int(rec.get('correct', 0)) + history_row['correct']
    new_wrong = int(rec.get('wrong', 0)) + history_row['wrong']
    sb.table('user_progress').update({
        'quizzes_taken': new_quizzes,
        'correct': new_correct,
        'wrong': new_wrong,
        'last_score': history_row['score'],
    }).eq('user_id', user_id).eq('topic', history_row['topic']).execute()
    print('Updated aggregate')
else:
    sb.table('user_progress').insert({
        'user_id': user_id,
        'topic': history_row['topic'],
        'quizzes_taken': 1,
        'correct': history_row['correct'],
        'wrong': history_row['wrong'],
        'last_score': history_row['score'],
    }).execute()
    print('Inserted aggregate')

# Read back aggregates
agg = sb.table('user_progress').select('*').eq('user_id', user_id).execute().data
print('Aggregates for user:', agg)

# Read weekly history
history = sb.table('user_progress_history').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(10).execute().data
print('Recent history rows:', history)
