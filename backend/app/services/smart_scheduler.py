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
        """If regenerated sessions do not reach the target deadline, stretch remaining sessions across the horizon.

        Strategy:
        - Keep completed sessions (if preserve_progress).
        - Redistribute non-completed sessions from today through target_deadline respecting a max sessions per day cap.
        - If capacity is insufficient to place all remaining sessions within the deadline, extend the schedule beyond the deadline.
        - Preserve per-session duration/focus/topic; only dates change.
        """
        try:
            sessions: List[Dict[str, Any]] = list(regenerated.get('sessions') or [])
            if not sessions:
                return regenerated

            # Settings
            try:
                env_cap = int(os.getenv('SMART_SCHEDULER_MAX_SESSIONS_PER_DAY', '').strip() or 0)
            except Exception:
                env_cap = 0
            max_per_day = 0
            opt_cap = options.get('max_sessions_per_day') if isinstance(options, dict) else None
            if isinstance(opt_cap, int) and opt_cap > 0:
                max_per_day = opt_cap
            elif env_cap > 0:
                max_per_day = env_cap
            else:
                max_per_day = 6  # sensible default

            # Compute horizon
            today = date.today()
            if target_deadline < today:
                target_deadline = today

            # Determine if the plan already reaches the deadline
            def _parse_date(d: Any) -> date:
                if isinstance(d, date):
                    return d
                if isinstance(d, str):
                    try:
                        return datetime.strptime(d[:10], '%Y-%m-%d').date()
                    except Exception:
                        return today
                return today

            # Partition sessions
            completed, remaining = [], []
            for s in sessions:
                (completed if (preserve_progress and (s.get('status') == 'completed')) else remaining).append(dict(s))

            # Build initial date range
            dates: List[date] = []
            d = today
            while d <= target_deadline:
                dates.append(d)
                d += timedelta(days=1)

            # Current load per date (count completed sessions on those dates)
            load = {dt: 0 for dt in dates}
            for s in completed:
                sd = _parse_date(s.get('date'))
                if sd in load:
                    load[sd] = load.get(sd, 0) + 1

            # Create capacity slots (date repeated available capacity times)
            def build_slots(current_dates: List[date]) -> List[date]:
                slots: List[date] = []
                for dt in current_dates:
                    cap = max(0, max_per_day - load.get(dt, 0))
                    if cap > 0:
                        slots.extend([dt] * cap)
                return slots

            slots = build_slots(dates)

            # If not enough capacity, extend beyond deadline day by day until enough
            extended_deadline = target_deadline
            while len(slots) < len(remaining):
                extended_deadline = extended_deadline + timedelta(days=1)
                dates.append(extended_deadline)
                load[extended_deadline] = 0
                slots = build_slots(dates)

            # Assign remaining sessions to dates spread across the horizon
            redistributed: List[Dict[str, Any]] = []
            total_days = len(dates)
            total_remaining = len(remaining)

            def find_slot(start_idx: int) -> date:
                # Prefer forward from start_idx, else backward
                for j in range(start_idx, total_days):
                    if load.get(dates[j], 0) < max_per_day:
                        return dates[j]
                for j in range(start_idx - 1, -1, -1):
                    if load.get(dates[j], 0) < max_per_day:
                        return dates[j]
                # Should not happen due to capacity extension; fallback to last day
                return dates[-1]

            for i, s in enumerate(remaining):
                if total_remaining > 1:
                    # Evenly spread index across [0, total_days-1]
                    target_pos = round(i * (total_days - 1) / (total_remaining - 1))
                else:
                    target_pos = 0
                assign_date = find_slot(max(0, min(total_days - 1, target_pos)))
                ns = dict(s)
                ns['date'] = assign_date.isoformat()
                if ns.get('status') != 'completed':
                    ns['status'] = ns.get('status') or 'pending'
                redistributed.append(ns)
                load[assign_date] = load.get(assign_date, 0) + 1

            merged = completed + redistributed
            merged.sort(key=lambda x: _parse_date(x.get('date')))

            regenerated['sessions'] = merged
            regenerated['deadline'] = extended_deadline.isoformat() if extended_deadline != target_deadline else target_deadline.isoformat()
            changes = regenerated.get('changes_summary') or {}
            if extended_deadline != target_deadline:
                changes['deadline_extended'] = True
                changes['extended_to'] = regenerated['deadline']
            changes['max_sessions_per_day'] = max_per_day
            regenerated['changes_summary'] = changes
            regenerated['generation_method'] = (regenerated.get('generation_method') or '') + '+deadline_stretched_capped'
            return regenerated
        except Exception as e:
            logger.warning(f"Deadline coverage adjustment failed: {e}")
            return regenerated

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
