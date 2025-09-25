from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool
import os


def create_db_engine():
    """Create and return a SQLAlchemy engine for direct Postgres connections.

    SUPABASE_URL is expected to be the HTTP URL (https://...). For direct
    Postgres access we replace https:// with postgresql:// and rely on the
    environment providing a valid DB DSN in SUPABASE_DB_URL if available.
    """
    # Prefer an explicit DB URL if provided
    db_url = os.getenv('SUPABASE_DB_URL')
    if not db_url:
        supabase_url = os.getenv('SUPABASE_URL', '')
        if not supabase_url:
            raise RuntimeError('No SUPABASE_DB_URL or SUPABASE_URL configured')
        # naive conversion: replace https://project.supabase.co with postgresql://<project>.supabase.co
        # In many deployments you should supply SUPABASE_DB_URL instead.
        db_url = supabase_url.replace('https://', 'postgresql://')

    return create_engine(
        db_url,
        poolclass=QueuePool,
        pool_size=int(os.getenv('DB_POOL_SIZE', '10')),
        max_overflow=int(os.getenv('DB_MAX_OVERFLOW', '5')),
        pool_pre_ping=True,
        pool_recycle=int(os.getenv('DB_POOL_RECYCLE', '3600')),
        connect_args={
            "connect_timeout": int(os.getenv('DB_CONNECT_TIMEOUT', '10')),
            "application_name": os.getenv('DB_APP_NAME', 'xenia-backend')
        }
    )
