from typing import Dict, List, Optional
from datetime import datetime, timedelta, timezone
from ..supabase_client import get_supabase
from .weaktopics import get_weak_topics
from .topic_store import get_topics as store_get_topics
from ..utils import normalize_user_id, is_valid_uuid
from ..supabase_client import get_supabase
from .deadline_manager import DeadlineManager, StudyPlanOptimizer
import logging

logger = logging.getLogger('xenia')


def _distribute_sessions(topics: List[Dict], days: int, hours_per_day: float) -> List[Dict]:
    sessions = []
    # Use timezone-aware UTC date (avoids deprecated datetime.utcnow())
    today = datetime.now(timezone.utc).date()
    total = max(1, sum(max(1, t.get("score", 1)) for t in topics))
    for idx, t in enumerate(topics):
        weight = max(1, t.get("score", 1))
        base_sessions = max(1, round(days * weight / total * 3))
        # Adjust session count relative to available hours (each session ~45m)
        capacity_sessions = max(1, int(hours_per_day * 60 / 45))
        count = max(1, min(base_sessions, days * capacity_sessions))
        for i in range(count):
            date = today + timedelta(days=(idx + i) % days)
            sessions.append({
                "date": str(date),
                "topic": t["topic"],
                "focus": "practice + review",
                "duration_min": 45,
            })
    sessions.sort(key=lambda s: s["date"])
    return sessions[: days * 6]  # cap


def generate_plan(
    user_id: str, 
    horizon_days: int = 14, 
    preferred_hours_per_day: float = 1.5, 
    deadline: Optional[str] = None,
    learning_style: str = "balanced",
    extracted_topics: List[str] = None,
    topic_details: List[Dict] = None
) -> Dict:
    """Generate an intelligent, AI-optimized study plan."""
    logger.info(f"🎯 Generating AI-optimized plan for user {user_id}")
    logger.info(f"   Learning style: {learning_style}, Topics provided: {len(extracted_topics or [])}")
    
    norm_user_id = normalize_user_id(user_id)

    # 1. Prioritize extracted topics from upload if available
    syllabus_topics: List[str] = []
    enhanced_topic_data: List[Dict] = []
    
    # Use extracted topics first (from recent upload)
    if extracted_topics and len(extracted_topics) > 0:
        logger.info(f"   Using {len(extracted_topics)} extracted topics from upload")
        syllabus_topics = extracted_topics
        
        # Use detailed topic metadata if available
        if topic_details and len(topic_details) > 0:
            enhanced_topic_data = []
            for i, topic in enumerate(extracted_topics):
                # Find matching detail or create basic entry
                detail = None
                if i < len(topic_details):
                    detail = topic_details[i]
                    if isinstance(detail, dict) and detail.get('topic'):
                        enhanced_topic_data.append({
                            "topic": detail.get('topic', topic),
                            "score": detail.get('difficulty_score', detail.get('score', 5)),
                            "category": detail.get('category', 'general'),
                            "estimated_hours": detail.get('estimated_hours', 3),
                            "priority": detail.get('priority', 'medium'),
                            "prerequisites": detail.get('prerequisites', []),
                            "learning_objectives": detail.get('learning_objectives', []),
                            "suggested_resources": detail.get('suggested_resources', [])
                        })
                    else:
                        enhanced_topic_data.append({"topic": topic, "score": 5, "estimated_hours": 3})
                else:
                    enhanced_topic_data.append({"topic": topic, "score": 5, "estimated_hours": 3})
        else:
            enhanced_topic_data = [{"topic": t, "score": 5, "estimated_hours": 3} for t in syllabus_topics]
    
    # 2. Fallback to database topics if no extracted topics
    elif is_valid_uuid(norm_user_id):
        try:
            sb = get_supabase()
            resp = sb.table("syllabus_topics").select("topic, order_index, metadata").eq("user_id", norm_user_id).order("order_index").limit(200).execute()
            
            for r in (resp.data or []):
                topic_name = r["topic"]
                syllabus_topics.append(topic_name)
                
                # Extract enhanced metadata if available
                metadata = r.get("metadata", {})
                if isinstance(metadata, dict):
                    enhanced_topic_data.append({
                        "topic": topic_name,
                        "score": metadata.get("score", 5),
                        "category": metadata.get("category", "general"),
                        "estimated_hours": metadata.get("estimated_hours", 3),
                        "priority": metadata.get("priority", "medium"),
                        "prerequisites": metadata.get("prerequisites", [])
                    })
                else:
                    enhanced_topic_data.append({"topic": topic_name, "score": 5, "estimated_hours": 3})
                    
        except Exception as e:
            logger.warning(f"Could not load enhanced topic data from DB: {e}")
            syllabus_topics = []
            enhanced_topic_data = []
    
    # 3. Fallback to in-memory store (development users)
    if not syllabus_topics:
        syllabus_topics = store_get_topics(norm_user_id)
        enhanced_topic_data = [{"topic": t, "score": 5, "estimated_hours": 3} for t in syllabus_topics]

    weak: List[Dict] = []
    
    # Use enhanced topic data if available, otherwise convert to weak topics format
    if enhanced_topic_data:
        weak = enhanced_topic_data
        logger.info(f"   Using {len(weak)} enhanced topics for planning")
    elif syllabus_topics:
        weak = [{"topic": t, "score": 5} for t in syllabus_topics]
        logger.info(f"   Using {len(weak)} basic syllabus topics")
    else:
        # 2. Derive weak topics heuristically from artifacts
        try:
            weak = get_weak_topics(norm_user_id)
            logger.info(f"   Using {len(weak)} heuristic weak topics")
        except Exception:
            weak = []
        # 3. Final fallback
        if not weak:
            weak = [{"topic": "General Review", "score": 1}]
            logger.info("   Using fallback topics")
    
    # Smart deadline handling with advanced urgency calculation
    urgency_level, urgency_multiplier = DeadlineManager.calculate_urgency_level(deadline, horizon_days)
    
    if deadline:
        try:
            dd = datetime.fromisoformat(deadline).date()
            today = datetime.now(timezone.utc).date()
            delta = (dd - today).days
            if delta > 0:
                original_horizon = horizon_days
                horizon_days = min(horizon_days, delta)
                logger.info(f"   Adjusted horizon to {horizon_days} days due to deadline")
        except Exception as e:
            logger.warning(f"   Invalid deadline format: {e}")
    
    logger.info(f"   Urgency level: {urgency_level} (multiplier: {urgency_multiplier:.2f}x)")
    
    # Prioritize topics based on urgency and importance
    prioritized_topics = DeadlineManager.prioritize_topics(weak, urgency_level)
    
    # Try advanced AI-powered intelligent scheduling first
    try:
        from .ai_providers import generate_enhanced_study_plan_with_resources
        logger.info("   Attempting enhanced AI-powered study plan generation...")
        
        user_preferences = {
            "hours_per_day": preferred_hours_per_day * urgency_multiplier,
            "learning_style": "balanced",  # Could be user-configurable
            "difficulty_preference": "intensive" if urgency_multiplier > 1.5 else "gradual",
            "urgency_level": urgency_level
        }
        
        ai_plan = generate_enhanced_study_plan_with_resources(
            topics=prioritized_topics,
            horizon_days=horizon_days,
            deadline=deadline,
            user_preferences=user_preferences,
            learning_style=learning_style,
            extracted_topics=extracted_topics
        )
        
        if ai_plan and "study_sessions" in ai_plan and ai_plan["study_sessions"]:
            logger.info(f"   ✅ Enhanced AI plan generated with {len(ai_plan['study_sessions'])} sessions")
            
            # Apply learning science optimizations to the enhanced sessions
            optimized_sessions = StudyPlanOptimizer.apply_spaced_repetition(ai_plan["study_sessions"])
            balanced_sessions = StudyPlanOptimizer.balance_cognitive_load(
                optimized_sessions, 
                preferred_hours_per_day * urgency_multiplier
            )
            
            # Enhance plan with comprehensive metadata including resources
            plan = {
                "user_id": norm_user_id,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "horizon_days": horizon_days,
                "preferred_hours_per_day": preferred_hours_per_day,
                "urgency_level": urgency_level,
                "urgency_multiplier": urgency_multiplier,
                "deadline": deadline,
                "weak_topics": prioritized_topics,
                "sessions": balanced_sessions,
                "ai_insights": ai_plan.get("optimization_insights", {}),
                "milestones": ai_plan.get("progress_milestones", []),
                "adaptive_guidelines": ai_plan.get("adaptive_guidelines", {}),
                "deadline_management": ai_plan.get("deadline_management", {}),
                "generation_method": "enhanced_ai_v3_with_resources",
                "learning_optimizations": {
                    "spaced_repetition": True,
                    "cognitive_load_balanced": True,
                    "priority_sorted": True,
                    "resource_enhanced": True
                }
            }
            
            # Store in database if possible
            try:
                if is_valid_uuid(norm_user_id):
                    sb = get_supabase()
                    max_retries = 3
                    for attempt in range(max_retries):
                        try:
                            sb.table("plans").upsert({"user_id": norm_user_id, "plan": plan}).execute()
                            logger.info(f"   Plan stored in database for user {norm_user_id}")
                            break
                        except Exception as e:
                            if attempt < max_retries - 1:
                                logger.warning(f"   Plan storage attempt {attempt + 1} failed: {e}, retrying...")
                                continue
                            else:
                                logger.error(f"   Plan storage failed after {max_retries} attempts: {e}")
                                break
                else:
                    logger.warning(f"   Invalid user ID {norm_user_id}, skipping database storage")
            except Exception as e:
                logger.warning(f"   Could not store plan in DB: {e}")
            
            return plan
            
    except Exception as e:
        logger.warning(f"   AI planning failed, falling back to advanced deterministic: {e}")
    
    # Advanced fallback using deadline manager
    try:
        logger.info("   Using advanced deterministic planning with deadline management")
        
        optimized_sessions = DeadlineManager.calculate_optimal_session_distribution(
            prioritized_topics, 
            horizon_days, 
            preferred_hours_per_day * urgency_multiplier,
            urgency_multiplier
        )
        
        # Apply learning optimizations
        spaced_sessions = StudyPlanOptimizer.apply_spaced_repetition(optimized_sessions)
        final_sessions = StudyPlanOptimizer.balance_cognitive_load(
            spaced_sessions, 
            preferred_hours_per_day * urgency_multiplier
        )
        
        plan = {
            "user_id": norm_user_id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "horizon_days": horizon_days,
            "preferred_hours_per_day": preferred_hours_per_day,
            "urgency_level": urgency_level,
            "urgency_multiplier": urgency_multiplier,
            "deadline": deadline,
            "weak_topics": prioritized_topics,
            "sessions": final_sessions,
            "generation_method": "advanced_deterministic",
            "learning_optimizations": {
                "spaced_repetition": True,
                "cognitive_load_balanced": True,
                "priority_sorted": True,
                "deadline_optimized": True
            }
        }
        
        # Store in database
        try:
            if is_valid_uuid(norm_user_id):
                sb = get_supabase()
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        sb.table("plans").upsert({"user_id": norm_user_id, "plan": plan}).execute()
                        logger.info(f"   Advanced plan stored for user {norm_user_id}")
                        break
                    except Exception as e:
                        if attempt < max_retries - 1:
                            logger.warning(f"   Advanced plan storage attempt {attempt + 1} failed: {e}, retrying...")
                            continue
                        else:
                            logger.error(f"   Advanced plan storage failed after {max_retries} attempts: {e}")
                            break
            else:
                logger.warning(f"   Invalid user ID {norm_user_id}, skipping advanced plan database storage")
        except Exception as e:
            logger.warning(f"   Could not store advanced plan in DB: {e}")
        
        return plan
        
    except Exception as e:
        logger.warning(f"   Advanced planning also failed: {e}")
    
    # Fallback to traditional distribution
    logger.info("   Using traditional session distribution")
    sessions = _distribute_sessions(weak, horizon_days, preferred_hours_per_day)
    plan = {
        "user_id": norm_user_id,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "horizon_days": horizon_days,
        "preferred_hours_per_day": preferred_hours_per_day,
        "deadline": deadline,
        "weak_topics": weak,
        "sessions": sessions,
    }
    # upsert into plans (best-effort)
    try:
        if is_valid_uuid(norm_user_id):
            sb = get_supabase()
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    sb.table("plans").upsert({"user_id": norm_user_id, "plan": plan}).execute()
                    logger.info(f"   Traditional plan stored for user {norm_user_id}")
                    break
                except Exception as e:
                    if attempt < max_retries - 1:
                        logger.warning(f"   Traditional plan storage attempt {attempt + 1} failed: {e}, retrying...")
                        continue
                    else:
                        logger.error(f"   Traditional plan storage failed after {max_retries} attempts: {e}")
                        break
        else:
            logger.warning(f"   Invalid user ID {norm_user_id}, skipping traditional plan database storage")
    except Exception:
        # If DB is unavailable, still return the generated plan
        logger.warning("   Database unavailable, returning plan without storage")
    return plan


def get_current_plan(user_id: str, allow_regenerate: bool = False) -> Dict:
    """Return current stored plan; optionally regenerate if generic and topics now exist.

    Generic plan heuristic: single session or all sessions topic == 'General Review'.
    (Objectives C & B synergy: regenerate after topics uploaded.)
    """
    norm_user_id = normalize_user_id(user_id)
    stored_plan: Optional[Dict] = None
    if is_valid_uuid(norm_user_id):
        max_retries = 3
        for attempt in range(max_retries):
            try:
                sb = get_supabase()
                resp = sb.table("plans").select("plan").eq("user_id", norm_user_id).limit(1).execute()
                if resp.data:
                    stored_plan = resp.data[0]["plan"]
                    logger.info(f"   Retrieved stored plan for user {norm_user_id}")
                    break
                else:
                    logger.info(f"   No stored plan found for user {norm_user_id}")
                    break
            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(f"   Plan retrieval attempt {attempt + 1} failed: {e}, retrying...")
                    continue
                else:
                    logger.error(f"   Plan retrieval failed after {max_retries} attempts: {e}")
                    stored_plan = None
                    break
    else:
        logger.warning(f"   Invalid user ID {norm_user_id}, cannot retrieve from database")

    def _generic(p: Dict) -> bool:
        sessions = p.get("sessions") or []
        if not sessions:
            return True
        if all(s.get("topic") == "General Review" for s in sessions):
            return True
        return False

    need_regen = stored_plan is None
    if allow_regenerate and stored_plan and _generic(stored_plan):
        # Check for presence of syllabus topics now
        syllabus_topics: List[str] = []
        if is_valid_uuid(norm_user_id):
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    sb = get_supabase()
                    tr = sb.table("syllabus_topics").select("topic").eq("user_id", norm_user_id).limit(5).execute()
                    syllabus_topics = [r["topic"] for r in (tr.data or [])]
                    logger.info(f"   Found {len(syllabus_topics)} syllabus topics for user {norm_user_id}")
                    break
                except Exception as e:
                    if attempt < max_retries - 1:
                        logger.warning(f"   Syllabus topics retrieval attempt {attempt + 1} failed: {e}, retrying...")
                        continue
                    else:
                        logger.error(f"   Syllabus topics retrieval failed after {max_retries} attempts: {e}")
                        syllabus_topics = []
                        break
        else:
            logger.warning(f"   Invalid user ID {norm_user_id}, cannot check syllabus topics in database")
            
        if not syllabus_topics:
            syllabus_topics = store_get_topics(norm_user_id)
            if syllabus_topics:
                logger.info(f"   Found {len(syllabus_topics)} topics in in-memory store")
        if syllabus_topics:
            need_regen = True

    if need_regen:
        return generate_plan(norm_user_id)
    return stored_plan
