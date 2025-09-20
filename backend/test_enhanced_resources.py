#!/usr/bin/env python3
"""Test script for enhanced topic-specific resource system."""

from app.services.resources import fetch_resources_for_topic
from app.routes.resources import _determine_topic_category

def test_enhanced_resources():
    # Test with a syllabus topic
    topic = 'linear algebra'
    category = _determine_topic_category(topic)
    topic_metadata = {
        'difficulty_score': 7,
        'category': category,
        'learning_style': 'visual'
    }

    print(f'Testing enhanced resource system for: {topic}')
    print(f'Category: {category}')
    print()

    resources = fetch_resources_for_topic(
        topic=topic,
        learning_style='visual',
        topic_metadata=topic_metadata
    )

    print(f'Total resources found: {len(resources)}')
    print()

    # Group by source
    sources = {}
    for r in resources:
        source = r.get('source', 'unknown')
        if source not in sources:
            sources[source] = []
        sources[source].append(r)

    print('Resources by source:')
    for source, res_list in sources.items():
        print(f'  {source}: {len(res_list)} resources')
        if res_list:
            print(f'    Example: {res_list[0]["title"]}')
    print()

    # Check for topic-specific resources
    topic_specific = [r for r in resources if r.get('source') == 'topic_specific']
    if topic_specific:
        print('✅ Topic-specific resources found!')
        for i, r in enumerate(topic_specific[:3]):
            print(f'  {i+1}. {r["title"]} - {r.get("metadata", {}).get("description", "")}')
    else:
        print('❌ No topic-specific resources found')

    # Test another topic
    print('\n' + '='*50)
    topic2 = 'machine learning'
    category2 = _determine_topic_category(topic2)
    print(f'Testing with: {topic2} (category: {category2})')

    resources2 = fetch_resources_for_topic(topic2, topic_metadata={'category': category2})
    topic_specific2 = [r for r in resources2 if r.get('source') == 'topic_specific']

    if topic_specific2:
        print('✅ Topic-specific resources found for machine learning!')
        for i, r in enumerate(topic_specific2[:2]):
            print(f'  {i+1}. {r["title"]}')
    else:
        print('ℹ️  Using AI-generated resources for machine learning')

if __name__ == '__main__':
    test_enhanced_resources()