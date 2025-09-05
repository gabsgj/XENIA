#!/usr/bin/env python3
"""
Test the upload endpoint with enhanced topic extraction.
"""

import requests
import io

def test_syllabus_upload():
    """Test syllabus upload with enhanced topic extraction."""
    
    # Sample syllabus content for testing
    test_syllabus_content = """
Advanced Computer Science Curriculum

Core Topics:
1. Data Structures and Algorithms
2. Object-Oriented Programming
3. Database Systems

Programming Fundamentals:
- Variables and Data Types
- Control Structures
- Functions and Methods
- Classes and Objects

Mathematical Foundations:
• Linear Algebra
• Discrete Mathematics
• Statistics and Probability
• Calculus

Advanced Topics:
→ Machine Learning
→ Artificial Intelligence
→ Natural Language Processing
→ Computer Vision

Technical Concepts:
Array, Linked List, Binary Tree, Hash Table, Graph,
Sorting Algorithms, Search Algorithms, Dynamic Programming

Web Development:
Frontend: HTML, CSS, JavaScript, React
Backend: Node.js, Express.js, API Development
Database: SQL, NoSQL, MongoDB, PostgreSQL

Systems Programming:
Operating Systems, Computer Networks, Security,
TCP/IP, HTTP/HTTPS, Encryption, Authentication

Project Areas:
Software Engineering, Mobile Development, Cloud Computing,
DevOps, Testing, Agile Development

Administrative Content (should be filtered):
Course Syllabus Overview
Grading Policy: 30% assignments, 70% exams
Attendance Policy: Mandatory
Office Hours: Tuesdays 2-4 PM
"""

    print("🧪 Testing Enhanced Topic Extraction via Upload Endpoint")
    print("=" * 60)
    
    # Create a test file
    file_data = test_syllabus_content.encode('utf-8')
    
    # Test the upload endpoint (assuming it's running locally)
    url = "http://localhost:5000/api/upload/syllabus"
    
    try:
        files = {'file': ('test_syllabus.txt', io.BytesIO(file_data), 'text/plain')}
        headers = {'X-User-Id': '00000000-0000-0000-0000-000000000001'}
        
        print(f"📤 Uploading test syllabus to {url}...")
        response = requests.post(url, files=files, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Upload successful!")
            
            topics = data.get('topics', [])
            analysis = data.get('analysis', {})
            
            print(f"\n📊 Results:")
            print(f"  Topics extracted: {len(topics)}")
            print(f"  Characters processed: {data.get('chars', 0)}")
            
            if topics:
                print(f"\n📚 Extracted Topics ({len(topics)}):")
                for i, topic in enumerate(topics[:20], 1):  # Show first 20
                    print(f"  {i:2d}. {topic}")
                
                if len(topics) > 20:
                    print(f"  ... and {len(topics) - 20} more topics")
            
            # Check for enhanced analysis
            if 'filtered_topics' in analysis:
                filtered_topics = analysis['filtered_topics']
                print(f"\n🎯 AI Filtered Topics: {len(filtered_topics)}")
                
                for topic_data in filtered_topics[:10]:
                    if isinstance(topic_data, dict):
                        topic_name = topic_data.get('topic', 'Unknown')
                        category = topic_data.get('category', 'general')
                        priority = topic_data.get('priority', 'medium')
                        print(f"  • {topic_name} ({category}, {priority})")
            
            # Check learning path
            if 'learning_path' in analysis:
                learning_path = analysis['learning_path']
                print(f"\n📚 Learning Path Structure:")
                for phase, phase_topics in learning_path.items():
                    if isinstance(phase_topics, list):
                        print(f"  {phase}: {len(phase_topics)} topics")
            
            return True
            
        else:
            print(f"❌ Upload failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - backend server may not be running")
        print("💡 Start the backend with: python backend/run.py")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_syllabus_upload()
    
    if success:
        print(f"\n🎉 Enhanced topic extraction test completed successfully!")
    else:
        print(f"\n⚠️ Test could not complete - check if backend server is running")
        print(f"   To start the backend: cd backend && python run.py")
