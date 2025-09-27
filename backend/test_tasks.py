import sys
sys.path.insert(0, 'D:\\GECT\\XENIA\\backend')
from app import create_app
app = create_app()

with app.test_client() as client:
    import json
    
    # Test 1: Create a task
    print('TEST 1: Creating a task...')
    test_data = {
        'user_id': 'test-user-123',
        'title': 'Complete Math Homework',
        'subject': 'Mathematics',
        'due_date': '2024-12-30',
        'duration_minutes': 45,
        'priority': 'High'
    }
    
    response = client.post('/api/tasks',
                          data=json.dumps(test_data),
                          content_type='application/json')
    
    if response.status_code == 200:
        print('✅ Task creation successful!')
        task = response.get_json().get('task', {})
        task_id = task.get('id')
        print(f'   Created task ID: {task_id}')
        print(f'   Title: {task.get("title")}')
        
        if task_id:
            # Test 2: Complete the task
            print('\nTEST 2: Completing the task...')
            complete_data = {
                'task_id': task_id,
                'user_id': 'test-user-123'
            }
            response = client.post('/api/tasks/complete',
                                  data=json.dumps(complete_data),
                                  content_type='application/json')
            if response.status_code == 200:
                print('✅ Task completion successful!')
            else:
                print(f'❌ Task completion failed: {response.get_json()}')
                
            # Test 3: Get all tasks
            print('\nTEST 3: Fetching all tasks...')
            response = client.get('/api/tasks?user_id=test-user-123')
            if response.status_code == 200:
                tasks = response.get_json().get('tasks', [])
                print(f'✅ Fetched {len(tasks)} tasks')
                for t in tasks[:3]:
                    title = t.get('title', 'No title')
                    status = t.get('status', 'unknown')
                    print(f'   - {title} (Status: {status})')
            else:
                print(f'❌ Failed to fetch tasks')
    else:
        print(f'❌ Task creation failed:')
        print(f'   Status: {response.status_code}')
        print(f'   Error: {response.get_json()}')