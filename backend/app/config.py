import os
from flask import Flask
from dotenv import load_dotenv, find_dotenv


OPTIONAL_ENV_VARS = [
    ("SUPABASE_URL", ""),
    ("SUPABASE_ANON_KEY", ""),
    ("SUPABASE_SERVICE_ROLE_KEY", ""),
    ("OPENAI_API_KEY", ""),
    ("GEMINI_API_KEY", ""),
    ("ANTHROPIC_API_KEY", ""),
    ("ARTIFACTS_BUCKET", "artifacts"),
    ("EMBEDDING_PROVIDER", "gemini"),
    ("EMBEDDING_MODEL", "text-embedding-004"),
]


def load_config(app: Flask) -> None:
    """Load environment variables into Flask config.

    Search order:
      1. backend/.env (working directory when running run.py)
      2. project root .env (one level up) if backend/.env not present
    """
    env_path = find_dotenv(usecwd=True)
    if not env_path:
        # try parent directory
        parent_path = os.path.abspath(os.path.join(os.getcwd(), '..', '.env'))
        if os.path.exists(parent_path):
            load_dotenv(parent_path)
    else:
        load_dotenv(env_path)
    for key, default in OPTIONAL_ENV_VARS:
        app.config[key] = os.getenv(key, default)
