from flask import Blueprint, request
from ..utils import get_user_id_from_request
from ..errors import ApiError
from ..services.planning import generate_plan, get_current_plan

plan_bp = Blueprint("plan", __name__)


@plan_bp.post("/generate")
def generate():
    uid = get_user_id_from_request(request) or ""
    if not uid:
        raise ApiError("PLAN_400", "Missing user id")
    try:
        if request.is_json:
            data = request.get_json(silent=True) or {}
            horizon = int(data.get("horizon_days", 14))
        else:
            horizon = int(request.values.get("horizon_days", 14))
        if horizon <= 0 or horizon > 90:
            raise ValueError("horizon out of range")
    except Exception:
        raise ApiError("PLAN_400", "Invalid horizon_days")
    plan = generate_plan(user_id=uid, horizon_days=horizon)
    return plan, 200


@plan_bp.get("/current")
def current():
    uid = get_user_id_from_request(request) or ""
    plan = get_current_plan(user_id=uid)
    return plan, 200
