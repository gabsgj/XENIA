import warnings
import numpy as np
from flask import Flask
from flask_cors import CORS
from .config import load_config

# Suppress NumPy runtime warnings for floating-point precision issues
warnings.filterwarnings('ignore', category=RuntimeWarning, module='numpy')
from .routes.ingest import ingest_bp
from .routes.tutor import tutor_bp
from .routes.plan import plan_bp
from .routes.tasks import tasks_bp
from .routes.analytics import analytics_bp
from .routes.teacher import teacher_bp
from .routes.parent import parent_bp
from .errors import register_error_handlers


def create_app() -> Flask:
	app = Flask(__name__)
	CORS(app, supports_credentials=True)
	load_config(app)
	register_error_handlers(app)

	# Register blueprints
	app.register_blueprint(ingest_bp, url_prefix="/api/upload")
	app.register_blueprint(tutor_bp, url_prefix="/api/tutor")
	app.register_blueprint(plan_bp, url_prefix="/api/plan")
	app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
	app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
	app.register_blueprint(teacher_bp, url_prefix="/api/teacher")
	app.register_blueprint(parent_bp, url_prefix="/api/parent")

	@app.get("/health")
	def health():
		return {"status": "ok"}

	return app
