import os
from supabase import create_client, Client

_supabase: Client | None = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
            "SUPABASE_ANON_KEY", ""
        )
        if not url or not key:
            raise RuntimeError("Supabase configuration is missing")
        _supabase = create_client(url, key)
    return _supabase
