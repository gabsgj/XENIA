from datetime import date, timedelta
from typing import List, Dict

def calculate_minimum_time(topics: List[Dict]) -> float:
    """Estimate minimum hours needed for a list of topics based on durations.
    Topics expected to have 'estimated_minutes' or sessions attached elsewhere.
    """
    total_minutes = 0
    for t in topics:
        total_minutes += t.get('estimated_minutes', t.get('duration_min', 30))
    return total_minutes / 60.0


def calculate_available_time(new_deadline: date) -> Dict:
    today = date.today()
    days = max(1, (new_deadline - today).days)
    # assume 2 hours/day available by default for calculation
    return {
        'days': days,
        'total_hours': days * 2
    }


def calculate_realistic_deadline(remaining_content) -> str:
    # crude: assume 2 hours/day
    hours = remaining_content.get('estimated_hours', remaining_content) if isinstance(remaining_content, dict) else float(remaining_content)
    days = int((hours / 2.0) + 0.9999)
    return (date.today() + timedelta(days=days)).isoformat()
