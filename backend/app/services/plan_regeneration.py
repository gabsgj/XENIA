import logging
from datetime import date
from typing import List, Optional

from .smart_scheduler import SmartScheduler

logger = logging.getLogger('xenia.plan_regeneration')


class PlanRegenerationService:
    def __init__(self, gemini_client=None, supabase_client=None):
        # Clients can be injected; for now we keep them optional
        self.ai = gemini_client
        self.db = supabase_client
        # Use SmartScheduler which will call AI providers internally
        self.scheduler = SmartScheduler(ai_client=gemini_client)

    def regenerate_with_deadline(self,
                                  current_plan: dict,
                                  new_deadline: date,
                                  preserve_progress: bool = True,
                                  priority_adjustment: Optional[str] = None,
                                  learning_pace: Optional[str] = None,
                                  excluded_topics: Optional[List[str]] = None,
                                  hours_per_day: Optional[float] = None):
        """Regenerate a plan using an AI-backed SmartScheduler while preserving
        completed tasks and respecting topic dependencies and spaced repetition.
        """
        excluded_topics = excluded_topics or []

        # Copy current plan to avoid mutating input
        current_copy = dict(current_plan)

        # Prepare options for scheduler
        options = {
            'priority_adjustment': priority_adjustment,
            'learning_pace': learning_pace,
            'excluded_topics': excluded_topics,
            'preserve_progress': preserve_progress
        }

        # Respect hours/day as a secondary constraint via a per-day session cap (45m per session)
        if hours_per_day is not None:
            try:
                max_sessions = max(1, int((float(hours_per_day) * 60) // 45))
                options['max_sessions_per_day'] = max_sessions
            except Exception:
                pass

        logger.info('   Invoking SmartScheduler with options: %s', options)
        regenerated = self.scheduler.schedule(current_copy, new_deadline, preserve_progress=preserve_progress, options=options)

        # Merge preserved completed sessions if requested
        if preserve_progress:
            sessions = current_copy.get('sessions', [])
            completed_sessions = [s for s in sessions if s.get('status') == 'completed']
            # Prepend completed sessions if they are not present in regenerated
            regenerated_sessions = regenerated.get('sessions', [])
            # Avoid duplicating completed ones by topic+date
            existing_keys = {(s.get('topic'), s.get('date')) for s in regenerated_sessions}
            merged = []
            for c in completed_sessions:
                key = (c.get('topic'), c.get('date'))
                if key not in existing_keys:
                    merged.append(c)
            merged.extend(regenerated_sessions)
            regenerated['sessions'] = merged

        logger.info('   Plan regeneration complete; sessions=%d', len(regenerated.get('sessions', [])))
        return regenerated
