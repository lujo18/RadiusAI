import stripe
from typing import Optional, Dict, Any
from datetime import datetime

from config import Config
from services.usage import repo as usage_repo
from services.usage import rules as usage_rules
from services.integrations.supabase.client import get_supabase

# initialize stripe key from config (billing_service sets this too, but ensure module-safe)
if not Config.STRIPE_SECRET_KEY:
    stripe.api_key = None
else:
    stripe.api_key = Config.STRIPE_SECRET_KEY


def require_stripe_key():
    if not stripe.api_key:
        raise RuntimeError("Stripe secret key not configured")


def _get_active_subscription_for_customer(customer_id: str) -> Optional[Dict[str, Any]]:
    """Return the first active subscription for a customer, or None."""
    require_stripe_key()
    try:
        subs = stripe.Subscription.list(customer=customer_id, limit=10)
        if not getattr(subs, "data", None):
            return None
        # Prefer 'active' or 'trialing', fall back to first
        for s in subs.data:
            status = getattr(s, 'status', None)
            if status in ("active", "trialing", "past_due"):
                return s
        return subs.data[0]
    except Exception as e:
        print("Failed to fetch subscriptions from Stripe", e)
        return None


def sync_usage_period_from_subscription(user_id: str) -> Optional[Dict[str, Any]]:
    """Ensure user_activity.period_start/period_end is set from Stripe subscription periods.

    Returns the updated/created user_activity row or None.
    """
    supabase = get_supabase()
    # read user stripe customer id
    try:
        user_res = supabase.table('users').select('stripe_customer_id').eq('id', user_id).execute()
        if not getattr(user_res, 'data', None) or len(user_res.data) == 0:
            print('No user found when syncing usage period')
            return None
        customer_id = user_res.data[0].get('stripe_customer_id')
        if not customer_id:
            print('User has no stripe_customer_id')
            return None

        sub = _get_active_subscription_for_customer(customer_id)
        if not sub:
            print('No subscription found for customer', customer_id)
            return None

        # defensive access
        period_start = getattr(sub, 'current_period_start', None) or None
        period_end = getattr(sub, 'current_period_end', None) or None

        # convert unix timestamps to iso if needed
        def _to_iso(val):
            if val is None:
                return None
            try:
                # stripe returns ints for many fields
                if isinstance(val, int):
                    return datetime.utcfromtimestamp(val).isoformat()
                return val
            except Exception:
                return None

        ps = _to_iso(period_start)
        pe = _to_iso(period_end)

        if not ps or not pe:
            print('Subscription missing period_start/period_end', getattr(sub, 'id', None))
            return None

        # If a row already exists for this exact billing period, return it.
        existing = usage_repo.get_user_activity_for_period(user_id, ps, pe)
        if existing:
            return existing

        # Otherwise create a new row for this billing cycle (preserve history)
        row = usage_repo.upsert_user_activity(user_id, ps, pe, post_inc=0, credit_inc=0)
        return row
    except Exception as e:
        print('sync_usage_period_from_subscription failed', e)
        return None


def check_and_consume(user_id: str, product_id: str, amount: int = 1) -> Dict[str, Any]:
    """Main rate-limit check: validates period, fetches product limit, checks usage and optionally consumes usage.

    Returns dict: {allowed: bool, remaining: int|null, limit: int|null, usage_row: {...}}
    """
    # Ensure period synced to Stripe subscription
    usage_row = sync_usage_period_from_subscription(user_id)

    # Read product rate-limit configuration
    rate = usage_repo.get_product_rate_limit(product_id)
    if not rate:
        # No limit configured: allow by default
        # But still increment usage for observability (post_count)
        updated = usage_repo.increment_usage_field(user_id, 'post_count', amount)
        return {"allowed": True, "remaining": None, "limit": None, "usage": updated}

    # If rules JSON exists, parse and evaluate
    raw_rules = rate.get('rules')
    if raw_rules:
        rules_doc = usage_rules.parse_rules(raw_rules)
        if rules_doc:
            eval_res = usage_rules.evaluate_rules_for_user(user_id, rules_doc, amount)
            if not eval_res.get('allowed'):
                return {"allowed": False, "remaining": eval_res.get('remaining'), "limit": None, "usage": usage_repo.get_user_activity(user_id), "details": eval_res}

            # determine metric to increment: prefer first rule metric, then product-level metric, then post_count
            first_rule_metric = None
            if len(rules_doc.rules) > 0:
                first_rule_metric = rules_doc.rules[0].metric
            metric = first_rule_metric or rate.get('metric') or 'post_count'
            updated = usage_repo.increment_usage_field(user_id, metric, amount)
            return {"allowed": True, "remaining": eval_res.get('remaining'), "limit": None, "usage": updated, "details": eval_res}

    # Fall back to legacy flat schema behavior
    limit = int(rate.get('limit') or 0)
    metric = rate.get('metric') or 'post_count'

    current = usage_repo.get_user_activity(user_id) or {}
    current_metric = int(current.get(metric) or 0)

    remaining = limit - current_metric
    if remaining < amount:
        return {"allowed": False, "remaining": max(0, remaining), "limit": limit, "usage": current}

    # consume
    updated = usage_repo.increment_usage_field(user_id, metric, amount)
    return {"allowed": True, "remaining": limit - (current_metric + amount), "limit": limit, "usage": updated}


def track_slides_generated(user_id: str, count: int = 1) -> Optional[Dict[str, Any]]:
    """Convenience helper to track slides generated metric."""
    try:
        return usage_repo.increment_or_create_usage(user_id, 'slides_generated', count)
    except Exception as e:
        print('track_slides_generated failed', e)
        return None


def add_ai_credits(user_id: str, amount: int = 1) -> Optional[Dict[str, Any]]:
    """Add AI credits to user's usage map."""
    try:
        return usage_repo.increment_or_create_usage(user_id, 'ai_credits', amount)
    except Exception as e:
        print('add_ai_credits failed', e)
        return None


def consume_ai_credits(user_id: str, amount: int = 1) -> Dict[str, Any]:
    """Consume AI credits if available. Returns {allowed: bool, usage: row}.

    This uses an optimistic check followed by RPC decrement to avoid negative values under normal conditions.
    """
    try:
        ua = usage_repo.get_user_activity(user_id) or {}
        usage_map = ua.get('usage') or {}
        available = int(usage_map.get('ai_credits') or ua.get('ai_credits') or 0)
        if available < amount:
            return {"allowed": False, "available": available, "requested": amount}

        # decrement via RPC where possible (atomic)
        rpc_res = usage_repo.increment_usage_via_rpc(user_id, 'ai_credits', -int(amount))
        if rpc_res:
            return {"allowed": True, "usage": rpc_res}

        # fallback to client-side decrement
        updated = usage_repo.increment_or_create_usage(user_id, 'ai_credits', -int(amount))
        return {"allowed": True, "usage": updated}
    except Exception as e:
        print('consume_ai_credits failed', e)
        return {"allowed": False, "error": str(e)}


def consume_slides_generated(user_id: str, amount: int = 1) -> Dict[str, Any]:
    """Consume slide-generation credits if available. Returns {allowed: bool, usage: row}.

    This attempts an atomic RPC decrement first, falling back to a client-side merge.
    """
    try:
        ua = usage_repo.get_user_activity(user_id) or {}
        usage_map = ua.get('usage') or {}
        available = int(usage_map.get('slides_generated') or ua.get('slides_generated') or 0)
        if available < amount:
            return {"allowed": False, "available": available, "requested": amount}

        # decrement via RPC where possible (atomic)
        rpc_res = usage_repo.increment_usage_via_rpc(user_id, 'slides_generated', -int(amount))
        if rpc_res:
            return {"allowed": True, "usage": rpc_res}

        # fallback to client-side decrement
        updated = usage_repo.increment_or_create_usage(user_id, 'slides_generated', -int(amount))
        return {"allowed": True, "usage": updated}
    except Exception as e:
        print('consume_slides_generated failed', e)
        return {"allowed": False, "error": str(e)}
