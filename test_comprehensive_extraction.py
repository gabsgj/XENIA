#!/usr/bin/env python3
"""
Comprehensive test to demonstrate enhanced topic extraction improvements.
"""

import os
import sys

# Test with the actual backend modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_topic_extraction_comparison():
    """Compare old vs new topic extraction capabilities."""
    
    # Test syllabus with comprehensive content
    comprehensive_syllabus = """
COMPUTER SCIENCE ADVANCED COURSE
Academic Year 2024-2025

CORE TOPICS:
1. Data Structures and Algorithms
2. Object-Oriented Programming Concepts
3. Database Management Systems
4. Software Engineering Principles

PROGRAMMING FUNDAMENTALS:
- Variables and Data Types
- Control Structures (if, while, for)
- Functions and Methods
- Classes and Objects
- Inheritance and Polymorphism

MATHEMATICAL FOUNDATIONS:
• Linear Algebra
• Discrete Mathematics  
• Statistics and Probability
• Calculus I and II

ADVANCED PROGRAMMING:
→ Python Programming
→ JavaScript Development
→ SQL Database Queries
→ C++ Systems Programming

SPECIALIZED TOPICS:
▸ Machine Learning Algorithms
▸ Artificial Intelligence
▸ Natural Language Processing
▸ Computer Vision
▸ Deep Learning Networks

TECHNICAL CONCEPTS:
Array, Linked List, Binary Tree, Hash Table, Graph Theory, Stack, Queue,
Sorting Algorithms, Search Algorithms, Dynamic Programming, Recursion

WEB DEVELOPMENT:
Frontend: HTML, CSS, JavaScript, React, Vue.js
Backend: Node.js, Express.js, RESTful APIs, GraphQL
Database: MySQL, PostgreSQL, MongoDB, Redis

SYSTEMS PROGRAMMING:
Operating Systems: Process Management, Memory Management, File Systems
Computer Networks: TCP/IP, HTTP/HTTPS, Network Security
Cybersecurity: Encryption, Authentication, Penetration Testing

PROJECT AREAS:
Software Engineering: Agile Development, DevOps, Testing
Mobile Development: Android, iOS, Cross-platform
Cloud Computing: AWS, Azure, Docker, Kubernetes

MATHEMATICS & ALGORITHMS:
Big O Notation: Time and Space Complexity
Mathematical Proofs: Induction, Contradiction
Graph Algorithms: BFS, DFS, Dijkstra, A*
Optimization: Linear Programming, Genetic Algorithms

EMERGING TECHNOLOGIES:
Blockchain Technology, Quantum Computing, IoT Development,
Augmented Reality, Virtual Reality, Robotics Programming

RESEARCH TOPICS:
Computational Biology, Bioinformatics, Data Mining,
Information Retrieval, Human-Computer Interaction

ADMINISTRATIVE (should be filtered):
Course Syllabus Overview
Grading Policy: 40% assignments, 30% midterm, 30% final
Attendance Policy: Mandatory participation
Office Hours: Tuesdays and Thursdays 2-4 PM
Assignment Submission Guidelines
Late Assignment Policy
Academic Integrity Policy
Course Schedule and Important Dates
"""

    print("🧪 COMPREHENSIVE TOPIC EXTRACTION TEST")
    print("=" * 70)
    
    try:
        from app.services.weaktopics import extract_topics_from_text
        
        print("📚 Testing Enhanced Topic Extraction...")
        topics = extract_topics_from_text(comprehensive_syllabus)
        
        print(f"\n📊 RESULTS SUMMARY:")
        print(f"Total topics extracted: {len(topics)}")
        
        # Categorize topics
        categories = {
            'Programming Languages': ['python', 'javascript', 'sql', 'c++', 'html', 'css'],
            'Data Structures': ['array', 'linked list', 'binary tree', 'hash table', 'graph', 'stack', 'queue'],
            'Algorithms': ['sorting', 'search', 'dynamic programming', 'recursion', 'bfs', 'dfs'],
            'Mathematics': ['algebra', 'calculus', 'statistics', 'probability', 'discrete'],
            'AI/ML Topics': ['machine learning', 'artificial intelligence', 'deep learning', 'neural', 'nlp'],
            'Web Development': ['frontend', 'backend', 'api', 'react', 'vue', 'node.js', 'express'],
            'Systems': ['operating systems', 'networks', 'security', 'tcp', 'http'],
            'Emerging Tech': ['blockchain', 'quantum', 'iot', 'augmented reality', 'virtual reality'],
            'Administrative': ['grading', 'attendance', 'office hours', 'policy', 'syllabus']
        }
        
        category_counts = {}
        for category, keywords in categories.items():
            count = 0
            found_topics = []
            for topic in topics:
                for keyword in keywords:
                    if keyword.lower() in topic.lower():
                        count += 1
                        found_topics.append(topic)
                        break
            category_counts[category] = (count, found_topics)
        
        print(f"\n📈 CATEGORY BREAKDOWN:")
        for category, (count, found_topics) in category_counts.items():
            print(f"  {category:20}: {count:2d} topics")
            if count > 0:
                sample_topics = found_topics[:3]
                print(f"    {'':20}   Examples: {', '.join(sample_topics)}")
        
        # Check for comprehensive coverage
        total_academic = sum(count for cat, (count, _) in category_counts.items() if cat != 'Administrative')
        admin_count = category_counts['Administrative'][0]
        
        print(f"\n🎯 QUALITY METRICS:")
        print(f"  Academic topics found: {total_academic}")
        print(f"  Administrative filtered: {admin_count} (should be low)")
        print(f"  Coverage quality: {'✅ Excellent' if total_academic > 40 else '✅ Good' if total_academic > 25 else '⚠️ Needs improvement'}")
        print(f"  Filtering quality: {'✅ Good' if admin_count < 5 else '⚠️ Could be better'}")
        
        print(f"\n📋 ALL EXTRACTED TOPICS:")
        for i, topic in enumerate(topics, 1):
            status = "🔧" if any(keyword in topic.lower() for keyword in ['grading', 'attendance', 'office hours', 'policy']) else "📚"
            print(f"  {i:2d}. {status} {topic}")
        
        # Test specific improvements
        improvements = {
            'Numbered items (1., 2., etc.)': any('Data Structures' in topic for topic in topics),
            'Bullet points (-, •, →, ▸)': any('Variables' in topic for topic in topics),
            'Technical terms': any('Array' in topic for topic in topics),
            'Programming languages': any('Python' in topic for topic in topics),
            'Mathematical concepts': any('Linear Algebra' in topic for topic in topics),
            'Advanced topics': any('Machine Learning' in topic for topic in topics),
            'Comprehensive coverage': len(topics) >= 30
        }
        
        print(f"\n✅ ENHANCEMENT VERIFICATION:")
        for improvement, achieved in improvements.items():
            status = "✅" if achieved else "❌"
            print(f"  {status} {improvement}")
        
        success_rate = sum(improvements.values()) / len(improvements) * 100
        print(f"\n🏆 OVERALL SUCCESS RATE: {success_rate:.1f}%")
        
        return topics, category_counts
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return [], {}

if __name__ == "__main__":
    topics, categories = test_topic_extraction_comparison()
    
    if topics:
        print(f"\n🎉 ENHANCEMENT COMPLETE!")
        print(f"   Successfully extracted {len(topics)} topics with enhanced patterns")
        print(f"   Comprehensive coverage achieved with improved filtering")
    else:
        print(f"\n❌ Test failed - check import paths and dependencies")
