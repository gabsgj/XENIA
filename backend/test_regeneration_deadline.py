#!/usr/bin/env python
"""
Test script to verify plan regeneration properly adjusts to given deadline.
"""
import os
import sys
import json
from datetime import datetime, date, timedelta
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from app.services.plan_regeneration import PlanRegenerationService
from app.services.smart_scheduler import SmartScheduler

def test_deadline_adjustment():
    """Test that plan regeneration properly distributes sessions according to deadline."""
    
    print("=" * 60)
    print("TESTING PLAN REGENERATION WITH DEADLINE ADJUSTMENT")
    print("=" * 60)
    
    # Create test plan with multiple sessions
    test_plan = {
        "user_id": "test_user",
        "sessions": [
            {"date": "2024-01-15", "topic": "Python Basics", "duration_min": 45, "status": "completed"},
            {"date": "2024-01-16", "topic": "Data Types", "duration_min": 45, "status": "completed"},
            {"date": "2024-01-17", "topic": "Control Flow", "duration_min": 45, "status": "pending"},
            {"date": "2024-01-18", "topic": "Functions", "duration_min": 45, "status": "pending"},
            {"date": "2024-01-19", "topic": "Classes", "duration_min": 45, "status": "pending"},
            {"date": "2024-01-20", "topic": "Modules", "duration_min": 45, "status": "pending"},
            {"date": "2024-01-21", "topic": "File I/O", "duration_min": 45, "status": "pending"},
            {"date": "2024-01-22", "topic": "Error Handling", "duration_min": 45, "status": "pending"},
            {"date": "2024-01-23", "topic": "Testing", "duration_min": 45, "status": "pending"},
            {"date": "2024-01-24", "topic": "Debugging", "duration_min": 45, "status": "pending"},
        ]
    }
    
    # Test scenarios
    test_scenarios = [
        {
            "name": "Extend deadline with moderate pace",
            "new_deadline": date.today() + timedelta(days=10),
            "hours_per_day": 2.0,
            "preserve_progress": True,
            "expected_behavior": "Should distribute 8 pending sessions over 10 days"
        },
        {
            "name": "Tight deadline with intensive pace",
            "new_deadline": date.today() + timedelta(days=3),
            "hours_per_day": 4.0,
            "preserve_progress": True,
            "expected_behavior": "Should fit more sessions per day or extend deadline"
        },
        {
            "name": "Relaxed deadline with light pace",
            "new_deadline": date.today() + timedelta(days=20),
            "hours_per_day": 1.0,
            "preserve_progress": True,
            "expected_behavior": "Should spread sessions thinly across 20 days"
        }
    ]
    
    # Initialize service
    service = PlanRegenerationService()
    
    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n{'='*50}")
        print(f"Test {i}: {scenario['name']}")
        print(f"{'='*50}")
        print(f"New deadline: {scenario['new_deadline']}")
        print(f"Hours per day: {scenario['hours_per_day']}")
        print(f"Expected: {scenario['expected_behavior']}")
        print()
        
        # Regenerate plan
        regenerated = service.regenerate_with_deadline(
            current_plan=test_plan,
            new_deadline=scenario['new_deadline'],
            preserve_progress=scenario['preserve_progress'],
            hours_per_day=scenario['hours_per_day'],
            learning_pace='moderate',
            priority_adjustment='balanced'
        )
        
        # Analyze results
        print("Results:")
        print(f"  Total sessions: {len(regenerated.get('sessions', []))}")
        
        # Count sessions by status
        completed = sum(1 for s in regenerated['sessions'] if s.get('status') == 'completed')
        pending = sum(1 for s in regenerated['sessions'] if s.get('status') != 'completed')
        print(f"  Completed: {completed}, Pending: {pending}")
        
        # Analyze date distribution
        dates = {}
        for session in regenerated['sessions']:
            date_str = session.get('date', '')
            if date_str:
                dates[date_str] = dates.get(date_str, 0) + 1
        
        print(f"  Unique dates used: {len(dates)}")
        print(f"  Sessions per day distribution:")
        
        # Sort dates and show distribution
        for date_str in sorted(dates.keys())[:10]:  # Show first 10 days
            count = dates[date_str]
            print(f"    {date_str}: {count} sessions {'*' * count}")
        
        if len(dates) > 10:
            print(f"    ... and {len(dates) - 10} more days")
        
        # Check if deadline was extended
        changes = regenerated.get('changes_summary', {})
        if changes.get('deadline_extended'):
            print(f"\n  ⚠️ Deadline was extended!")
            print(f"    Original: {changes.get('original_deadline')}")
            print(f"    Extended: {changes.get('extended_deadline')}")
            print(f"    Extension: {changes.get('extension_days')} days")
        
        # Verify max sessions per day
        max_sessions = changes.get('max_sessions_per_day', 0)
        hours_used = changes.get('hours_per_day', 0)
        print(f"\n  Daily capacity:")
        print(f"    Hours/day: {hours_used}")
        print(f"    Max sessions/day: {max_sessions}")
        
        # Check if any day exceeds the limit
        exceeded = [d for d, c in dates.items() if c > max_sessions]
        if exceeded:
            print(f"  ❌ WARNING: {len(exceeded)} days exceed max sessions!")
            for d in exceeded[:3]:
                print(f"      {d}: {dates[d]} sessions (max: {max_sessions})")
        else:
            print(f"  ✅ All days within capacity limit")

def test_smart_scheduler_directly():
    """Test the SmartScheduler's deadline coverage method directly."""
    
    print("\n" + "=" * 60)
    print("TESTING SMART SCHEDULER DIRECTLY")
    print("=" * 60)
    
    scheduler = SmartScheduler()
    
    # Create a simple test plan
    test_plan = {
        "sessions": [
            {"topic": "Topic 1", "duration_min": 45, "status": "completed", "date": str(date.today())},
            {"topic": "Topic 2", "duration_min": 45, "status": "pending", "date": str(date.today())},
            {"topic": "Topic 3", "duration_min": 45, "status": "pending", "date": str(date.today())},
            {"topic": "Topic 4", "duration_min": 45, "status": "pending", "date": str(date.today())},
            {"topic": "Topic 5", "duration_min": 45, "status": "pending", "date": str(date.today())},
        ]
    }
    
    target_deadline = date.today() + timedelta(days=5)
    options = {"hours_per_day": 1.5}  # Should allow ~2 sessions per day
    
    print(f"Target deadline: {target_deadline}")
    print(f"Hours per day: {options['hours_per_day']}")
    print(f"Initial sessions: {len(test_plan['sessions'])}")
    
    # Call the method directly
    result = scheduler._ensure_deadline_coverage(
        current_plan=test_plan,
        regenerated=test_plan.copy(),
        target_deadline=target_deadline,
        preserve_progress=True,
        options=options
    )
    
    print("\nResult:")
    print(f"  Final deadline: {result.get('deadline')}")
    print(f"  Total sessions: {len(result.get('sessions', []))}")
    
    # Analyze distribution
    dates = {}
    for session in result.get('sessions', []):
        d = session.get('date', '')
        dates[d] = dates.get(d, 0) + 1
    
    print(f"  Date distribution:")
    for d in sorted(dates.keys()):
        print(f"    {d}: {dates[d]} sessions")

if __name__ == "__main__":
    try:
        # Set up minimal environment
        os.environ.setdefault('SUPABASE_URL', 'https://test.supabase.co')
        os.environ.setdefault('SUPABASE_ANON_KEY', 'test_key')
        os.environ.setdefault('SUPABASE_SERVICE_ROLE_KEY', 'test_key')
        
        print("Starting regeneration tests...")
        
        # Run tests
        test_deadline_adjustment()
        test_smart_scheduler_directly()
        
        print("\n" + "=" * 60)
        print("✅ All tests completed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()