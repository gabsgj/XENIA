import os
from flask import Flask
from dotenv import load_dotenv


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
    # Load .env then map into app config; permissive for dev/health
    load_dotenv()
    for key, default in OPTIONAL_ENV_VARS:
        app.config[key] = os.getenv(key, default)
