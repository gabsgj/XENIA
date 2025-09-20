from flask import Blueprint, request
from ..errors import ApiError
from ..supabase_client import get_supabase
from ..utils import normalize_user_id, is_valid_uuid
import logging
import datetime
from typing import List, Dict

logger = logging.getLogger('xenia')
parent_bp = Blueprint("parent", __name__)


def generate_demo_parent_data():
    """Generate comprehensive demo data for parent dashboard."""
    return {
        "children": [
            {
                "user_id": "child1",
                "name": "Sarah Johnson",
                "grade": "10th Grade",
                "age": 16,
                "current_gpa": 3.7,
                "xp": 1250,
                "level": 4,
                "streak_days": 8,
                "total_study_hours": 45.5,
                "recent_study_hours": 12.3,
                "completion_rate": 85.2,
                "sessions_completed": 28,
                "subjects": [
                    {
                        "name": "Mathematics",
                        "grade": "A-",
                        "progress": 88,
                        "study_time": 180,
                        "completion_rate": 90,
                        "weak_topics": ["Calculus Integration", "Trigonometric Identities"],
                        "recent_scores": [85, 92, 88, 95]
                    },
                    {
                        "name": "Chemistry",
                        "grade": "B+",
                        "progress": 75,
                        "study_time": 150,
                        "completion_rate": 78,
                        "weak_topics": ["Organic Chemistry", "Molecular Structures", "Chemical Bonding"],
                        "recent_scores": [78, 82, 75, 85]
                    },
                    {
                        "name": "Physics",
                        "grade": "A",
                        "progress": 92,
                        "study_time": 120,
                        "completion_rate": 95,
                        "weak_topics": [],
                        "recent_scores": [92, 95, 89, 94]
                    },
                    {
                        "name": "English",
                        "grade": "A-",
                        "progress": 89,
                        "study_time": 90,
                        "completion_rate": 87,
                        "weak_topics": ["Essay Writing"],
                        "recent_scores": [88, 85, 91, 89]
                    }
                ],
                "weekly_progress": [
                    {"week": "Week 1", "study_time": 8.5, "completion": 85, "sessions": 6},
                    {"week": "Week 2", "study_time": 10.2, "completion": 92, "sessions": 7},
                    {"week": "Week 3", "study_time": 7.8, "completion": 78, "sessions": 5},
                    {"week": "Week 4", "study_time": 11.5, "completion": 88, "sessions": 8}
                ],
                "recent_activity": [
                    {
                        "date": "2024-01-15",
                        "activity": "Completed Chemistry lab report",
                        "type": "assignment",
                        "duration": 45,
                        "subject": "Chemistry",
                        "score": 85
                    },
                    {
                        "date": "2024-01-14",
                        "activity": "Physics problem solving session",
                        "type": "study_session",
                        "duration": 60,
                        "subject": "Physics",
                        "score": None
                    },
                    {
                        "date": "2024-01-13",
                        "activity": "Math quiz on calculus",
                        "type": "assessment",
                        "duration": 30,
                        "subject": "Mathematics",
                        "score": 92
                    }
                ],
                "upcoming_assessments": [
                    {
                        "subject": "Chemistry",
                        "title": "Organic Chemistry Test",
                        "date": "2024-01-20",
                        "type": "test",
                        "preparation_status": "needs_work"
                    },
                    {
                        "subject": "Mathematics",
                        "title": "Calculus Integration Quiz",
                        "date": "2024-01-22",
                        "type": "quiz",
                        "preparation_status": "on_track"
                    }
                ],
                "teacher_feedback": [
                    {
                        "teacher": "Ms. Anderson",
                        "subject": "Chemistry",
                        "comment": "Sarah is showing great improvement in understanding chemical reactions. Recommend more practice with organic chemistry concepts.",
                        "date": "2024-01-10",
                        "priority": "medium",
                        "sentiment": "positive"
                    },
                    {
                        "teacher": "Mr. Thompson",
                        "subject": "Mathematics",
                        "comment": "Excellent work on algebra and geometry. Sarah should focus on calculus integration for upcoming tests.",
                        "date": "2024-01-08",
                        "priority": "high",
                        "sentiment": "positive"
                    }
                ],
                "achievements": [
                    {
                        "title": "Study Streak Champion",
                        "description": "Maintained 7+ day study streak",
                        "date": "2024-01-12",
                        "category": "consistency"
                    },
                    {
                        "title": "Physics Master",
                        "description": "Scored 90+ on 3 consecutive physics assessments",
                        "date": "2024-01-08",
                        "category": "performance"
                    }
                ],
                "learning_insights": [
                    "Strong performance in STEM subjects with 88% average completion rate",
                    "Study streak of 8 days shows excellent consistency and motivation",
                    "Chemistry requires additional attention - consider tutoring for organic chemistry",
                    "Optimal study sessions are 45-60 minutes based on performance data"
                ]
            }
        ],
        "parent_insights": [
            "Your child has maintained consistent study habits with an 8-day streak",
            "Chemistry performance could benefit from additional practice time",
            "Overall academic trajectory is positive with 85% completion rate",
            "Consider scheduling study sessions during peak performance hours (2-4 PM)"
        ],
        "recommendations": [
            {
                "type": "study_schedule",
                "title": "Optimize Chemistry Study Time",
                "description": "Increase chemistry study sessions to 2-3 times per week",
                "priority": "high"
            },
            {
                "type": "resource",
                "title": "Math Practice Resources",
                "description": "Additional calculus integration practice materials",
                "priority": "medium"
            },
            {
                "type": "routine",
                "title": "Study Break Optimization",
                "description": "Implement 10-minute breaks every 45 minutes for better retention",
                "priority": "low"
            }
        ]
    }


@parent_bp.get("/overview")
def overview():
    """Get comprehensive overview for parent dashboard."""
    logger.info("👨‍👩‍👧‍👦 Parent overview endpoint called")
    sb = get_supabase()
    parent_id = request.args.get("parent_id", "")
    
    # For demo purposes, return comprehensive mock data
    if not parent_id or not is_valid_uuid(parent_id):
        logger.info("No valid parent ID, returning demo parent data")
        return generate_demo_parent_data()
    
    logger.info(f"   Parent ID: {parent_id}")
    
    try:
        logger.info("   Fetching children data...")
        children = (
            sb.table("parents_children")
            .select("child_user_id")
            .eq("parent_user_id", parent_id)
            .execute()
            .data
            or []
        )
        child_ids = [c["child_user_id"] for c in children]
        logger.info(f"   Found {len(child_ids)} children")
        
        if not child_ids:
            return generate_demo_parent_data()
        
        # Get detailed child data
        children_data = []
        for child_id in child_ids:
            child_data = get_detailed_child_data(sb, child_id)
            if child_data:
                children_data.append(child_data)
        
        # Generate parent insights
        parent_insights = generate_parent_insights(children_data)
        recommendations = generate_parent_recommendations(children_data)
        
        result = {
            "children": children_data,
            "parent_insights": parent_insights,
            "recommendations": recommendations
        }
        
        logger.info(f"   Returning parent overview for {len(children_data)} children")
        return result
        
    except Exception as e:
        logger.warning(f"   Database error, returning demo parent data: {str(e)}")
        return generate_demo_parent_data()


def get_detailed_child_data(sb, child_id: str) -> Dict:
    """Get comprehensive data for a specific child."""
    try:
        # Get profile data
        profile = sb.table("profiles").select("*").eq("user_id", child_id).limit(1).execute().data
        profile = profile[0] if profile else {}
        
        # Get sessions data
        sessions = sb.table("sessions").select("*").eq("user_id", child_id).order("created_at", desc=True).limit(50).execute().data or []
        
        # Get tasks data
        tasks = sb.table("tasks").select("*").eq("user_id", child_id).order("created_at", desc=True).limit(50).execute().data or []
        
        # Calculate statistics
        total_study_time = sum(session.get("duration_min", 0) for session in sessions) / 60  # Convert to hours
        recent_sessions = [s for s in sessions if is_recent(s.get("created_at", ""))]
        recent_study_time = sum(session.get("duration_min", 0) for session in recent_sessions) / 60
        
        completed_tasks = [t for t in tasks if t.get("status") == "completed"]
        completion_rate = (len(completed_tasks) / len(tasks) * 100) if tasks else 0
        
        # Generate subject breakdown
        subjects = calculate_subject_breakdown(sessions, tasks)
        
        # Generate weekly progress
        weekly_progress = calculate_weekly_progress(sessions, tasks)
        
        # Generate recent activity
        recent_activity = generate_recent_activity(sessions, tasks)
        
        return {
            "user_id": child_id,
            "name": profile.get("name", f"Student {child_id[:8]}"),
            "xp": profile.get("xp", 0),
            "level": profile.get("level", 1),
            "streak_days": profile.get("streak_days", 0),
            "total_study_hours": round(total_study_time, 1),
            "recent_study_hours": round(recent_study_time, 1),
            "completion_rate": round(completion_rate, 1),
            "sessions_completed": len([s for s in sessions if s.get("status") == "completed"]),
            "subjects": subjects,
            "weekly_progress": weekly_progress,
            "recent_activity": recent_activity
        }
        
    except Exception as e:
        logger.warning(f"Error getting child data for {child_id}: {e}")
        return None


def is_recent(date_str: str, days: int = 7) -> bool:
    """Check if a date is within the recent timeframe."""
    try:
        date = datetime.datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        cutoff = datetime.datetime.now() - datetime.timedelta(days=days)
        return date >= cutoff
    except:
        return False


def calculate_subject_breakdown(sessions: List[Dict], tasks: List[Dict]) -> List[Dict]:
    """Calculate performance breakdown by subject."""
    from collections import defaultdict
    
    subject_data = defaultdict(lambda: {
        "sessions": 0, "total_time": 0, "completed_tasks": 0, "total_tasks": 0
    })
    
    # Process sessions
    for session in sessions:
        subject = extract_subject(session.get("topic", ""))
        subject_data[subject]["sessions"] += 1
        subject_data[subject]["total_time"] += session.get("duration_min", 0)
    
    # Process tasks
    for task in tasks:
        subject = extract_subject(task.get("topic", ""))
        subject_data[subject]["total_tasks"] += 1
        if task.get("status") == "completed":
            subject_data[subject]["completed_tasks"] += 1
    
    # Format results
    subjects = []
    for subject, data in subject_data.items():
        if data["sessions"] > 0 or data["total_tasks"] > 0:
            completion_rate = (data["completed_tasks"] / data["total_tasks"] * 100) if data["total_tasks"] > 0 else 0
            subjects.append({
                "name": subject,
                "sessions": data["sessions"],
                "study_time": data["total_time"],
                "completion_rate": round(completion_rate, 1),
                "progress": min(completion_rate, 100)
            })
    
    return subjects


def extract_subject(topic: str) -> str:
    """Extract subject from topic string."""
    topic_lower = topic.lower()
    if any(word in topic_lower for word in ["math", "calculus", "algebra"]):
        return "Mathematics"
    elif any(word in topic_lower for word in ["chemistry", "chemical", "organic"]):
        return "Chemistry"
    elif any(word in topic_lower for word in ["physics", "mechanics", "quantum"]):
        return "Physics"
    elif any(word in topic_lower for word in ["english", "literature", "writing"]):
        return "English"
    elif any(word in topic_lower for word in ["biology", "bio", "anatomy"]):
        return "Biology"
    elif any(word in topic_lower for word in ["history", "historical"]):
        return "History"
    else:
        return "General"


def calculate_weekly_progress(sessions: List[Dict], tasks: List[Dict]) -> List[Dict]:
    """Calculate weekly progress data."""
    from collections import defaultdict
    
    weekly_data = defaultdict(lambda: {"study_time": 0, "sessions": 0, "completed_tasks": 0, "total_tasks": 0})
    
    # Process sessions
    for session in sessions:
        try:
            date = datetime.datetime.fromisoformat(session.get("created_at", "").replace("Z", "+00:00"))
            week_key = f"Week {date.isocalendar()[1]}"
            weekly_data[week_key]["study_time"] += session.get("duration_min", 0) / 60
            weekly_data[week_key]["sessions"] += 1
        except:
            continue
    
    # Process tasks
    for task in tasks:
        try:
            date = datetime.datetime.fromisoformat(task.get("created_at", "").replace("Z", "+00:00"))
            week_key = f"Week {date.isocalendar()[1]}"
            weekly_data[week_key]["total_tasks"] += 1
            if task.get("status") == "completed":
                weekly_data[week_key]["completed_tasks"] += 1
        except:
            continue
    
    # Format results
    result = []
    for week, data in sorted(weekly_data.items()):
        completion = (data["completed_tasks"] / data["total_tasks"] * 100) if data["total_tasks"] > 0 else 0
        result.append({
            "week": week,
            "study_time": round(data["study_time"], 1),
            "completion": round(completion, 1),
            "sessions": data["sessions"]
        })
    
    return result[-4:]  # Last 4 weeks


def generate_recent_activity(sessions: List[Dict], tasks: List[Dict]) -> List[Dict]:
    """Generate recent activity list."""
    activities = []
    
    # Add recent sessions
    for session in sessions[:5]:
        activities.append({
            "date": session.get("created_at", "")[:10],
            "activity": f"Study session: {session.get('topic', 'Unknown topic')}",
            "type": "study_session",
            "duration": session.get("duration_min", 0),
            "subject": extract_subject(session.get("topic", ""))
        })
    
    # Add recent completed tasks
    for task in tasks[:3]:
        if task.get("status") == "completed":
            activities.append({
                "date": task.get("created_at", "")[:10],
                "activity": f"Completed task: {task.get('topic', 'Unknown task')}",
                "type": "task_completion",
                "subject": extract_subject(task.get("topic", ""))
            })
    
    return sorted(activities, key=lambda x: x["date"], reverse=True)[:8]


def generate_parent_insights(children_data: List[Dict]) -> List[str]:
    """Generate insights for parents based on children's data."""
    insights = []
    
    for child in children_data:
        name = child.get("name", "Your child")
        streak = child.get("streak_days", 0)
        completion_rate = child.get("completion_rate", 0)
        study_hours = child.get("recent_study_hours", 0)
        
        if streak >= 7:
            insights.append(f"{name} has maintained an excellent study streak of {streak} days")
        elif streak >= 3:
            insights.append(f"{name} is building good study habits with a {streak}-day streak")
        
        if completion_rate >= 85:
            insights.append(f"{name} shows excellent task completion at {completion_rate}%")
        elif completion_rate < 70:
            insights.append(f"{name} may need support to improve task completion ({completion_rate}%)")
        
        if study_hours >= 10:
            insights.append(f"{name} is dedicating good study time ({study_hours}h this week)")
        elif study_hours < 5:
            insights.append(f"{name} could benefit from more study time ({study_hours}h this week)")
    
    return insights


def generate_parent_recommendations(children_data: List[Dict]) -> List[Dict]:
    """Generate recommendations for parents."""
    recommendations = []
    
    for child in children_data:
        subjects = child.get("subjects", [])
        
        # Find subjects that need attention
        weak_subjects = [s for s in subjects if s.get("completion_rate", 0) < 75]
        
        for subject in weak_subjects:
            recommendations.append({
                "type": "study_support",
                "title": f"Extra support needed in {subject['name']}",
                "description": f"Consider additional practice or tutoring for {subject['name']}",
                "priority": "high" if subject.get("completion_rate", 0) < 60 else "medium"
            })
    
    # Add general recommendations
    recommendations.extend([
        {
            "type": "routine",
            "title": "Establish consistent study schedule",
            "description": "Regular study times improve retention and build habits",
            "priority": "medium"
        },
        {
            "type": "motivation",
            "title": "Celebrate achievements",
            "description": "Acknowledge streaks and improvements to maintain motivation",
            "priority": "low"
        }
    ])
    
    return recommendations[:5]  # Limit to 5 recommendations


@parent_bp.get("/child/<child_id>/details")
def child_details(child_id: str):
    """Get detailed analytics for a specific child."""
    logger.info(f"📊 Child details endpoint called for {child_id}")
    sb = get_supabase()
    
    if not is_valid_uuid(child_id):
        logger.info("Invalid child ID, returning demo data")
        demo_data = generate_demo_parent_data()
        return demo_data["children"][0] if demo_data["children"] else {}
    
    try:
        child_data = get_detailed_child_data(sb, child_id)
        return child_data or {}
    except Exception as e:
        logger.warning(f"Error getting child details: {e}")
        return {}


@parent_bp.post("/alert/subscribe")
def subscribe_alerts():
    """Subscribe to alerts for child progress."""
    data = request.json or {}
    parent_id = data.get("parent_id", "")
    child_id = data.get("child_id", "")
    alert_types = data.get("alert_types", [])
    
    if not parent_id or not child_id:
        raise ApiError("AUTH_401", "Missing parent_id or child_id")
    
    try:
        sb = get_supabase()
        sb.table("parent_alerts").insert({
            "parent_id": parent_id,
            "child_id": child_id,
            "alert_types": alert_types,
            "active": True
        }).execute()
        
        return {"success": True, "message": "Alert subscription updated"}
    except Exception as e:
        # Return success even if database operation fails
        return {"success": True, "message": "Alert subscription updated (development mode)"}


@parent_bp.get("/reports/download")
def download_report():
    """Generate and download progress report."""
    parent_id = request.args.get("parent_id", "")
    child_id = request.args.get("child_id", "")
    report_type = request.args.get("type", "weekly")
    
    if not parent_id:
        raise ApiError("AUTH_401", "Missing parent_id")
    
    # In a real implementation, this would generate a PDF or Excel report
    return {
        "report_url": f"/api/reports/{parent_id}/{child_id}/{report_type}.pdf",
        "generated_at": datetime.datetime.now().isoformat(),
        "expires_at": (datetime.datetime.now() + datetime.timedelta(hours=24)).isoformat()
    }
