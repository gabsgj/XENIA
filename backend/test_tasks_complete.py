import sys
sys.path.insert(0, 'D:\\GECT\\XENIA\\backend')
from app import create_app
from app.supabase_client import get_supabase
import json
import uuid

app = create_app()

# First, ensure we have a test user in the database
print('Setting up test user...')
sb = get_supabase()
test_user_id = str(uuid.uuid4())

try:
    # Create a test user
    user_data = {
        'id': test_user_id,
        'email': 'test@example.com',
        'name': 'Test User'
    }
    sb.table('users').insert(user_data).execute()
    print(f'✅ Created test user: {test_user_id}')
except Exception as e:
    # User might already exist or table might have different schema
    print(f'Note: Could not create user ({e}). Using existing data...')
    # Try to get an existing user
    result = sb.table('tasks').select('user_id').limit(1).execute()
    if result.data:
        test_user_id = result.data[0]['user_id']
        print(f'Using existing user: {test_user_id}')

with app.test_client() as client:
    # Test 1: Create a task
    print('\nTEST 1: Creating a task...')
    test_data = {
        'user_id': test_user_id,
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
        print(f'   Status: {task.get("status")}')
        
        if task_id:
            # Test 2: Complete the task
            print('\nTEST 2: Completing the task...')
            complete_data = {
                'task_id': task_id,
                'user_id': test_user_id
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
            response = client.get(f'/api/tasks?user_id={test_user_id}')
            if response.status_code == 200:
                tasks = response.get_json().get('tasks', [])
                print(f'✅ Fetched {len(tasks)} tasks')
                for t in tasks[:3]:
                    title = t.get('title', 'No title')
                    status = t.get('status', 'unknown')
                    completed = t.get('completed', False)
                    print(f'   - {title} (Status: {status}, Completed: {completed})')
            else:
                print(f'❌ Failed to fetch tasks')
                
            # Test 4: Update task
            print('\nTEST 4: Updating task...')
            update_data = {
                'user_id': test_user_id,
                'title': 'Updated Task Title',
                'status': 'in-progress'
            }
            response = client.put(f'/api/tasks/{task_id}',
                                data=json.dumps(update_data),
                                content_type='application/json')
            if response.status_code == 200:
                updated_task = response.get_json().get('task', {})
                print('✅ Task update successful!')
                print(f'   New title: {updated_task.get("title")}')
                print(f'   New status: {updated_task.get("status")}')
            else:
                print(f'❌ Task update failed: {response.get_json()}')
    else:
        print(f'❌ Task creation failed:')
        print(f'   Status: {response.status_code}')
        error = response.get_json()
        print(f'   Error: {error}')
        
        # Additional debug info
        if 'foreign key' in str(error):
            print('\nDebug: Foreign key constraint issue detected.')
            print('This means the user_id doesn\'t exist in the users table.')
            print(f'Attempted user_id: {test_user_id}')