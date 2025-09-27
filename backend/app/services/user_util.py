import logging

# Shared helper to ensure a user row exists in app tables to satisfy FKs.
# NOTE: These are app-level tables (profiles/users), not Supabase auth tables.
logger = logging.getLogger('xenia')


def ensure_user_record(sb, user_id: str) -> None:
    """Best-effort ensure a user row exists to satisfy FK constraints.

    Attempts to upsert into both 'profiles' and 'users' tables with either
    'user_id' or 'id' as the primary key, tolerating schema differences.
    """
    try:
        try:
            sb.table("profiles").upsert({"user_id": user_id}).execute()
        except Exception:
            pass
        for col in ("user_id", "id"):
            try:
                sb.table("users").upsert({col: user_id}).execute()
                break
            except Exception:
                continue
    except Exception as e:
        logger.warning(f"ensure_user_record failed for {user_id}: {e}")
