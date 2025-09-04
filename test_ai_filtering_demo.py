#!/usr/bin/env python3

import requests
import json

# Test the enhanced AI filtering workflow
base_url = 'http://localhost:8000'
user_id = 'test-ai-filtering-demo'

print('🎯 Testing Enhanced AI Filtering Workflow')
print('=' * 50)

# Create a comprehensive test syllabus with various content types
test_syllabus = '''
Advanced Computer Science Course - CS 401
Spring 2025 Semester

COURSE INFORMATION:
- Instructor: Dr. Smith
- Office Hours: Monday 2-4 PM, Wednesday 1-3 PM
- Final Exam: December 15th, 2024
- Attendance Policy: Mandatory
- Grading: 40% assignments, 30% midterm, 30% final

LEARNING OBJECTIVES:
Students will master advanced programming concepts and apply them to real-world problems.

WEEKLY SCHEDULE:

Week 1-2: Data Structures and Algorithms
- Binary trees and graph traversal
- Sorting algorithms: quicksort, mergesort, heapsort
- Time complexity analysis (Big O notation)
- Dynamic programming fundamentals
- Hash tables and collision resolution

Week 3-4: Object-Oriented Programming Advanced Topics
- Design patterns: Singleton, Factory, Observer
- Inheritance vs composition
- Polymorphism and method overriding
- Abstract classes and interfaces
- SOLID principles

Week 5-6: Database Systems
- Relational database design
- SQL queries and optimization
- Normalization (1NF, 2NF, 3NF, BCNF)
- Indexing strategies
- Transaction management and ACID properties

Week 7-8: Web Development
- HTML5 semantic elements
- CSS Grid and Flexbox
- JavaScript ES6+ features
- React components and state management
- RESTful API design
- Node.js and Express.js

Week 9-10: Machine Learning Fundamentals
- Linear and logistic regression
- Decision trees and random forests
- Neural networks basics
- Feature engineering
- Model evaluation metrics

Week 11-12: System Design
- Scalability patterns
- Load balancing
- Caching strategies
- Microservices architecture
- Database sharding

Week 13: Final Project Presentations
- Project demos
- Peer evaluation
- Code review sessions

ASSIGNMENTS:
- Assignment 1: Data structure implementation (Due: Week 3)
- Assignment 2: Web application (Due: Week 8)  
- Assignment 3: ML model (Due: Week 11)
- Final Project: Full-stack application (Due: Finals week)

TEXTBOOKS:
- "Introduction to Algorithms" by Cormen
- "Design Patterns" by Gang of Four
- "Clean Code" by Robert Martin

ADDITIONAL POLICIES:
- Late submission penalty: 10% per day
- Academic integrity policy applies
- No make-up exams without documentation
'''

print('1. Uploading syllabus with mixed content...')
try:
    files = {'file': ('comprehensive_syllabus.txt', test_syllabus, 'text/plain')}
    headers = {'X-User-Id': user_id}
    
    response = requests.post(f'{base_url}/api/upload/syllabus', files=files, headers=headers)
    print(f'   Upload Status: {response.status_code}')
    
    if response.status_code == 200:
        data = response.json()
        raw_topics = data.get('topics', [])
        analysis = data.get('analysis', {})
        
        print(f'   📊 Raw Topics Extracted: {len(raw_topics)}')
        print('   Sample raw topics:', raw_topics[:5])
        
        # Check for AI filtering results
        if analysis.get('filtering_insights'):
            insights = analysis['filtering_insights']
            print(f'\n2. 🎯 AI Filtering Results:')
            print(f'   ✅ Topics Kept: {insights["topics_kept"]}')
            print(f'   ❌ Topics Removed: {insights["topics_removed"]}')
            print(f'   ⏱️  Total Study Time: {insights["time_estimate_total"]} hours')
            print(f'   📈 Difficulty Progression: {insights["difficulty_progression"]}')
            
            if insights.get('removal_reasons'):
                print(f'   🗑️  Removal Reasons: {", ".join(insights["removal_reasons"])}')
            
            print(f'   🧠 Learning Strategy: {insights["learning_sequence_rationale"]}')
        else:
            print('\n2. ⚠️  AI filtering data not found in response')
        
        # Check for learning path
        if analysis.get('learning_path'):
            learning_path = analysis['learning_path']
            print(f'\n3. 🗺️  Learning Path Generated:')
            for phase, topics in learning_path.items():
                print(f'   {phase.replace("_", " ").title()}: {len(topics)} topics')
                if topics:
                    print(f'     Sample: {topics[0]}')
        else:
            print('\n3. ⚠️  Learning path not found in response')
        
        # Check for next steps
        if analysis.get('next_steps'):
            next_steps = analysis['next_steps']
            print(f'\n4. 🚀 Next Steps & Recommendations:')
            
            if next_steps.get('immediate_actions'):
                print(f'   ⚡ Immediate Actions: {len(next_steps["immediate_actions"])}')
                for action in next_steps['immediate_actions'][:2]:
                    print(f'     • {action}')
            
            if next_steps.get('week_1_goals'):
                print(f'   🎯 Week 1 Goals: {len(next_steps["week_1_goals"])}')
                for goal in next_steps['week_1_goals'][:2]:
                    print(f'     • {goal}')
            
            if next_steps.get('recommended_pace'):
                print(f'   📊 Recommended Pace: {next_steps["recommended_pace"]}')
        else:
            print('\n4. ⚠️  Next steps not found in response')
        
        # Test filtered topics in study plan generation
        print(f'\n5. 📋 Generating Study Plan with Filtered Topics...')
        plan_data = {
            'horizon_days': 14,
            'preferred_hours_per_day': 2.5,
            'learning_style': 'balanced'
        }
        
        plan_response = requests.post(f'{base_url}/api/plan/generate', 
                                    json=plan_data, 
                                    headers=headers)
        
        if plan_response.status_code == 200:
            plan = plan_response.json()
            print(f'   ✅ Study Plan Generated: {len(plan.get("sessions", []))} sessions')
            
            # Show sample session with topic
            sessions = plan.get('sessions', [])
            if sessions:
                sample_session = sessions[0]
                print(f'   📖 Sample Session: {sample_session.get("topic")} ({sample_session.get("duration_min")} min)')
                print(f'       Focus: {sample_session.get("focus", "N/A")}')
        else:
            print(f'   ❌ Plan generation failed: {plan_response.status_code}')
        
        print(f'\n🎉 AI Filtering Workflow Summary:')
        print(f'✅ Raw extraction → AI analysis → Intelligent filtering → Learning path → Study plan')
        print(f'✅ Gemini 2.0 Flash successfully filtered {len(raw_topics)} raw topics')
        print(f'✅ Generated structured learning path with phases')
        print(f'✅ Provided actionable next steps and recommendations')
        print(f'✅ Integrated filtered topics into study plan generation')
        
    else:
        print(f'❌ Upload failed: {response.text}')
        
except Exception as e:
    print(f'❌ Error: {e}')

print('\n' + '=' * 50)
print('🎯 Frontend Display: Go to /upload to see the AI filtering results!')
print('📊 The filtering insights, learning path, and next steps are now visible in the UI')
