import os
import logging
from flask import Flask
from dotenv import load_dotenv, find_dotenv
from typing import List, Tuple, Dict, Any

logger = logging.getLogger('xenia')

# Required environment variables that must be set
REQUIRED_ENV_VARS = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY", 
    "SUPABASE_SERVICE_ROLE_KEY",
]

# Optional environment variables with defaults
OPTIONAL_ENV_VARS = [
    ("OPENAI_API_KEY", ""),
    ("GEMINI_API_KEY", ""),
    ("ANTHROPIC_API_KEY", ""),
    ("YOUTUBE_API_KEY", ""),
    ("ARTIFACTS_BUCKET", "artifacts"),
    ("EMBEDDING_PROVIDER", "gemini"),
    ("EMBEDDING_MODEL", "text-embedding-004"),
    ("MAX_FILE_SIZE_MB", "50"),
    ("ALLOWED_FILE_TYPES", "pdf,doc,docx,txt,png,jpg,jpeg"),
    ("SECRET_KEY", "dev-secret-key-change-in-production"),
    ("CORS_ORIGINS", "http://localhost:3000"),
    ("RATE_LIMIT_PER_MINUTE", "60"),
    ("MAX_CONTENT_LENGTH", "52428800"),
    ("SESSION_TIMEOUT_HOURS", "24"),
    ("AI_REQUEST_TIMEOUT_SECONDS", "30"),
    ("AI_RATE_LIMIT_PER_MINUTE", "20"),
    ("AI_FALLBACK_ENABLED", "true"),
    ("DB_POOL_SIZE", "10"),
    ("DB_MAX_OVERFLOW", "20"),
    ("DB_POOL_TIMEOUT", "30"),
    ("DB_POOL_RECYCLE", "3600"),
    ("ENABLE_ERROR_TRACKING", "false"),
    ("ENABLE_PERFORMANCE_MONITORING", "false"),
    ("SLOW_QUERY_THRESHOLD_MS", "1000"),
    ("HEALTH_CHECK_TIMEOUT", "5"),
    ("ENABLE_DETAILED_HEALTH_CHECKS", "true"),
]

class ConfigValidationError(Exception):
    """Raised when configuration validation fails."""
    pass

def validate_config() -> Dict[str, Any]:
    """
    Validate environment configuration and return validation results.
    
    Returns:
        Dict with validation results and warnings
        
    Raises:
        ConfigValidationError: If critical configuration is missing
    """
    validation_results = {
        "valid": True,
        "errors": [],
        "warnings": [],
        "ai_providers": [],
        "missing_optional": []
    }
    
    # Check required variables
    missing_required = []
    for var in REQUIRED_ENV_VARS:
        value = os.getenv(var)
        if not value or value.strip() == "":
            missing_required.append(var)
    
    if missing_required:
        validation_results["valid"] = False
        validation_results["errors"].append(f"Missing required environment variables: {', '.join(missing_required)}")
    
    # Check AI provider keys
    ai_providers = []
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY") 
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    if gemini_key and not _is_demo_key(gemini_key):
        ai_providers.append("Gemini")
    if openai_key and not _is_demo_key(openai_key):
        ai_providers.append("OpenAI")
    if anthropic_key and not _is_demo_key(anthropic_key):
        ai_providers.append("Anthropic")
    
    validation_results["ai_providers"] = ai_providers
    
    if not ai_providers:
        validation_results["warnings"].append("No valid AI provider keys found. AI features will use fallback responses.")
    
    # Check Supabase configuration
    supabase_url = os.getenv("SUPABASE_URL", "")
    if supabase_url and not supabase_url.startswith("https://"):
        validation_results["warnings"].append("SUPABASE_URL should use HTTPS in production")
    
    # Check secret key
    secret_key = os.getenv("SECRET_KEY", "")
    if secret_key == "dev-secret-key-change-in-production":
        validation_results["warnings"].append("Using default SECRET_KEY. Change this in production!")
    
    # Check file size limits
    try:
        max_file_size = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
        if max_file_size > 100:
            validation_results["warnings"].append(f"MAX_FILE_SIZE_MB is quite large ({max_file_size}MB). Consider reducing for better performance.")
    except ValueError:
        validation_results["warnings"].append("MAX_FILE_SIZE_MB is not a valid number")
    
    # Check timeout settings
    try:
        ai_timeout = int(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "30"))
        if ai_timeout > 60:
            validation_results["warnings"].append(f"AI_REQUEST_TIMEOUT_SECONDS is quite high ({ai_timeout}s). Consider reducing for better UX.")
    except ValueError:
        validation_results["warnings"].append("AI_REQUEST_TIMEOUT_SECONDS is not a valid number")
    
    return validation_results

def _is_demo_key(key: str) -> bool:
    """Check if API key is a demo/placeholder key."""
    if not key:
        return True
    
    key_lower = key.lower()
    demo_patterns = [
        "demo", "test", "placeholder", "your-", "example",
        "sk-demo-", "airasydemo_", "sk-ant-demo-"
    ]
    
    return any(pattern in key_lower for pattern in demo_patterns)

def load_config(app: Flask) -> None:
    """
    Load and validate environment variables into Flask config.

    Search order:
      1. backend/.env (working directory when running run.py)
      2. project root .env (one level up) if backend/.env not present
      
    Raises:
        ConfigValidationError: If critical configuration is missing
    """
    # Load environment variables
    env_path = find_dotenv(usecwd=True)
    if not env_path:
        # try parent directory
        parent_path = os.path.abspath(os.path.join(os.getcwd(), '..', '.env'))
        if os.path.exists(parent_path):
            load_dotenv(parent_path)
            logger.info(f"Loaded environment from: {parent_path}")
        else:
            logger.warning("No .env file found. Using system environment variables only.")
    else:
        load_dotenv(env_path)
        logger.info(f"Loaded environment from: {env_path}")
    
    # Validate configuration
    try:
        validation_results = validate_config()
        
        # Log validation results
        if validation_results["ai_providers"]:
            logger.info(f"✅ AI Providers available: {', '.join(validation_results['ai_providers'])}")
        
        for warning in validation_results["warnings"]:
            logger.warning(f"⚠️ Config Warning: {warning}")
        
        if not validation_results["valid"]:
            for error in validation_results["errors"]:
                logger.error(f"❌ Config Error: {error}")
            raise ConfigValidationError(f"Configuration validation failed: {'; '.join(validation_results['errors'])}")
        
        logger.info("✅ Configuration validation passed")
        
    except Exception as e:
        logger.error(f"Configuration validation failed: {e}")
        if isinstance(e, ConfigValidationError):
            raise
        else:
            logger.warning("Continuing with potentially invalid configuration...")
    
    # Load all environment variables into Flask config
    for key in REQUIRED_ENV_VARS:
        app.config[key] = os.getenv(key, "")
    
    for key, default in OPTIONAL_ENV_VARS:
        app.config[key] = os.getenv(key, default)
    
    # Set Flask-specific configurations
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', '52428800'))  # 50MB
    
    # Environment-specific settings
    flask_env = os.getenv('FLASK_ENV', 'development')
    if flask_env == 'production':
        app.config['DEBUG'] = False
        app.config['TESTING'] = False
    else:
        app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
        app.config['TESTING'] = False
    
    logger.info(f"Flask configuration loaded for {flask_env} environment")
