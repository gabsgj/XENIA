from flask import Blueprint, request
from ..utils import get_user_id_from_request
from ..services.planning import generate_plan, get_current_plan

plan_bp = Blueprint("plan", __name__)


@plan_bp.post("/generate")
def generate():
	uid = get_user_id_from_request(request) or ""
	horizon = int((request.json or {}).get("horizon_days", 14)) if request.is_json else int(request.values.get("horizon_days", 14))
	plan = generate_plan(user_id=uid, horizon_days=horizon)
	return plan, 200


@plan_bp.get("/current")
def current():
	uid = get_user_id_from_request(request) or ""
	plan = get_current_plan(user_id=uid)
	return plan, 200
