import logging
from datetime import date, datetime, timedelta
from typing import Dict, Any, List
import os

logger = logging.getLogger('xenia.smart_scheduler')


class SmartScheduler:
    """Adaptive scheduler that delegates to AI provider for deadline-aware rescheduling.

    This wraps existing ai_providers.adjust_plan_based_on_progress and/or
    a specialized scheduling prompt to produce a regenerated plan that:
    - preserves completed sessions when requested
    - respects topic prerequisites and spaced repetition
    - returns sessions with explicit dates
    """

    def __init__(self, ai_client=None):
        self.ai = ai_client

    def _ensure_deadline_coverage(self, current_plan: Dict[str, Any], regenerated: Dict[str, Any], target_deadline: date, preserve_progress: bool, options: Dict[str, Any]) -> Dict[str, Any]:
        """Intelligently redistribute sessions to ensure proper deadline coverage with optimal distribution.

        Strategy:
        - Keep completed sessions (if preserve_progress) in their original dates
        - Redistribute remaining sessions evenly across available days until target_deadline
        - Consider daily capacity limits based on hours_per_day constraints
        - Apply intelligent scheduling principles (spaced repetition, topic grouping)
        - Extend deadline only if absolutely necessary
        """
        try:
            sessions: List[Dict[str, Any]] = list(regenerated.get('sessions') or [])
            if not sessions:
                return regenerated

            # Calculate daily capacity based on hours_per_day and session duration
            hours_per_day = options.get('hours_per_day', 2.0)  # Default 2 hours per day
            avg_session_duration = 45  # minutes
            daily_minutes = hours_per_day * 60
            max_sessions_per_day = max(1, int(daily_minutes / avg_session_duration))
            
            # Override with explicit max_sessions_per_day if provided
            if options.get('max_sessions_per_day'):
                max_sessions_per_day = max(1, int(options['max_sessions_per_day']))
            
            logger.info(f"Deadline coverage: {hours_per_day}h/day = max {max_sessions_per_day} sessions/day")

            today = date.today()
            if target_deadline < today:
                target_deadline = today + timedelta(days=1)  # Minimum 1 day

            def _parse_date(d: Any) -> date:
                if isinstance(d, date):
                    return d
                if isinstance(d, str):
                    try:
                        return datetime.strptime(d[:10], '%Y-%m-%d').date()
                    except Exception:
                        return today
                return today

            # Separate completed and remaining sessions
            completed_sessions = []
            remaining_sessions = []
            
            for session in sessions:
                if preserve_progress and session.get('status') == 'completed':
                    completed_sessions.append(dict(session))
                else:
                    # Reset status for remaining sessions
                    session_copy = dict(session)
                    session_copy['status'] = 'pending'
                    remaining_sessions.append(session_copy)

            # Calculate available days and build date range
            available_days = []
            current_date = today
            while current_date <= target_deadline:
                available_days.append(current_date)
                current_date += timedelta(days=1)
            
            total_available_days = len(available_days)
            logger.info(f"Available days for scheduling: {total_available_days}")

            # Track daily load (including completed sessions)
            daily_load = {day: 0 for day in available_days}
            
            # Account for completed sessions in daily load
            for session in completed_sessions:
                session_date = _parse_date(session.get('date', today))
                if session_date in daily_load:
                    daily_load[session_date] += 1

            # Calculate total capacity and check feasibility
            total_capacity = sum(max(0, max_sessions_per_day - daily_load[day]) for day in available_days)
            sessions_to_schedule = len(remaining_sessions)
            
            logger.info(f"Total capacity: {total_capacity}, Sessions to schedule: {sessions_to_schedule}")

            # Extend deadline if necessary
            extended_deadline = target_deadline
            if total_capacity < sessions_to_schedule:
                additional_days_needed = ((sessions_to_schedule - total_capacity) + max_sessions_per_day - 1) // max_sessions_per_day
                extended_deadline = target_deadline + timedelta(days=additional_days_needed)
                
                # Add the additional days to our available days
                current_date = target_deadline + timedelta(days=1)
                while current_date <= extended_deadline:
                    available_days.append(current_date)
                    daily_load[current_date] = 0
                    current_date += timedelta(days=1)
                
                logger.warning(f"Extended deadline by {additional_days_needed} days to {extended_deadline}")

            # Distribute remaining sessions optimally
            redistributed_sessions = self._distribute_sessions_optimally(
                remaining_sessions, 
                available_days, 
                daily_load, 
                max_sessions_per_day
            )

            # Combine and sort all sessions
            all_sessions = completed_sessions + redistributed_sessions
            all_sessions.sort(key=lambda x: (_parse_date(x.get('date')), x.get('topic', '')))

            # Update the regenerated plan
            regenerated['sessions'] = all_sessions
            regenerated['deadline'] = extended_deadline.isoformat()
            
            # Update changes summary
            changes = regenerated.get('changes_summary', {})
            changes['sessions_redistributed'] = len(redistributed_sessions)
            changes['max_sessions_per_day'] = max_sessions_per_day
            changes['hours_per_day'] = hours_per_day
            
            if extended_deadline != target_deadline:
                changes['deadline_extended'] = True
                changes['original_deadline'] = target_deadline.isoformat()
                changes['extended_deadline'] = extended_deadline.isoformat()
                changes['extension_days'] = (extended_deadline - target_deadline).days
            
            regenerated['changes_summary'] = changes
            regenerated['generation_method'] = (regenerated.get('generation_method', '') + '+deadline_optimized').strip()
            
            logger.info(f"Deadline coverage complete: {len(all_sessions)} total sessions over {len(available_days)} days")
            return regenerated
            
        except Exception as e:
            logger.error(f"Deadline coverage adjustment failed: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return regenerated
    
    def _distribute_sessions_optimally(self, sessions: List[Dict[str, Any]], available_days: List[date], daily_load: Dict[date, int], max_per_day: int) -> List[Dict[str, Any]]:
        """Distribute sessions optimally across available days using intelligent scheduling."""
        if not sessions:
            return []
        
        redistributed = []
        
        # Group sessions by topic for better spaced repetition
        topic_sessions = {}
        for session in sessions:
            topic = session.get('topic', 'Unknown')
            if topic not in topic_sessions:
                topic_sessions[topic] = []
            topic_sessions[topic].append(session)
        
        # Distribute each topic's sessions with optimal spacing
        day_index = 0
        
        for topic, topic_session_list in topic_sessions.items():
            session_count = len(topic_session_list)
            
            if session_count == 1:
                # Single session - place on best available day
                best_day = self._find_best_available_day(available_days, daily_load, max_per_day, day_index)
                if best_day is not None:
                    session = topic_session_list[0]
                    session['date'] = best_day.isoformat()
                    redistributed.append(session)
                    daily_load[best_day] = daily_load.get(best_day, 0) + 1
                    day_index = (day_index + 1) % len(available_days)
            else:
                # Multiple sessions - space them out optimally
                optimal_spacing = max(1, len(available_days) // session_count)
                
                for i, session in enumerate(topic_session_list):
                    # Calculate target day with spacing
                    target_day_idx = (day_index + i * optimal_spacing) % len(available_days)
                    
                    # Find the best available day near the target
                    best_day = self._find_best_available_day_near_target(
                        available_days, daily_load, max_per_day, target_day_idx
                    )
                    
                    if best_day is not None:
                        session['date'] = best_day.isoformat()
                        redistributed.append(session)
                        daily_load[best_day] = daily_load.get(best_day, 0) + 1
                
                day_index = (day_index + optimal_spacing) % len(available_days)
        
        return redistributed
    
    def _find_best_available_day(self, available_days: List[date], daily_load: Dict[date, int], max_per_day: int, start_idx: int = 0) -> date:
        """Find the best available day starting from start_idx."""
        for i in range(len(available_days)):
            day_idx = (start_idx + i) % len(available_days)
            day = available_days[day_idx]
            if daily_load.get(day, 0) < max_per_day:
                return day
        
        # If no day available, return the day with minimum load
        return min(available_days, key=lambda d: daily_load.get(d, 0))
    
    def _find_best_available_day_near_target(self, available_days: List[date], daily_load: Dict[date, int], max_per_day: int, target_idx: int) -> date:
        """Find the best available day near the target index."""
        # First try the exact target
        if target_idx < len(available_days):
            target_day = available_days[target_idx]
            if daily_load.get(target_day, 0) < max_per_day:
                return target_day
        
        # Search in expanding radius around target
        for radius in range(1, len(available_days)):
            # Try before target
            before_idx = target_idx - radius
            if 0 <= before_idx < len(available_days):
                day = available_days[before_idx]
                if daily_load.get(day, 0) < max_per_day:
                    return day
            
            # Try after target  
            after_idx = target_idx + radius
            if 0 <= after_idx < len(available_days):
                day = available_days[after_idx]
                if daily_load.get(day, 0) < max_per_day:
                    return day
        
        # Fallback to day with minimum load
        return min(available_days, key=lambda d: daily_load.get(d, 0))

    def schedule(self, current_plan: Dict[str, Any], target_deadline: date, preserve_progress: bool = True, options: Dict[str, Any] = None) -> Dict[str, Any]:
        options = options or {}
        try:
            # Use the existing AI provider helper if available for complex adjustments
            from .ai_providers import adjust_plan_based_on_progress

            progress_payload = {
                'target_deadline': target_deadline.isoformat(),
                'preserve_progress': preserve_progress,
                'options': options
            }

            logger.info('📅 SmartScheduler: requesting AI-driven schedule')
            adjusted = adjust_plan_based_on_progress(current_plan, progress_payload)

            # The AI may return a dict in several shapes; normalize minimal fields
            regenerated: Dict[str, Any] = {}
            regenerated['sessions'] = adjusted.get('modified_sessions') or adjusted.get('study_sessions') or current_plan.get('sessions', [])
            regenerated['deadline'] = adjusted.get('schedule_changes', {}).get('new_completion_date') or target_deadline.isoformat()
            regenerated['changes_summary'] = {
                'adjustment_type': adjusted.get('adjustment_type', 'ai_adjusted'),
                'reason': adjusted.get('adjustment_reasoning', ''),
                'recommendations': adjusted.get('recommendations', [])
            }

            # Ensure sessions have ISO date strings; fallback to original ordering
            for s in regenerated['sessions']:
                if isinstance(s.get('date'), date):
                    s['date'] = s['date'].isoformat()

            # Post-process to ensure coverage up to target_deadline when AI didn't stretch
            regenerated = self._ensure_deadline_coverage(current_plan, regenerated, target_deadline, preserve_progress, options)
            return regenerated

        except Exception as e:
            logger.error(f'SmartScheduler failed: {e}')
            # Fallback: return minimal schedule based on current plan but with deadline
            fallback = {
                'sessions': current_plan.get('sessions', []),
                'deadline': target_deadline.isoformat(),
                'changes_summary': {'error': str(e)}
            }
            # Also ensure stretching in fallback
            return self._ensure_deadline_coverage(current_plan, fallback, target_deadline, preserve_progress, options)
