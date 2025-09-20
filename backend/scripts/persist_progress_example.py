import os
import json
import requests
from app.services.progress import record_quiz_result, get_user_progress

user_id = 'integration-test-user'
topic_scores = [
    {"topic": "Integration Topic", "correct": 1, "wrong": 0, "score": 1.0}
]

print('Recording quiz result via service...')
record_quiz_result(user_id, topic_scores)
print('Local readback of progress:')
print(get_user_progress(user_id))
