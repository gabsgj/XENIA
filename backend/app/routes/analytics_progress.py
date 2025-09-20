from flask import Blueprint, request, jsonify
from ..supabase_client import get_supabase
import datetime

analytics_progress_bp = Blueprint("analytics_progress", __name__)

@analytics_progress_bp.get("/user/<user_id>/aggregates")
def get_user_aggregates(user_id):
    sb = get_supabase()
    try:
        # Aggregate across topics for the user
        rows = sb.table("user_progress").select("*").eq("user_id", user_id).execute().data or []
        total_quizzes = sum(r.get("quizzes_taken", 0) for r in rows)
        total_correct = sum(r.get("correct", 0) for r in rows)
        total_wrong = sum(r.get("wrong", 0) for r in rows)
        avg_score = (sum((r.get("last_score", 0.0) for r in rows)) / len(rows)) if rows else 0.0
        return jsonify({"success": True, "aggregates": {"total_quizzes": total_quizzes, "total_correct": total_correct, "total_wrong": total_wrong, "avg_score": avg_score}})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@analytics_progress_bp.get("/user/<user_id>/weekly")
def get_user_weekly(user_id):
    sb = get_supabase()
    # Return last 7 days counts per day for quizzes taken
    today = datetime.datetime.utcnow().date()
    start = today - datetime.timedelta(days=6)
    try:
        rows = sb.table("user_progress_history").select("*").eq("user_id", user_id).execute().data or []
        # Filter rows in date range
        counts = {}
        for i in range(7):
            day = (start + datetime.timedelta(days=i)).isoformat()
            counts[day] = 0
        for r in rows:
            created = r.get("created_at")
            if not created:
                continue
            day = created.split("T")[0]
            if day in counts:
                counts[day] += 1
        series = [{"date": d, "quizzes": counts[d]} for d in sorted(counts.keys())]
        return jsonify({"success": True, "weekly": series})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
