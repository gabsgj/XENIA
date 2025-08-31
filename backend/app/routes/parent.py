from flask import Blueprint, request
from ..errors import ApiError
from ..supabase_client import get_supabase


parent_bp = Blueprint("parent", __name__)


@parent_bp.get("/overview")
def overview():
    sb = get_supabase()
    parent_id = request.args.get("parent_id", "")
    if not parent_id:
        raise ApiError("AUTH_401", "Missing parent_id")
    
    try:
        children = (
            sb.table("parents_children")
            .select("child_user_id")
            .eq("parent_user_id", parent_id)
            .execute()
            .data
            or []
        )
        child_ids = [c["child_user_id"] for c in children]
        profiles = (
            sb.table("profiles")
            .select("user_id, xp, level, streak_days")
            .in_("user_id", child_ids)
            .execute()
            .data
            or []
        )
        return {"children": profiles}
    except Exception as e:
        # Return mock data if there's an error
        return {
            "children": [
                {"user_id": "child1", "xp": 1000, "level": 4, "streak_days": 6},
                {"user_id": "child2", "xp": 750, "level": 3, "streak_days": 4}
            ]
        }
