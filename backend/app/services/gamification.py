from typing import Dict, List
import datetime
import logging

logger = logging.getLogger('xenia')


def recompute_level(xp: int) -> Dict:
    """Calculate level and progress from XP using a balanced exponential curve."""
    level = 1
    remaining = xp
    while True:
        need = int(100 * (level**1.25))
        if remaining >= need:
            remaining -= need
            level += 1
        else:
            break
    return {
        "level": level,
        "progress": remaining,
        "to_next": int(100 * (level**1.25)) - remaining,
        "total_next": int(100 * (level**1.25))
    }


def calculate_xp_rewards(action_type: str, duration_min: int = 0, difficulty: str = "medium") -> int:
    """Calculate XP rewards based on action type, duration, and difficulty."""
    base_rewards = {
        "session_complete": 50,
        "task_complete": 25,
        "streak_day": 10,
        "assessment_pass": 75,
        "tutor_interaction": 15,
        "upload_syllabus": 30,
        "plan_generate": 20
    }
    
    difficulty_multipliers = {
        "easy": 0.8,
        "medium": 1.0,
        "hard": 1.3,
        "expert": 1.6
    }
    
    base_xp = base_rewards.get(action_type, 10)
    difficulty_mult = difficulty_multipliers.get(difficulty, 1.0)
    
    # Duration bonus for study sessions (1 XP per 5 minutes)
    duration_bonus = duration_min // 5 if action_type == "session_complete" else 0
    
    total_xp = int((base_xp * difficulty_mult) + duration_bonus)
    return max(total_xp, 5)  # Minimum 5 XP


def check_achievements(user_data: Dict) -> List[Dict]:
    """Check and return any new achievements unlocked."""
    achievements = []
    
    xp = user_data.get("xp", 0)
    level = user_data.get("level", 1)
    streak_days = user_data.get("streak_days", 0)
    sessions_completed = user_data.get("sessions_completed", 0)
    tasks_completed = user_data.get("tasks_completed", 0)
    
    # XP-based achievements
    xp_milestones = [100, 500, 1000, 2500, 5000, 10000]
    for milestone in xp_milestones:
        if xp >= milestone and not user_data.get(f"achievement_xp_{milestone}", False):
            achievements.append({
                "id": f"xp_{milestone}",
                "title": f"XP Master {milestone}",
                "description": f"Earned {milestone} total experience points!",
                "icon": "trophy",
                "rarity": "rare" if milestone >= 2500 else "common",
                "unlocked_at": datetime.datetime.now().isoformat()
            })
    
    # Level-based achievements
    level_milestones = [5, 10, 15, 20, 25, 30]
    for milestone in level_milestones:
        if level >= milestone and not user_data.get(f"achievement_level_{milestone}", False):
            achievements.append({
                "id": f"level_{milestone}",
                "title": f"Level {milestone} Champion",
                "description": f"Reached level {milestone}!",
                "icon": "star",
                "rarity": "epic" if milestone >= 20 else "rare",
                "unlocked_at": datetime.datetime.now().isoformat()
            })
    
    # Streak-based achievements
    streak_milestones = [3, 7, 14, 30, 60, 100]
    for milestone in streak_milestones:
        if streak_days >= milestone and not user_data.get(f"achievement_streak_{milestone}", False):
            achievements.append({
                "id": f"streak_{milestone}",
                "title": f"{milestone}-Day Scholar",
                "description": f"Maintained a {milestone}-day study streak!",
                "icon": "flame",
                "rarity": "legendary" if milestone >= 60 else "epic",
                "unlocked_at": datetime.datetime.now().isoformat()
            })
    
    # Session-based achievements
    session_milestones = [10, 25, 50, 100, 250, 500]
    for milestone in session_milestones:
        if sessions_completed >= milestone and not user_data.get(f"achievement_sessions_{milestone}", False):
            achievements.append({
                "id": f"sessions_{milestone}",
                "title": f"Study Hero {milestone}",
                "description": f"Completed {milestone} study sessions!",
                "icon": "book",
                "rarity": "rare" if milestone >= 100 else "common",
                "unlocked_at": datetime.datetime.now().isoformat()
            })
    
    return achievements


def get_study_stats(sessions: List[Dict], tasks: List[Dict]) -> Dict:
    """Calculate comprehensive study statistics."""
    total_sessions = len(sessions)
    total_tasks = len(tasks)
    
    # Calculate total study time
    total_minutes = sum(session.get("duration_min", 0) for session in sessions)
    total_hours = total_minutes / 60
    
    # Calculate completion rates
    completed_tasks = sum(1 for task in tasks if task.get("status") == "completed")
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Calculate recent activity (last 7 days)
    now = datetime.datetime.now()
    week_ago = now - datetime.timedelta(days=7)
    
    recent_sessions = []
    for session in sessions:
        try:
            session_date = datetime.datetime.fromisoformat(session.get("created_at", "").replace("Z", "+00:00"))
            if session_date >= week_ago:
                recent_sessions.append(session)
        except:
            continue
    
    recent_study_time = sum(session.get("duration_min", 0) for session in recent_sessions)
    
    # Calculate streak
    streak_days = calculate_current_streak(sessions)
    
    return {
        "total_sessions": total_sessions,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_rate": round(completion_rate, 1),
        "total_study_hours": round(total_hours, 1),
        "total_study_minutes": total_minutes,
        "recent_study_minutes": recent_study_time,
        "recent_study_hours": round(recent_study_time / 60, 1),
        "streak_days": streak_days,
        "avg_session_length": round(total_minutes / total_sessions, 1) if total_sessions > 0 else 0
    }


def calculate_current_streak(sessions: List[Dict]) -> int:
    """Calculate current study streak based on sessions."""
    if not sessions:
        return 0
    
    # Sort sessions by date (most recent first)
    sorted_sessions = sorted(sessions, key=lambda x: x.get("created_at", ""), reverse=True)
    
    now = datetime.datetime.now()
    streak_days = 0
    current_date = now.date()
    
    # Track which days had study sessions
    study_dates = set()
    for session in sorted_sessions:
        try:
            session_date = datetime.datetime.fromisoformat(session.get("created_at", "").replace("Z", "+00:00")).date()
            study_dates.add(session_date)
        except:
            continue
    
    # Count consecutive days with study sessions
    check_date = current_date
    while check_date in study_dates:
        streak_days += 1
        check_date -= datetime.timedelta(days=1)
    
    return streak_days


def generate_progress_insights(user_data: Dict, stats: Dict) -> List[str]:
    """Generate personalized insights and recommendations."""
    insights = []
    
    completion_rate = stats.get("completion_rate", 0)
    streak_days = stats.get("streak_days", 0)
    recent_hours = stats.get("recent_study_hours", 0)
    avg_session = stats.get("avg_session_length", 0)
    
    # Completion rate insights
    if completion_rate >= 90:
        insights.append("🎯 Excellent completion rate! You're consistently finishing your tasks.")
    elif completion_rate >= 70:
        insights.append("👍 Good task completion. Try to tackle a few more tasks to boost your rate.")
    elif completion_rate >= 50:
        insights.append("📈 You're making progress! Focus on completing more tasks to build momentum.")
    else:
        insights.append("🚀 Let's improve your task completion rate. Start with smaller, manageable goals.")
    
    # Streak insights
    if streak_days >= 30:
        insights.append("🔥 Incredible streak! You're building an amazing study habit.")
    elif streak_days >= 7:
        insights.append("📅 Great weekly streak! Keep the momentum going.")
    elif streak_days >= 3:
        insights.append("⭐ Nice streak starting! Try to extend it for better learning retention.")
    else:
        insights.append("🎯 Start a study streak today! Consistent daily practice improves retention by 40%.")
    
    # Study time insights
    if recent_hours >= 10:
        insights.append("📚 Impressive study hours this week! Make sure to take breaks for better retention.")
    elif recent_hours >= 5:
        insights.append("⏰ Solid study time! Consider adding short review sessions to reinforce learning.")
    elif recent_hours >= 2:
        insights.append("📖 You're building good study habits. Try to increase session frequency.")
    else:
        insights.append("🎓 Let's boost your study time! Even 15-minute daily sessions make a difference.")
    
    # Session length insights
    if avg_session >= 60:
        insights.append("⏱️ Long study sessions detected. Consider 25-50 minute focused sessions with breaks.")
    elif avg_session >= 25:
        insights.append("🎯 Great session length! This is optimal for focused learning.")
    elif avg_session >= 15:
        insights.append("⚡ Good session length for building habits. Consider gradually increasing duration.")
    else:
        insights.append("🚀 Short sessions are great for starting! Try to gradually extend them as you build stamina.")
    
    return insights[:3]  # Return top 3 insights
