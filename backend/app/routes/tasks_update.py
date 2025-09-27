import logging
from flask import request
from ..errors import ApiError
from ..supabase_client import get_supabase
from ..routes.tasks import tasks_bp
from datetime import datetime, timezone

logger = logging.getLogger('xenia')

@tasks_bp.put("/<task_id>")
def update_task(task_id):
    """Update a task's properties."""
    logger.info(f"✏️ Update task {task_id}")
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id") or request.headers.get("X-User-Id")
    
    if not user_id:
        raise ApiError("AUTH_401", "Missing user_id")
    
    from ..utils import normalize_user_id
    norm_user_id = normalize_user_id(user_id)
    
    try:
        # Verify task belongs to user before updating
        resp = sb.table("tasks").select("id").eq("id", task_id).eq("user_id", norm_user_id).execute()
        if not resp.data:
            raise ApiError("TASK_404", "Task not found", status=404)
        
        # Prepare update data (only include fields that were provided)
        update_data = {}
        if "title" in data:
            update_data["title"] = data["title"]
        if "subject" in data:
            update_data["subject"] = data["subject"]
        if "due_date" in data:
            update_data["due_date"] = data["due_date"]
        if "dueDate" in data:
            update_data["due_date"] = data["dueDate"]
        if "duration_minutes" in data:
            update_data["duration_minutes"] = data["duration_minutes"]
        if "estimatedMinutes" in data:
            update_data["duration_minutes"] = data["estimatedMinutes"]
        if "status" in data:
            update_data["status"] = data["status"]
        if "priority" in data:
            update_data["priority"] = data["priority"]
        if "completed" in data and data["completed"]:
            update_data["status"] = "completed"
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        resp = sb.table("tasks").update(update_data).eq("id", task_id).execute()
        task = resp.data[0] if resp.data else update_data
        
        logger.info(f"   Updated task {task_id}")
        return {"task": task}
    except ApiError:
        raise
    except Exception as e:
        logger.warning(f"   Failed to update task: {e}")
        raise ApiError("DB_WRITE_FAIL", "Unable to update task")