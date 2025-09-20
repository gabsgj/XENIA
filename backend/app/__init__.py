import warnings
import logging
import sys
import time
from flask import Flask, request, g
from flask_cors import CORS

from .config import load_config
from .errors import register_error_handlers
from .routes.analytics import analytics_bp
from .routes.analytics_progress import analytics_progress_bp
from .routes.ingest import ingest_bp
from .routes.parent import parent_bp
from .routes.plan import plan_bp
from .routes.tasks import tasks_bp
from .routes.teacher import teacher_bp
from .routes.tutor import tutor_bp
from .routes.resources import resources_bp
from .routes.upload import upload_bp
from .routes.quiz import quiz_bp
from .routes.progress import progress_bp  # Import the progress blueprint

# Suppress NumPy runtime warnings for floating-point precision issues
warnings.filterwarnings("ignore", category=RuntimeWarning, module="numpy")


def setup_logging(app: Flask):
    """Configure comprehensive logging for the Flask app"""
    # Create a custom logger
    logger = logging.getLogger('xenia')
    logger.setLevel(logging.DEBUG)
    
    # Create console handler with a higher log level
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    
    # Create formatter and add it to the handler
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(formatter)
    
    # Add the handler to the logger
    logger.addHandler(console_handler)
    
    # Set Flask's logger to use our custom logger
    app.logger = logger
    
    return logger


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, supports_credentials=True)
    load_config(app)
    
    # Setup logging
    logger = setup_logging(app)
    
    # Add request logging middleware
    @app.before_request
    def log_request_info():
        g.start_time = time.time()
        logger.info(f"🚀 REQUEST: {request.method} {request.path}")
        logger.info(f"   Headers: {dict(request.headers)}")
        if request.is_json:
            logger.info(f"   JSON Body: {request.get_json()}")
        elif request.form:
            logger.info(f"   Form Data: {dict(request.form)}")
        elif request.args:
            logger.info(f"   Query Params: {dict(request.args)}")
    
    @app.after_request
    def log_response_info(response):
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            logger.info(f"✅ RESPONSE: {response.status_code} - {duration:.3f}s")
            logger.info(f"   Response Headers: {dict(response.headers)}")
            if response.is_json:
                try:
                    response_data = response.get_json()
                    # Truncate large responses for readability
                    if isinstance(response_data, dict) and len(str(response_data)) > 500:
                        logger.info(f"   Response Body: {str(response_data)[:500]}... (truncated)")
                    else:
                        logger.info(f"   Response Body: {response_data}")
                except:
                    logger.info(f"   Response Body: <not JSON>")
        return response
    
    @app.errorhandler(Exception)
    def log_exceptions(error):
        logger.error(f"❌ EXCEPTION: {type(error).__name__}: {str(error)}")
        logger.error(f"   URL: {request.url}")
        logger.error(f"   Method: {request.method}")
        import traceback
        logger.error(f"   Traceback: {traceback.format_exc()}")
        return app.handle_exception(error)
    
    register_error_handlers(app)

    # Register blueprints
    app.register_blueprint(ingest_bp, url_prefix="/api/ingest")
    app.register_blueprint(upload_bp, url_prefix="/api/upload")
    app.register_blueprint(tutor_bp, url_prefix="/api/tutor")
    app.register_blueprint(plan_bp, url_prefix="/api/plan")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(teacher_bp, url_prefix="/api/teacher")
    app.register_blueprint(parent_bp, url_prefix="/api/parent")
    app.register_blueprint(resources_bp, url_prefix="/api/resources")
    app.register_blueprint(quiz_bp, url_prefix="/api/quiz")
    app.register_blueprint(progress_bp, url_prefix="/api/progress")  # Register the progress blueprint
    app.register_blueprint(analytics_progress_bp, url_prefix="/api/analytics/progress")

    @app.get("/health")
    def health():
        logger.info("🏥 Health check requested")
        from .supabase_client import get_supabase
        status = {"status": "ok"}
        try:
            sb = get_supabase()
            # lightweight check
            sb.table("plans").select("user_id").limit(1).execute()
            status["supabase"] = "up"
        except Exception as e:
            status["supabase"] = f"down: {e}" 
        return status

    logger.info("🚀 Flask app initialized successfully")
    return app
