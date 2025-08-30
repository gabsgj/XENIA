from typing import Dict
from ..supabase_client import get_supabase


def recompute_level(xp: int) -> Dict:
    # Level curve: level n requires 100 * n^1.25 xp
    level = 1
    remaining = xp
    while True:
        need = int(100 * (level ** 1.25))
        if remaining >= need:
            remaining -= need
            level += 1
        else:
            break
    return {"level": level, "progress": remaining, "to_next": int(100 * (level ** 1.25)) - remaining}
