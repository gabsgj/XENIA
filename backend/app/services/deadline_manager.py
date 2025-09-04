"""
Enhanced deadline and priority management for study planning.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger('xenia')

class DeadlineManager:
    """Smart deadline and priority management for study planning."""
    
    @staticmethod
    def calculate_urgency_level(deadline: Optional[str], horizon_days: int) -> Tuple[str, float]:
        """Calculate urgency level and multiplier based on deadline."""
        if not deadline:
            return "normal", 1.0
        
        try:
            deadline_date = datetime.fromisoformat(deadline).date()
            today = datetime.now(timezone.utc).date()
            days_remaining = (deadline_date - today).days
            
            if days_remaining <= 0:
                return "overdue", 3.0
            elif days_remaining <= 3:
                return "critical", 2.5
            elif days_remaining <= 7:
                return "urgent", 2.0
            elif days_remaining <= 14:
                return "moderate", 1.5
            else:
                return "normal", 1.0
                
        except Exception as e:
            logger.warning(f"Invalid deadline format: {e}")
            return "normal", 1.0
    
    @staticmethod
    def prioritize_topics(topics: List[Dict], urgency_level: str) -> List[Dict]:
        """Sort and prioritize topics based on difficulty and urgency."""
        def topic_priority_score(topic: Dict) -> Tuple[int, int, str]:
            # Priority order: high=0, medium=1, low=2
            priority_map = {"high": 0, "medium": 1, "low": 2}
            priority_val = priority_map.get(topic.get("priority", "medium"), 1)
            
            # Difficulty score (harder topics first in urgent situations)
            difficulty = topic.get("score", 5)
            
            # For urgent deadlines, prioritize harder topics first
            if urgency_level in ["critical", "urgent"]:
                difficulty_order = 10 - difficulty  # Reverse for urgent
            else:
                difficulty_order = difficulty  # Normal order for gradual learning
            
            topic_name = topic.get("topic", "")
            return (priority_val, difficulty_order, topic_name)
        
        sorted_topics = sorted(topics, key=topic_priority_score)
        logger.info(f"Prioritized {len(sorted_topics)} topics for {urgency_level} urgency")
        return sorted_topics
    
    @staticmethod
    def calculate_optimal_session_distribution(
        topics: List[Dict], 
        days_available: int, 
        daily_hours: float,
        urgency_multiplier: float
    ) -> List[Dict]:
        """Calculate optimal distribution of study sessions."""
        
        sessions = []
        start_date = datetime.now(timezone.utc).date()
        
        # Calculate total available study time
        total_minutes = days_available * daily_hours * 60
        
        # Calculate total estimated time needed
        total_estimated_minutes = sum(
            topic.get("estimated_hours", 3) * 60 
            for topic in topics
        )
        
        # Determine session length based on available time and urgency
        if urgency_multiplier > 2.0:
            base_session_length = 90  # Longer sessions for urgent deadlines
        elif urgency_multiplier > 1.5:
            base_session_length = 60  # Medium sessions
        else:
            base_session_length = 45  # Standard sessions
        
        # Calculate sessions per topic
        session_distribution = []
        for topic in topics:
            estimated_minutes = topic.get("estimated_hours", 3) * 60
            difficulty = topic.get("score", 5)
            priority = topic.get("priority", "medium")
            
            # More sessions for higher difficulty and priority
            base_sessions = max(1, int(estimated_minutes / base_session_length))
            
            # Adjust based on difficulty and priority
            if difficulty >= 8:
                base_sessions = int(base_sessions * 1.5)
            elif difficulty >= 6:
                base_sessions = int(base_sessions * 1.2)
            
            if priority == "high":
                base_sessions = int(base_sessions * 1.3)
            elif priority == "low":
                base_sessions = max(1, int(base_sessions * 0.8))
            
            session_distribution.append({
                "topic": topic,
                "sessions_needed": min(base_sessions, days_available * 2)  # Cap at 2 per day
            })
        
        # Distribute sessions across available days
        day_sessions = [[] for _ in range(days_available)]
        
        for topic_data in session_distribution:
            topic = topic_data["topic"]
            sessions_needed = topic_data["sessions_needed"]
            
            for session_num in range(sessions_needed):
                # Find the day with the least sessions
                min_sessions = min(len(day_sessions[i]) for i in range(days_available))
                available_days = [i for i in range(days_available) if len(day_sessions[i]) == min_sessions]
                
                if available_days:
                    day_index = available_days[session_num % len(available_days)]
                    session_date = start_date + timedelta(days=day_index)
                    
                    # Determine session type and focus
                    session_type = "learning"
                    focus = "Core concepts and fundamentals"
                    
                    if sessions_needed > 1:
                        if session_num == 0:
                            focus = "Introduction and key concepts"
                        elif session_num == sessions_needed - 1:
                            session_type = "review"
                            focus = "Review and practice problems"
                        else:
                            focus = "Deep dive and application"
                    
                    session = {
                        "date": session_date.isoformat(),
                        "topic": topic["topic"],
                        "focus": focus,
                        "duration_min": base_session_length,
                        "session_type": session_type,
                        "priority": topic.get("priority", "medium"),
                        "difficulty": topic.get("score", 5),
                        "prerequisites_covered": session_num > 0,
                        "cognitive_load": "high" if topic.get("score", 5) >= 7 else "medium"
                    }
                    
                    day_sessions[day_index].append(session)
        
        # Flatten sessions and sort by date
        all_sessions = []
        for day_session_list in day_sessions:
            all_sessions.extend(day_session_list)
        
        all_sessions.sort(key=lambda s: s["date"])
        
        logger.info(f"Generated {len(all_sessions)} optimally distributed sessions")
        return all_sessions

class StudyPlanOptimizer:
    """Advanced study plan optimization with learning science principles."""
    
    @staticmethod
    def apply_spaced_repetition(sessions: List[Dict]) -> List[Dict]:
        """Apply spaced repetition principles to session scheduling."""
        topic_sessions = {}
        
        # Group sessions by topic
        for session in sessions:
            topic = session["topic"]
            if topic not in topic_sessions:
                topic_sessions[topic] = []
            topic_sessions[topic].append(session)
        
        # Apply spacing intervals for multi-session topics
        optimized_sessions = []
        for topic, topic_session_list in topic_sessions.items():
            if len(topic_session_list) <= 1:
                optimized_sessions.extend(topic_session_list)
                continue
            
            # Calculate optimal spacing intervals (1, 3, 7, 14 days)
            spacing_intervals = [0, 3, 7, 14, 21]
            start_date = datetime.fromisoformat(topic_session_list[0]["date"]).date()
            
            for i, session in enumerate(topic_session_list):
                if i < len(spacing_intervals):
                    new_date = start_date + timedelta(days=spacing_intervals[i])
                    session["date"] = new_date.isoformat()
                    session["spaced_repetition"] = True
                    session["repetition_interval"] = spacing_intervals[i]
                
                optimized_sessions.append(session)
        
        optimized_sessions.sort(key=lambda s: s["date"])
        return optimized_sessions
    
    @staticmethod
    def balance_cognitive_load(sessions: List[Dict], daily_hours: float) -> List[Dict]:
        """Balance cognitive load across study sessions."""
        daily_minutes = daily_hours * 60
        
        # Group sessions by date
        sessions_by_date = {}
        for session in sessions:
            date = session["date"]
            if date not in sessions_by_date:
                sessions_by_date[date] = []
            sessions_by_date[date].append(session)
        
        # Rebalance each day
        balanced_sessions = []
        for date, day_sessions in sessions_by_date.items():
            total_duration = sum(s["duration_min"] for s in day_sessions)
            
            if total_duration > daily_minutes:
                # Reduce session lengths proportionally
                reduction_factor = daily_minutes / total_duration
                for session in day_sessions:
                    session["duration_min"] = max(30, int(session["duration_min"] * reduction_factor))
            
            # Sort by difficulty (easier topics first for better learning)
            day_sessions.sort(key=lambda s: s.get("difficulty", 5))
            balanced_sessions.extend(day_sessions)
        
        return balanced_sessions
