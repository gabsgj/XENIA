import logging
from flask import Blueprint, request
from ..errors import ApiError
from ..supabase_client import get_supabase
from datetime import datetime, timezone
import uuid

logger = logging.getLogger('xenia')
tasks_bp = Blueprint("tasks", __name__)

# Status mapping between database and frontend
# Database values per schema: 'todo', 'doing', 'done'
# Frontend values: 'pending', 'in-progress', 'completed'

def db_to_frontend_status(db_status: str) -> str:
    """Map database status to frontend expected status."""
    mapping = {
        'todo': 'pending',
        'doing': 'in-progress',
        'done': 'completed',
        'completed': 'completed'  # tolerate legacy value
    }
    return mapping.get(db_status, db_status)


def frontend_to_db_status(frontend_status: str) -> str:
    """Map frontend status to database status."""
    mapping = {
        'pending': 'todo',
        'in-progress': 'doing',
        'completed': 'done'
    }
    return mapping.get(frontend_status, frontend_status)

from ..services.user_util import ensure_user_record

@tasks_bp.get("/")
def get_tasks():
    logger.info("📋 Get tasks endpoint called")
    sb = get_supabase()
    user_id = request.headers.get("X-User-Id") or request.args.get("user_id")
    if not user_id:
        raise ApiError("AUTH_401", "Missing user_id")
    
    from ..utils import normalize_user_id
    norm_user_id = normalize_user_id(user_id)
    
    # Return ALL tasks for this user, not just today's
    try:
        resp = sb.table("tasks").select("*").eq("user_id", norm_user_id).execute()
        db_tasks = resp.data or []
        
        # Map database schema to frontend expected format
        tasks = []
        for db_task in db_tasks:
            tasks.append({
                "id": db_task.get("id"),
                "title": db_task.get("topic", "Untitled"),  # Map 'topic' to 'title'
                "subject": "General",  # Default since not in DB
                "due_date": db_task.get("due_date"),
                "dueDate": db_task.get("due_date"),  # Provide both formats
                "duration_minutes": 30,  # Default since not in DB
                "estimatedMinutes": 30,  # Provide both formats
                "priority": "Medium",  # Default since not in DB
                "status": db_to_frontend_status(db_task.get("status", "todo")),
                "completed": db_task.get("status") in ["done", "completed"],
                "created_at": db_task.get("created_at"),
                "user_id": db_task.get("user_id")
            })
        
        logger.info(f"   Retrieved {len(tasks)} tasks")
        return {"tasks": tasks}
    except Exception as e:
        logger.warning(f"   Failed to fetch tasks: {e}")
        raise ApiError("DB_READ_FAIL", "Unable to fetch tasks")


@tasks_bp.post("/track")
def track_session():
    logger.info("📝 Track session endpoint called")
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    
    user_id = data.get("user_id")
    topic = data.get("topic")
    duration_min = data.get("duration_min", 30)
    
    logger.info(f"   User ID: {user_id}")
    logger.info(f"   Topic: {topic}")
    logger.info(f"   Duration: {duration_min} minutes")
    
    if not user_id:
        logger.error("   Missing user_id in request")
        raise ApiError("AUTH_401", "Missing user id")
    if not topic:
        logger.error("   Missing topic in request")
        raise ApiError("PLAN_400", "Missing topic")
    
    try:
        logger.info("   Inserting session into database...")
        # Store timezone-aware UTC timestamp
        data["created_at"] = datetime.now(timezone.utc).isoformat()
        sb.table("sessions").insert(data).execute()
        logger.info("   Session inserted successfully")
        
        # XP mechanic: +10 per 30 min
        xp = max(5, (duration_min // 30) * 10)
        logger.info(f"   Awarding {xp} XP to user {user_id}")
        sb.rpc("add_xp", {"p_user_id": user_id, "p_xp": xp}).execute()
        logger.info("   XP awarded successfully")
        
        result = {"ok": True, "awarded_xp": xp}
        logger.info(f"   Session tracking completed for user {user_id}")
        return result
    except Exception as e:
        logger.warning(f"   Session tracking failed: {str(e)}")
        raise ApiError("DB_WRITE_FAIL", "Unable to store session")


@tasks_bp.post("/complete")
def complete_task():
    logger.info("✅ Complete task endpoint called")
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    
    task_id = data.get("task_id")
    user_id = data.get("user_id") or request.headers.get("X-User-Id")
    
    logger.info(f"   Task ID: {task_id}")
    logger.info(f"   User ID: {user_id}")
    
    if not task_id:
        logger.error("   Missing task_id in request")
        raise ApiError("PLAN_400", "Missing task_id")
    
    try:
        logger.info("   Updating task status to 'done'...")
        sb.table("tasks").update({"status": "done"}).eq("id", task_id).execute()
        logger.info("   Task status updated successfully")
        
        if user_id:
            try:
                logger.info(f"   Awarding 20 XP to user {user_id}")
                sb.rpc("add_xp", {"p_user_id": user_id, "p_xp": 20}).execute()
                logger.info("   XP awarded successfully")
            except Exception as xp_error:
                logger.warning(f"   XP award failed (non-fatal): {xp_error}")
        
        result = {"ok": True, "success": True}
        logger.info(f"   Task completion processed for task {task_id}")
        return result
    except Exception as e:
        logger.warning(f"   Task completion failed: {str(e)}")
        raise ApiError("DB_WRITE_FAIL", "Unable to complete task")


@tasks_bp.get('/daily')
def get_daily_tasks():
    """Return today's tasks for the authenticated user."""
    logger.info("📆 Get daily tasks")
    sb = get_supabase()
    user_id = request.headers.get("X-User-Id") or request.args.get("user_id")
    if not user_id:
        raise ApiError("AUTH_401", "Missing user_id")
    
    from ..utils import normalize_user_id
    norm_user_id = normalize_user_id(user_id)
    
    today = datetime.now(timezone.utc).date().isoformat()
    try:
        resp = sb.table("tasks").select("*").eq("user_id", norm_user_id).eq("due_date", today).execute()
        db_tasks = resp.data or []
        
        # Map database schema to frontend expected format
        tasks = []
        for db_task in db_tasks:
            tasks.append({
                "id": db_task.get("id"),
                "title": db_task.get("topic", "Untitled"),  # Map 'topic' to 'title'
                "subject": "General",  # Default since not in DB
                "due_date": db_task.get("due_date"),
                "dueDate": db_task.get("due_date"),  # Provide both formats
                "duration_minutes": 30,  # Default since not in DB
                "estimatedMinutes": 30,  # Provide both formats
                "priority": "Medium",  # Default since not in DB
                "status": db_to_frontend_status(db_task.get("status", "todo")),
                "completed": db_task.get("status") in ["done", "completed"],
                "created_at": db_task.get("created_at"),
                "user_id": db_task.get("user_id")
            })
        
        logger.info(f"   Retrieved {len(tasks)} tasks for today")
        return {"tasks": tasks}
    except Exception as e:
        logger.warning(f"   Failed to fetch today's tasks: {e}")
        raise ApiError("DB_READ_FAIL", "Unable to fetch today's tasks")


@tasks_bp.get('/upcoming')
def get_upcoming_tasks():
    logger.info("📅 Get upcoming tasks")
    sb = get_supabase()
    user_id = request.headers.get('X-User-Id') or request.args.get('user_id')
    if not user_id:
        raise ApiError('AUTH_401', 'Missing user_id')
    from ..utils import normalize_user_id
    norm_user_id = normalize_user_id(user_id)
    from datetime import datetime, timezone, timedelta
    today = datetime.now(timezone.utc).date()
    end_date = (today + timedelta(days=7)).isoformat()
    try:
        # select tasks with due_date between today and next 7 days
        resp = sb.table('tasks').select('*').eq('user_id', norm_user_id).execute()
        rows = resp.data or []
        upcoming = []
        for db_task in rows:
            due = db_task.get('due_date')
            if not due:
                continue
            try:
                from datetime import date
                d = date.fromisoformat(due)
                if today <= d <= (today + timedelta(days=7)):
                    # Map database schema to frontend expected format
                    upcoming.append({
                        "id": db_task.get("id"),
                        "title": db_task.get("topic", "Untitled"),  # Map 'topic' to 'title'
                        "subject": "General",  # Default since not in DB
                        "due_date": db_task.get("due_date"),
                        "dueDate": db_task.get("due_date"),  # Provide both formats
                        "duration_minutes": 30,  # Default since not in DB
                        "estimatedMinutes": 30,  # Provide both formats
                        "priority": "Medium",  # Default since not in DB
                        "status": db_to_frontend_status(db_task.get("status", "todo")),
                        "completed": db_task.get("status") in ["done", "completed"],
                        "created_at": db_task.get("created_at"),
                        "user_id": db_task.get("user_id")
                    })
            except Exception:
                continue
        return {'tasks': upcoming}
    except Exception as e:
        logger.warning(f'   Failed to fetch upcoming tasks: {e}')
        raise ApiError('DB_READ_FAIL', 'Unable to fetch upcoming tasks')


@tasks_bp.post('/session/start')
def start_session():
    """Create a study session tied to a task (status=in-progress)."""
    logger.info('▶️ Start session')
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id') or request.headers.get('X-User-Id')
    task_id = data.get('task_id')
    duration_min = data.get('duration_min', 25)
    if not user_id:
        raise ApiError('AUTH_401', 'Missing user_id')
    if not task_id:
        raise ApiError('PLAN_400', 'Missing task_id')
    try:
        from datetime import datetime, timezone
        record = {
            'user_id': user_id,
            'task_id': task_id,
            'duration_min': duration_min,
            'status': 'in-progress',
            'started_at': datetime.now(timezone.utc).isoformat()
        }
        sb.table('sessions').insert(record).execute()
        # mark task as in-progress
        sb.table('tasks').update({'status': 'doing'}).eq('id', task_id).execute()
        return {'ok': True, 'session': record}
    except Exception as e:
        logger.warning(f'   Failed to start session: {e}')
        raise ApiError('DB_WRITE_FAIL', 'Unable to start session')


@tasks_bp.put('/session/end')
def end_session():
    """Mark a study session as completed."""
    logger.info('⏹️ End session')
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    session_id = data.get('session_id')
    task_id = data.get('task_id')
    user_id = data.get('user_id') or request.headers.get('X-User-Id')
    if not session_id and not task_id:
        raise ApiError('PLAN_400', 'Missing session_id or task_id')
    try:
        if session_id:
            sb.table('sessions').update({'status': 'completed'}).eq('id', session_id).execute()
        if task_id:
            sb.table('tasks').update({'status': 'done'}).eq('id', task_id).execute()
            if user_id:
                sb.rpc('add_xp', {'p_user_id': user_id, 'p_xp': 20}).execute()
        return {'ok': True}
    except Exception as e:
        logger.warning(f'   Failed to end session: {e}')
        raise ApiError('DB_WRITE_FAIL', 'Unable to end session')


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
        
        # Prepare update data - map to actual database schema
        update_data = {}
        if "title" in data:
            update_data["topic"] = data["title"]  # Map 'title' to 'topic'
        if "due_date" in data:
            update_data["due_date"] = data["due_date"]
        if "dueDate" in data:
            update_data["due_date"] = data["dueDate"]
        if "status" in data:
            update_data["status"] = frontend_to_db_status(data["status"])
        if "completed" in data and data["completed"]:
            update_data["status"] = "done"
        
        resp = sb.table("tasks").update(update_data).eq("id", task_id).execute()
        
        # Map response back to frontend format
        if resp.data and len(resp.data) > 0:
            db_task = resp.data[0]
            task = {
                "id": db_task.get("id"),
                "title": db_task.get("topic", "Untitled"),  # Map 'topic' back to 'title'
                "subject": data.get("subject", "General"),  # Preserve from request
                "due_date": db_task.get("due_date"),
                "dueDate": db_task.get("due_date"),
                "duration_minutes": data.get("duration_minutes", data.get("estimatedMinutes", 30)),
                "estimatedMinutes": data.get("estimatedMinutes", data.get("duration_minutes", 30)),
                "priority": data.get("priority", "Medium"),
                "status": db_to_frontend_status(db_task.get("status", "todo")),
                "completed": db_task.get("status") in ["done", "completed"],
                "user_id": db_task.get("user_id")
            }
        else:
            task = update_data
        
        logger.info(f"   Updated task {task_id}")
        return {"task": task}
    except ApiError:
        raise
    except Exception as e:
        logger.warning(f"   Failed to update task: {e}")
        raise ApiError("DB_WRITE_FAIL", "Unable to update task")


@tasks_bp.put('/reorder')
def reorder_tasks():
    """Persist a new ordering for tasks. Expects JSON: { order: [task_id,...], user_id?: string }"""
    logger.info('🔀 Reorder tasks')
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    order = data.get('order') or []
    user_id = data.get('user_id') or request.headers.get('X-User-Id')
    if not user_id:
        raise ApiError('AUTH_401', 'Missing user_id')
    try:
        # Save an 'priority_index' on each task based on the order list
        for idx, tid in enumerate(order):
            try:
                sb.table('tasks').update({'priority_index': idx}).eq('id', tid).execute()
            except Exception:
                logger.warning(f'   Failed to update task {tid} priority')
        return {'ok': True}
    except Exception as e:
        logger.warning(f'   Failed to reorder tasks: {e}')
        raise ApiError('DB_WRITE_FAIL', 'Unable to reorder tasks')


@tasks_bp.post("/")
def create_task():
    logger.info("➕ Create task endpoint called")
    sb = get_supabase()
    data = request.get_json(silent=True) or {}
    
    user_id = data.get("user_id") or request.headers.get("X-User-Id")
    title = data.get("title")
    due_date = data.get("due_date") or data.get("dueDate")
    duration_minutes = data.get("duration_minutes", data.get("estimatedMinutes", 30))
    subject = data.get("subject", "General")
    priority = data.get("priority", "Medium")
    
    if not user_id:
        raise ApiError("AUTH_401", "Missing user_id")
    if not title:
        raise ApiError("PLAN_400", "Missing title")
    
    from ..utils import normalize_user_id
    norm_user_id = normalize_user_id(user_id)
    
    try:
        from datetime import datetime, timezone
        # Map to actual database schema
        task_data = {
            "user_id": norm_user_id,
            "topic": title,  # Database uses 'topic' instead of 'title'
            "status": "todo",  # Database uses 'todo' instead of 'pending'
            "due_date": due_date,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        # Ensure user exists to satisfy FK (handles first-visit random UUIDs)
        ensure_user_record(sb, norm_user_id)
        
        resp = sb.table("tasks").insert(task_data).execute()
        
        # Map database response back to expected format
        if resp.data and len(resp.data) > 0:
            db_task = resp.data[0]
            task = {
                "id": db_task.get("id"),
                "title": db_task.get("topic", title),  # Map 'topic' back to 'title'
                "subject": subject,
                "due_date": db_task.get("due_date"),
                "dueDate": db_task.get("due_date"),  # Provide both formats
                "duration_minutes": duration_minutes,
                "estimatedMinutes": duration_minutes,  # Provide both formats
                "priority": priority,
                "status": db_to_frontend_status(db_task.get("status", "todo")),
                "created_at": db_task.get("created_at"),
                "user_id": db_task.get("user_id")
            }
        else:
            # Fallback if no response data (e.g., mock client)
            task = {
                "id": str(uuid.uuid4()),
                "title": title,
                "subject": subject,
                "due_date": due_date,
                "dueDate": due_date,
                "duration_minutes": duration_minutes,
                "estimatedMinutes": duration_minutes,
                "priority": priority,
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "user_id": norm_user_id,
            }
        
        logger.info(f"   Created task: {title}")
        return {"task": task}
    except Exception as e:
        logger.warning(f"   Failed to create task: {e}")
        raise ApiError("DB_WRITE_FAIL", "Unable to create task", details={"cause": str(e)})


@tasks_bp.delete("/<task_id>")
def delete_task(task_id):
    logger.info(f"🗑️ Delete task {task_id}")
    sb = get_supabase()
    user_id = request.headers.get("X-User-Id") or request.args.get("user_id")
    
    if not user_id:
        raise ApiError("AUTH_401", "Missing user_id")
    
    from ..utils import normalize_user_id
    norm_user_id = normalize_user_id(user_id)
    
    try:
        # Verify task belongs to user before deleting
        resp = sb.table("tasks").select("id").eq("id", task_id).eq("user_id", norm_user_id).execute()
        if not resp.data:
            raise ApiError("TASK_404", "Task not found", status=404)
        
        sb.table("tasks").delete().eq("id", task_id).execute()
        logger.info(f"   Deleted task {task_id}")
        return {"ok": True}
    except ApiError:
        raise
    except Exception as e:
        logger.warning(f"   Failed to delete task: {e}")
        raise ApiError("DB_WRITE_FAIL", "Unable to delete task")
