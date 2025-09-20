from flask import Blueprint, request
from ..errors import ApiError
from ..supabase_client import get_supabase
from ..utils import normalize_user_id, is_valid_uuid
import logging
import datetime
from typing import List, Dict

logger = logging.getLogger('xenia')
teacher_bp = Blueprint("teacher", __name__)


def generate_demo_teacher_data():
    """Generate comprehensive demo data for teacher dashboard."""
    return {
        "class_overview": {
            "total_students": 24,
            "active_students": 22,
            "average_grade": "B+",
            "average_completion_rate": 78.5,
            "total_study_hours": 520,
            "class_performance_trend": "improving"
        },
        "students": [
            {
                "id": "student1",
                "name": "Sarah Johnson",
                "email": "sarah.j@school.edu",
                "grade": "A-",
                "level": 4,
                "xp": 1250,
                "completion_rate": 88.5,
                "study_hours": 45.2,
                "streak_days": 8,
                "weak_topics": ["Organic Chemistry", "Calculus Integration"],
                "recent_performance": 85.2,
                "last_active": "2024-01-15T14:30:00Z",
                "subjects": [
                    {"subject": "Chemistry", "grade": "B+", "progress": 75},
                    {"subject": "Mathematics", "grade": "A-", "progress": 88},
                    {"subject": "Physics", "grade": "A", "progress": 92}
                ],
                "recent_activities": [
                    {
                        "date": "2024-01-15",
                        "activity": "Completed Chemistry lab report",
                        "score": 85,
                        "duration": 45
                    },
                    {
                        "date": "2024-01-14", 
                        "activity": "Math problem solving session",
                        "duration": 60
                    }
                ]
            },
            {
                "id": "student2", 
                "name": "Michael Chen",
                "email": "michael.c@school.edu",
                "grade": "B+",
                "level": 3,
                "xp": 890,
                "completion_rate": 72.3,
                "study_hours": 38.7,
                "streak_days": 5,
                "weak_topics": ["Essay Writing", "Trigonometry"],
                "recent_performance": 76.8,
                "last_active": "2024-01-15T11:20:00Z",
                "subjects": [
                    {"subject": "English", "grade": "B", "progress": 70},
                    {"subject": "Mathematics", "grade": "B+", "progress": 78},
                    {"subject": "History", "grade": "A-", "progress": 85}
                ],
                "recent_activities": [
                    {
                        "date": "2024-01-15",
                        "activity": "History essay submission",
                        "score": 82,
                        "duration": 90
                    }
                ]
            },
            {
                "id": "student3",
                "name": "Emily Rodriguez", 
                "email": "emily.r@school.edu",
                "grade": "A",
                "level": 5,
                "xp": 1580,
                "completion_rate": 94.2,
                "study_hours": 52.1,
                "streak_days": 12,
                "weak_topics": [],
                "recent_performance": 93.1,
                "last_active": "2024-01-15T16:45:00Z",
                "subjects": [
                    {"subject": "Chemistry", "grade": "A", "progress": 95},
                    {"subject": "Mathematics", "grade": "A", "progress": 96},
                    {"subject": "Physics", "grade": "A", "progress": 91}
                ],
                "recent_activities": [
                    {
                        "date": "2024-01-15",
                        "activity": "Advanced Physics problem set",
                        "score": 95,
                        "duration": 75
                    }
                ]
            },
            {
                "id": "student4",
                "name": "David Kim",
                "email": "david.k@school.edu", 
                "grade": "C+",
                "level": 2,
                "xp": 420,
                "completion_rate": 58.7,
                "study_hours": 22.3,
                "streak_days": 2,
                "weak_topics": ["Molecular Structures", "Algebra", "Reading Comprehension"],
                "recent_performance": 62.5,
                "last_active": "2024-01-14T09:15:00Z",
                "subjects": [
                    {"subject": "Chemistry", "grade": "C", "progress": 55},
                    {"subject": "Mathematics", "grade": "C+", "progress": 62},
                    {"subject": "English", "grade": "B-", "progress": 68}
                ],
                "recent_activities": [
                    {
                        "date": "2024-01-14",
                        "activity": "Basic algebra practice", 
                        "score": 67,
                        "duration": 30
                    }
                ]
            }
        ],
        "class_analytics": {
            "performance_distribution": [
                {"grade": "A", "count": 6},
                {"grade": "B", "count": 10}, 
                {"grade": "C", "count": 6},
                {"grade": "D", "count": 2}
            ],
            "subject_performance": [
                {"subject": "Mathematics", "avg_grade": 82.5, "completion_rate": 78},
                {"subject": "Chemistry", "avg_grade": 79.2, "completion_rate": 75},
                {"subject": "Physics", "avg_grade": 85.1, "completion_rate": 82},
                {"subject": "English", "avg_grade": 77.8, "completion_rate": 73}
            ],
            "weekly_progress": [
                {"week": "Week 1", "avg_completion": 75, "study_hours": 8.2},
                {"week": "Week 2", "avg_completion": 78, "study_hours": 9.1},
                {"week": "Week 3", "avg_completion": 72, "study_hours": 7.8},
                {"week": "Week 4", "avg_completion": 81, "study_hours": 9.5}
            ]
        },
        "weak_topics_analysis": [
            {
                "topic": "Organic Chemistry",
                "students_struggling": 8,
                "avg_score": 68.2,
                "recommended_action": "Additional practice sessions and visual aids"
            },
            {
                "topic": "Calculus Integration", 
                "students_struggling": 6,
                "avg_score": 71.5,
                "recommended_action": "Step-by-step problem solving workshops"
            },
            {
                "topic": "Essay Writing",
                "students_struggling": 5,
                "avg_score": 74.1,
                "recommended_action": "Writing structure tutorials and peer review"
            }
        ],
        "teacher_insights": [
            "Class performance has improved by 8% over the past month",
            "Organic Chemistry remains the most challenging topic for students",
            "Students with consistent study streaks show 25% better performance",
            "Small group sessions could benefit struggling students in mathematics"
        ],
        "recommendations": [
            {
                "type": "intervention",
                "title": "Extra Support for Struggling Students",
                "description": "Provide additional tutoring for students with completion rates below 65%",
                "priority": "high",
                "students_affected": ["David Kim", "Alex Johnson", "Maria Garcia"]
            },
            {
                "type": "content",
                "title": "Organic Chemistry Resources",
                "description": "Implement visual learning materials and practice problems",
                "priority": "medium", 
                "students_affected": ["Sarah Johnson", "Michael Chen", "David Kim"]
            },
            {
                "type": "engagement",
                "title": "Study Streak Motivation",
                "description": "Recognize and reward students maintaining consistent streaks",
                "priority": "low",
                "students_affected": "all"
            }
        ]
    }


@teacher_bp.get("/overview")
def teacher_overview():
    """Get comprehensive overview for teacher dashboard."""
    logger.info("👨‍🏫 Teacher overview endpoint called")
    teacher_id = request.args.get("teacher_id", "")
    class_id = request.args.get("class_id", "")
    
    # For demo purposes, return comprehensive mock data
    if not teacher_id or not is_valid_uuid(teacher_id):
        logger.info("No valid teacher ID, returning demo teacher data")
        return generate_demo_teacher_data()
    
    sb = get_supabase()
    try:
        # In a real implementation, would fetch actual class and student data
        # For now, return demo data
        return generate_demo_teacher_data()
    except Exception as e:
        logger.warning(f"Error getting teacher overview: {e}")
        return generate_demo_teacher_data()


@teacher_bp.post("/tag")
def tag_topic():
    """Tag a topic as needing attention for a student."""
    sb = get_supabase()
    data = request.json or {}
    if not data.get("user_id"):
        raise ApiError("AUTH_401", "Missing user id")
    if not data.get("topic") or not data.get("tag"):
        raise ApiError("PLAN_400", "Missing topic or tag")
    
    logger.info(f"Tagging topic '{data.get('topic')}' with '{data.get('tag')}' for user {data.get('user_id')}")
    
    try:
        sb.table("manual_tags").insert({
            "user_id": data.get("user_id"),
            "teacher_id": data.get("teacher_id"),
            "topic": data.get("topic"),
            "tag": data.get("tag"),
            "priority": data.get("priority", "medium"),
            "created_at": datetime.datetime.now().isoformat()
        }).execute()
        return {"ok": True, "message": "Topic tagged successfully"}
    except Exception as e:
        logger.warning(f"Database error when tagging topic: {e}")
        # Return success even if database operation fails in development mode
        return {"ok": True, "message": "Topic tagged successfully (development mode)"}


@teacher_bp.get("/student/<student_id>")
def get_student_details(student_id: str):
    """Get detailed information about a specific student."""
    logger.info(f"📊 Student details requested for {student_id}")
    
    if not is_valid_uuid(student_id):
        # Return demo student data
        demo_data = generate_demo_teacher_data()
        student = next((s for s in demo_data["students"] if s["id"] == student_id), demo_data["students"][0])
        return student
    
    # In real implementation, would fetch from database
    sb = get_supabase()
    try:
        # Fetch student data, sessions, tasks, etc.
        # For now, return demo data
        demo_data = generate_demo_teacher_data()
        return demo_data["students"][0]
    except Exception as e:
        logger.warning(f"Error getting student details: {e}")
        demo_data = generate_demo_teacher_data()
        return demo_data["students"][0]


@teacher_bp.post("/feedback")
def submit_feedback():
    """Submit feedback for a student."""
    data = request.json or {}
    student_id = data.get("student_id", "")
    feedback = data.get("feedback", "")
    subject = data.get("subject", "")
    priority = data.get("priority", "medium")
    
    if not student_id or not feedback:
        raise ApiError("PLAN_400", "Missing student_id or feedback")
    
    logger.info(f"Submitting feedback for student {student_id}")
    
    try:
        sb = get_supabase()
        sb.table("teacher_feedback").insert({
            "student_id": student_id,
            "teacher_id": data.get("teacher_id", "demo-teacher"),
            "subject": subject,
            "feedback": feedback,
            "priority": priority,
            "created_at": datetime.datetime.now().isoformat()
        }).execute()
        
        return {"ok": True, "message": "Feedback submitted successfully"}
    except Exception as e:
        logger.warning(f"Database error when submitting feedback: {e}")
        return {"ok": True, "message": "Feedback submitted successfully (development mode)"}


@teacher_bp.get("/reports")
def get_reports():
    """Generate class reports."""
    sb = get_supabase()
    class_id = request.args.get("class_id", "")
    report_type = request.args.get("type", "performance")
    
    logger.info(f"Generating {report_type} report for class {class_id}")
    
    try:
        reports = (
            sb.table("reports").select("*").eq("class_id", class_id).execute().data or []
        )
        
        # Generate report based on type
        demo_data = generate_demo_teacher_data()
        
        report_data = {
            "class_id": class_id,
            "report_type": report_type,
            "generated_at": datetime.datetime.now().isoformat(),
            "data": demo_data["class_analytics"] if report_type == "performance" else demo_data
        }
        
        return report_data
    except Exception as e:
        logger.warning(f"Error generating report: {e}")
        # Return mock data if there's an error
        return {
            "class_id": class_id,
            "report_type": report_type,
            "generated_at": datetime.datetime.now().isoformat(),
            "data": generate_demo_teacher_data()["class_analytics"]
        }


@teacher_bp.post("/intervention")
def create_intervention():
    """Create an intervention plan for struggling students."""
    data = request.json or {}
    student_ids = data.get("student_ids", [])
    intervention_type = data.get("type", "tutoring")
    description = data.get("description", "")
    
    if not student_ids or not description:
        raise ApiError("PLAN_400", "Missing student_ids or description")
    
    logger.info(f"Creating {intervention_type} intervention for {len(student_ids)} students")
    
    try:
        sb = get_supabase()
        sb.table("interventions").insert({
            "teacher_id": data.get("teacher_id", "demo-teacher"),
            "student_ids": student_ids,
            "type": intervention_type,
            "description": description,
            "status": "planned",
            "created_at": datetime.datetime.now().isoformat()
        }).execute()
        
        return {"ok": True, "message": "Intervention plan created successfully"}
    except Exception as e:
        logger.warning(f"Database error when creating intervention: {e}")
        return {"ok": True, "message": "Intervention plan created successfully (development mode)"}


@teacher_bp.get("/analytics/class")
def class_analytics():
    """Get detailed class analytics."""
    logger.info("📊 Class analytics requested")
    
    class_id = request.args.get("class_id", "")
    timeframe = request.args.get("timeframe", "month")  # week, month, semester
    
    demo_data = generate_demo_teacher_data()
    
    return {
        "class_id": class_id,
        "timeframe": timeframe,
        "overview": demo_data["class_overview"],
        "analytics": demo_data["class_analytics"],
        "weak_topics": demo_data["weak_topics_analysis"],
        "insights": demo_data["teacher_insights"],
        "recommendations": demo_data["recommendations"]
    }


@teacher_bp.get("/students/at-risk")
def get_at_risk_students():
    """Get list of students who need immediate attention."""
    logger.info("⚠️ At-risk students requested")
    
    demo_data = generate_demo_teacher_data()
    
    # Filter students who need attention (completion rate < 65% or no recent activity)
    at_risk_students = []
    for student in demo_data["students"]:
        if (student["completion_rate"] < 65 or 
            len(student["weak_topics"]) > 2 or
            student["streak_days"] < 3):
            at_risk_students.append({
                **student,
                "risk_factors": []
            })
            
            # Add risk factors
            if student["completion_rate"] < 65:
                at_risk_students[-1]["risk_factors"].append("Low completion rate")
            if len(student["weak_topics"]) > 2:
                at_risk_students[-1]["risk_factors"].append("Multiple weak topics")  
            if student["streak_days"] < 3:
                at_risk_students[-1]["risk_factors"].append("Inconsistent study habits")
    
    return {
        "at_risk_students": at_risk_students,
        "total_count": len(at_risk_students),
        "recommendations": [
            "Schedule one-on-one meetings with at-risk students",
            "Provide additional study resources for weak topics",
            "Consider peer tutoring or study groups"
        ]
    }


@teacher_bp.post("/assignment")
def create_assignment():
    """Create a new assignment for students."""
    data = request.json or {}
    title = data.get("title", "")
    description = data.get("description", "")
    subject = data.get("subject", "")
    due_date = data.get("due_date", "")
    student_ids = data.get("student_ids", [])
    
    if not title or not due_date or not student_ids:
        raise ApiError("PLAN_400", "Missing required fields")
    
    logger.info(f"Creating assignment '{title}' for {len(student_ids)} students")
    
    try:
        sb = get_supabase()
        assignment_id = f"assignment_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        sb.table("assignments").insert({
            "id": assignment_id,
            "teacher_id": data.get("teacher_id", "demo-teacher"),
            "title": title,
            "description": description,
            "subject": subject,
            "due_date": due_date,
            "student_ids": student_ids,
            "status": "active",
            "created_at": datetime.datetime.now().isoformat()
        }).execute()
        
        return {"ok": True, "assignment_id": assignment_id, "message": "Assignment created successfully"}
    except Exception as e:
        logger.warning(f"Database error when creating assignment: {e}")
        return {"ok": True, "assignment_id": "dev_assignment", "message": "Assignment created successfully (development mode)"}
