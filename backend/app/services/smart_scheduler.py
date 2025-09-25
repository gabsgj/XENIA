import logging
from datetime import date
from typing import Dict, Any, List

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
            regenerated = {}
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

            return regenerated

        except Exception as e:
            logger.error(f'SmartScheduler failed: {e}')
            # Fallback: return minimal schedule based on current plan but with deadline
            fallback = {
                'sessions': current_plan.get('sessions', []),
                'deadline': target_deadline.isoformat(),
                'changes_summary': {'error': str(e)}
            }
            return fallback
