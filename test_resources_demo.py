#!/usr/bin/env python3

import requests
import json

# Test uploading a simple syllabus and generating resources
base_url = 'http://localhost:8000'
user_id = 'test-resource-demo'

print('Testing syllabus upload and resource generation...')

# Create a simple test syllabus
test_syllabus = '''
Advanced Web Development Course

Week 1-2: React Programming
- Component lifecycle
- State management
- Hooks and context

Week 3-4: Node.js Backend
- Express.js framework
- Database integration
- API development

Week 5-6: Machine Learning Basics
- Linear regression
- Neural networks
- Data preprocessing

Final Project: Build a full-stack application
'''

# Upload syllabus
try:
    files = {'file': ('test_syllabus.txt', test_syllabus, 'text/plain')}
    headers = {'X-User-Id': user_id}
    
    response = requests.post(f'{base_url}/api/upload/syllabus', files=files, headers=headers)
    print(f'Upload status: {response.status_code}')
    
    if response.status_code == 200:
        data = response.json()
        print(f'Extracted topics: {len(data.get("analysis", {}).get("topics", []))}')
        
        # Generate a study plan
        plan_data = {
            'horizon_days': 7,
            'preferred_hours_per_day': 2.0,
            'learning_style': 'visual'
        }
        
        plan_response = requests.post(f'{base_url}/api/plan/generate', 
                                    json=plan_data, 
                                    headers=headers)
        
        print(f'Plan generation: {plan_response.status_code}')
        
        if plan_response.status_code == 200:
            plan = plan_response.json()
            print(f'Generated {len(plan.get("sessions", []))} study sessions')
            
            # Now check for resources
            resource_response = requests.get(f'{base_url}/api/resources/list', headers=headers)
            print(f'Resources list: {resource_response.status_code}')
            
            if resource_response.status_code == 200:
                resources = resource_response.json().get('resources', [])
                print(f'Available resources: {len(resources)}')
                
                # Test topic-specific resources
                for topic in ['React Programming', 'Machine Learning', 'Node.js']:
                    try:
                        topic_resp = requests.get(f'{base_url}/api/plan/resources/{topic}?learning_style=visual', headers=headers)
                        if topic_resp.status_code == 200:
                            topic_res = topic_resp.json().get('resources', {})
                            total_topic_resources = sum(len(v) if isinstance(v, list) else 0 for v in topic_res.values())
                            print(f'{topic}: {total_topic_resources} resources')
                            
                            # Show sample resource
                            for category, items in topic_res.items():
                                if isinstance(items, list) and items:
                                    sample = items[0]
                                    print(f'  Sample {category}: {sample.get("title", "No title")}')
                                    if 'url' in sample:
                                        print(f'    URL: {sample["url"]}')
                                    break
                    except Exception as e:
                        print(f'Error fetching resources for {topic}: {e}')
            else:
                print(f'Failed to get resources: {resource_response.text}')
        else:
            print(f'Plan generation failed: {plan_response.text}')
    else:
        print(f'Upload failed: {response.text}')
        
except Exception as e:
    print(f'Error: {e}')

print('\n🎯 Resource Integration Summary:')
print('1. Upload syllabus → AI extracts topics')
print('2. Generate study plan → AI creates sessions')  
print('3. Fetch resources → AI finds YouTube videos, articles, etc.')
print('4. Display in frontend → Resources appear in planner and upload pages')
