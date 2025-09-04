#!/usr/bin/env python3
"""Test script to verify upload and AI functionality"""

import requests
import json
import os
from io import BytesIO

def test_upload():
    """Test syllabus upload"""
    print("🧪 Testing syllabus upload...")
    
    # Create test syllabus content
    syllabus_content = """
    Course Syllabus: Advanced Mathematics
    
    Topic 1: Calculus
    Topic 2: Linear Algebra
    Topic 3: Differential Equations
    Topic 4: Statistics
    Topic 5: Probability Theory
    """
    
    # Convert to bytes
    file_data = BytesIO(syllabus_content.encode('utf-8'))
    
    # Test upload endpoint
    files = {
        'file': ('test_syllabus.txt', file_data, 'text/plain')
    }
    data = {
        'user_id': 'demo-user',
        'artifact_type': 'syllabus'
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/api/upload/syllabus',
            files=files,
            data=data,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Upload successful!")
            print(f"Topics extracted: {result.get('topics', [])}")
            print(f"Plan preview: {result.get('plan_preview', {})}")
        else:
            print(f"❌ Upload failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_tutor():
    """Test AI tutor"""
    print("\n🧪 Testing AI tutor...")
    
    payload = {
        "question": "Solve for x: 2x + 5 = 15",
        "user_id": "demo-user"
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/api/tutor/ask',
            json=payload,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Tutor response received!")
            print(f"Steps: {len(result.get('steps', []))} steps provided")
        else:
            print(f"❌ Tutor failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_plan():
    """Test plan generation"""
    print("\n🧪 Testing plan generation...")
    
    try:
        response = requests.get(
            'http://localhost:8000/api/plan/current?user_id=demo-user',
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_upload()
    test_tutor()
    test_plan()
