from datetime import datetime
from typing import Optional, Dict, Any

from services.integrations.supabase.client import get_supabase


def get_user_team_id(user_id: str) -> Optional[str]:
    """Resolve user_id to their team_id. Returns None if user not found."""
    supabase = get_supabase()
    try:
        res = supabase.table('users').select('team_id').eq('id', user_id).single().execute()
        if getattr(res, 'error', None):
            print(f"get_user_team_id error for {user_id}", res.error)
            return None
        data = getattr(res, 'data', None)
        return data.get('team_id') if data else None
    except Exception as e:
        print(f"get_user_team_id failed for {user_id}", e)
        return None


def increment_usage_via_rpc(team_id: str, metric: str, amount: int = 1, period_start: Optional[str] = None, period_end: Optional[str] = None, event_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Call the `increment_usage_rpc` Postgres function via Supabase RPC.

    Returns the updated/inserted row dict or None on error. Falls back to None when RPC not available.
    """
    supabase = get_supabase()
    params = {
        "p_team_id": team_id,
        "p_metric": metric,
        "p_amount": amount,
        "p_period_start": period_start,
        "p_period_end": period_end,
        "p_event_id": event_id,
    }
    try:
        res = supabase.rpc("increment_usage_rpc", params).execute()
        if getattr(res, "error", None):
            print("RPC increment_usage_rpc error", res.error)
            return None
        # supabase.rpc returns data as list of rows for RPC TABLE returns
        data = res.data or []
        return data[0] if len(data) > 0 else None
    except Exception as e:
        print("increment_usage_via_rpc failed", e)
        return None


def get_team_activity(team_id: str) -> Optional[Dict[str, Any]]:
    supabase = get_supabase()
    res = supabase.table("team_activity").select("*").eq("team_id", team_id).execute()
    if getattr(res, "error", None):
        print("Error reading team_activity", res.error)
        return None
    data = res.data or []
    if len(data) == 0:
        return None
    return data[0]


def get_team_activity_for_period(team_id: str, period_start: str, period_end: str) -> Optional[Dict[str, Any]]:
    supabase = get_supabase()
    res = (
        supabase.table("team_activity")
        .select("*")
        .eq("team_id", team_id)
        .eq("period_start", period_start)
        .eq("period_end", period_end)
        .execute()
    )
    if getattr(res, "error", None):
        print("Error reading team_activity for period", res.error)
        return None
    data = res.data or []
    if len(data) == 0:
        return None
    return data[0]


def upsert_team_activity(team_id: str, period_start: str, period_end: str, post_inc: int = 0, credit_inc: int = 0) -> Dict[str, Any]:
    """Insert or update a team_activity row. Increments counts atomically where supported.

    Falls back to a select+update when upsert is not appropriate.
    """
    supabase = get_supabase()
    now = datetime.utcnow().isoformat()

    # Try upsert with provided primary keys (team_id + period_start + period_end assumed unique)
    payload = {
        "team_id": team_id,
        "period_start": period_start,
        "period_end": period_end,
        "updated_at": now,
    }
    # Set initial counters if creating (store inside `usage` JSON for flexible metrics)
    usage_map = {}
    if post_inc:
        usage_map["post_count"] = post_inc
    if credit_inc:
        usage_map["credit_count"] = credit_inc
    # Always include a usage JSON field to centralize metrics
    payload["usage"] = usage_map

    try:
        res = supabase.table("team_activity").upsert(payload, on_conflict="team_id,period_start,period_end").execute()
        if getattr(res, "error", None):
            # fallback: ensure row exists then increment
            existing = get_team_activity_for_period(team_id, period_start, period_end)
            if not existing:
                ins = supabase.table("team_activity").insert(payload).execute()
                return ins.data[0] if getattr(ins, "data", None) else {}

            updates = {}
            # merge into existing usage JSON
            existing_usage = existing.get("usage") or {}
            if post_inc:
                existing_usage["post_count"] = (existing_usage.get("post_count") or 0) + post_inc
            if credit_inc:
                existing_usage["credit_count"] = (existing_usage.get("credit_count") or 0) + credit_inc
            updates["usage"] = existing_usage
            updates["updated_at"] = now
            upd = supabase.table("team_activity").update(updates).eq("id", existing.get("id")).execute()
            return upd.data[0] if getattr(upd, "data", None) else {}

        return res.data[0] if getattr(res, "data", None) else {}
    except Exception as e:
        print("Failed to upsert team_activity", e)
        # best-effort insert
        ins = supabase.table("team_activity").insert(payload).execute()
        return ins.data[0] if getattr(ins, "data", None) else {}


def set_team_activity_period(team_id: str, period_start: str, period_end: str) -> Optional[Dict[str, Any]]:
    """Ensure the user's activity row has the provided period. Creates a row if none exists."""
    existing = get_team_activity(team_id)
    if not existing:
        return upsert_team_activity(team_id, period_start, period_end, post_inc=0, credit_inc=0)

    supabase = get_supabase()
    now = datetime.utcnow().isoformat()
    res = supabase.table("team_activity").update({"period_start": period_start, "period_end": period_end, "updated_at": now}).eq("id", existing.get("id")).execute()
    if getattr(res, "error", None):
        print("Error updating team_activity period", res.error)
        return None
    return res.data[0] if getattr(res, "data", None) else None


def increment_usage_field(team_id: str, field: str, amount: int = 1) -> Optional[Dict[str, Any]]:
    """Increment a numeric usage field (`post_count`, `credit_count`) for the current team_activity row.

    Returns the updated row or None.
    """
    existing = get_team_activity(team_id)
    if not existing:
        # Cannot increment without period information
        return None

    supabase = get_supabase()
    # Prefer centralized `usage` JSON column. Support legacy top-level numeric columns too.
    existing_usage = existing.get("usage") or {}
    # If the metric exists at top-level, keep behavior for backward compat
    if field in existing:
        new_val = (existing.get(field) or 0) + amount
        updates = {field: new_val}
    else:
        new_val = (existing_usage.get(field) or 0) + amount
        existing_usage[field] = new_val
        updates = {"usage": existing_usage}

    now = datetime.utcnow().isoformat()
    updates["updated_at"] = now
    res = supabase.table("team_activity").update(updates).eq("id", existing.get("id")).execute()
    if getattr(res, "error", None):
        print("Error incrementing usage field", res.error)
        return None
    return res.data[0] if getattr(res, "data", None) else None


def get_product_rate_limit(product_id: str) -> Optional[Dict[str, Any]]:
    """Read product rate limit configuration from `product_rate_limits` table if present.

    If the table or row does not exist, return None to indicate no enforced limit.
    """
    supabase = get_supabase()
    try:
        res = supabase.table("product_rate_limits").select("*").eq("product_id", product_id).limit(1).execute()
        if getattr(res, "error", None) or not getattr(res, "data", None):
            return None
        return res.data[0]
    except Exception as e:
        # Table might not exist; treat as no limits configured
        print("product_rate_limits read failed", e)
        return None


def get_all_product_rate_limits() -> Optional[list]:
    """Return all rows from `product_rate_limits` table or None if not available."""
    supabase = get_supabase()
    try:
        res = supabase.table("product_rate_limits").select("*").execute()
        if getattr(res, "error", None) or not getattr(res, "data", None):
            return []
        return res.data
    except Exception as e:
        print("get_all_product_rate_limits failed", e)
        return []


def increment_credits(team_id: str, credit_type: str, amount: int = 1) -> Optional[Dict[str, Any]]:
    """Increment credits in the usage JSON. Credit types: 'text_generation', 'image_generation'.
    
    Structure in team_activity.usage:
    {
        "credits": {
            "text_generation": int,
            "image_generation": int,
            "total": int
        }
    }
    """
    supabase = get_supabase()
    now = datetime.utcnow().isoformat()
    
    existing = get_team_activity(team_id)
    if existing:
        usage_map = existing.get("usage") or {}
        credits = usage_map.get("credits") or {}
        
        # Increment the specific credit type
        credits[credit_type] = (credits.get(credit_type) or 0) + amount
        # Update total
        credits["total"] = sum(v for k, v in credits.items() if k != "total")
        
        usage_map["credits"] = credits
        updates = {"usage": usage_map, "updated_at": now}
        
        try:
            res = supabase.table("team_activity").update(updates).eq("id", existing.get("id")).execute()
            if getattr(res, "error", None):
                print("increment_credits update error", res.error)
                return None
            return res.data[0] if getattr(res, "data", None) else None
        except Exception as e:
            print("increment_credits failed update", e)
            return None
    
    # Create new row with credits
    payload = {
        "team_id": team_id,
        "updated_at": now,
        "usage": {
            "credits": {
                credit_type: amount,
                "total": amount,
            }
        },
    }
    
    try:
        res = supabase.table("team_activity").insert(payload).execute()
        if getattr(res, "error", None):
            print("increment_credits insert error", res.error)
            return None
        return res.data[0] if getattr(res, "data", None) else None
    except Exception as e:
        print("increment_credits failed insert", e)
        return None


def set_product_rate_limit(product_id: str, rules: Any) -> Optional[Dict[str, Any]]:
    """Create or update a product_rate_limits row for a product_id with given rules (JSON or dict)."""
    supabase = get_supabase()
    payload = {
        "product_id": product_id,
        "rules": rules,
    }
    try:
        # upsert on product_id
        res = supabase.table("product_rate_limits").upsert(payload, on_conflict="product_id").execute()
        if getattr(res, "error", None):
            print("set_product_rate_limit upsert error", res.error)
            return None
        return res.data[0] if getattr(res, "data", None) else None
    except Exception as e:
        print("set_product_rate_limit failed", e)
        return None


def increment_or_create_usage(team_id: str, metric: str, amount: int = 1, period_start: Optional[str] = None, period_end: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Atomically increment a metric stored in the `usage` JSON column, creating the team_activity row if it does not exist.

    - If a row exists, merges into `usage` JSON and updates the timestamp.
    - If no row exists, inserts a new row with provided period_start/period_end (if any) and the metric initialized to `amount`.
    Returns the updated/created row or None on error.
    """
    supabase = get_supabase()
    now = datetime.utcnow().isoformat()

    # Try RPC first (atomic server-side increment); fall back to client-side logic if RPC not available
    try:
        rpc_res = increment_usage_via_rpc(team_id, metric, amount, period_start, period_end)
        if rpc_res:
            return rpc_res
    except Exception:
        # ignore and fall back
        pass

    existing = get_team_activity(team_id)
    if existing:
        usage_map = existing.get("usage") or {}
        usage_map[metric] = (usage_map.get(metric) or 0) + amount
        updates = {"usage": usage_map, "updated_at": now}
        try:
            res = supabase.table("team_activity").update(updates).eq("id", existing.get("id")).execute()
            if getattr(res, "error", None):
                print("increment_or_create_usage update error", res.error)
                return None
            return res.data[0] if getattr(res, "data", None) else None
        except Exception as e:
            print("increment_or_create_usage failed update", e)
            return None

    # create new row
    payload = {
        "team_id": team_id,
        "updated_at": now,
        "usage": {metric: amount},
    }
    if period_start:
        payload["period_start"] = period_start
    if period_end:
        payload["period_end"] = period_end

    try:
        res = supabase.table("team_activity").insert(payload).execute()
        if getattr(res, "error", None):
            print("increment_or_create_usage insert error", res.error)
            return None
        return res.data[0] if getattr(res, "data", None) else None
    except Exception as e:
        print("increment_or_create_usage failed insert", e)
        return None
