import stripe
from typing import Optional, Dict, Any
from datetime import datetime

from backend.features.error.helper import api_error
from backend.services.integrations.supabase.db.templates import get_template_count
from config import Config
from services.usage import repo as usage_repo
from services.usage import rules as usage_rules
from services.integrations.supabase.client import get_supabase

# Credit usage mapping (from admin/credits.py)
CREDIT_USAGE = {
    "text_generation": 1,  # 1 credit per slide (text generation)
    "image_generation": 1,  # 1 credit per image
}

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
            status = getattr(s, "status", None)
            if status in ("active", "trialing", "past_due"):
                return s
        return subs.data[0]
    except Exception as e:
        print("Failed to fetch subscriptions from Stripe", e)
        return None


# ============================================================================
# HELPER METHODS - Product ID & Team Usage Resolution
# ============================================================================


def _get_user_product_id(user_id: str) -> Optional[str]:
    """
    Get the product_id for a user.

    Logic:
    1. Check if user has stripe_product_id (they are an owner)
    2. If not, find their team and get the team owner's product_id

    Returns product_id string or None if not found.
    """
    supabase = get_supabase()
    try:
        # Check if user has product_id (owner)
        user_res = (
            supabase.table("users")
            .select("stripe_product_id, team_id")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        if not getattr(user_res, "data", None) or len(user_res.data) == 0:
            print(f"_get_user_product_id: User {user_id} not found")
            return None

        user_row = user_res.data[0]
        product_id = user_row.get("stripe_product_id")
        if product_id:
            print(
                f"_get_user_product_id: User {user_id} is owner with product_id={product_id}"
            )
            return product_id

        print(
            f"_get_user_product_id: User {user_id} has no product_id, resolving via team"
        )

        # User is not an owner, find their team's owner
        team_id = user_row.get("team_id")
        if not team_id:
            print(f"_get_user_product_id: User {user_id} has no team_id")
            return None

        # Get team owner
        team_res = (
            supabase.table("teams")
            .select("owner_id")
            .eq("id", team_id)
            .limit(1)
            .execute()
        )
        if not getattr(team_res, "data", None) or len(team_res.data) == 0:
            print(f"_get_user_product_id: Team {team_id} not found")
            return None

        owner_id = team_res.data[0].get("owner_id")
        if not owner_id:
            print(f"_get_user_product_id: Team {team_id} has no owner_id")
            return None

        print(
            f"_get_user_product_id: Team {team_id} owner is {owner_id}, fetching product_id"
        )

        # Get owner's product_id
        owner_res = (
            supabase.table("users")
            .select("stripe_product_id")
            .eq("id", owner_id)
            .limit(1)
            .execute()
        )
        if not getattr(owner_res, "data", None) or len(owner_res.data) == 0:
            print(f"_get_user_product_id: Owner {owner_id} not found")
            return None

        owner_product_id = owner_res.data[0].get("stripe_product_id")
        print(
            f"_get_user_product_id: Resolved product_id={owner_product_id} for user {user_id} via owner {owner_id}"
        )
        return owner_product_id

    except Exception as e:
        print(f"_get_user_product_id failed: {e}")
        import traceback

        traceback.print_exc()
        return None


def _get_team_usage(team_id: str) -> Dict[str, Any]:
    """
    Extract the usage JSON from team_activity row.

    Returns empty dict if team_activity doesn't exist.
    """
    try:
        activity = usage_repo.get_team_activity(team_id)
        if not activity:
            return {}
        return activity.get("usage") or {}
    except Exception as e:
        print(f"_get_team_usage failed: {e}")
        return {}


def _get_metric_limit(product_id: Optional[str], metric_name: str) -> Optional[int]:
    """
    Get the limit for a specific metric from product_rate_limits.

    Looks for limit in rules.limits.{metric_name}
    Returns None if no limit configured.
    """
    if not product_id:
        raise api_error(status_code=400, code="GET_PRODUCT_RATE_FAILED", message="Invalid plan id.")

    rate = usage_repo.get_product_rate_limit(product_id)
    if not rate:
        raise api_error(status_code=400, code="GET_PRODUCT_RATE_FAILED", message="The current plan does not have a valid rate limit.")


    raw_rules = rate.get("rules")
    if not raw_rules:
        raise api_error(status_code=400, code="GET_PRODUCT_RATE_FAILED", message="The current plan does not have any rules defined.")


    print(f"metric limit values: {product_id} {metric_name}")

    # Check for limits.{metric_name} structure
    if isinstance(raw_rules, dict) and "limits" in raw_rules:
        limits = raw_rules["limits"]
        if isinstance(limits, dict) and metric_name in limits:
            limit_val = limits[metric_name]
            if limit_val is not None:
                return int(limit_val)

    # Fallback to legacy rules parsing
    rules_doc = usage_rules.parse_rules(raw_rules)
    if rules_doc and hasattr(rules_doc, "rules"):
        for rule in rules_doc.rules:
            if rule.metric == metric_name and rule.limit is not None:
                return int(rule.limit)

    return None


def _get_metric_usage(
    team_id: str, metric_name: str, brand_id: Optional[str] = None
) -> int:
    """
    Get current usage count for a specific metric (READ-ONLY, no writes).

    For brand_count and template_count: performs a COUNT query on actual resources.
    For template_count: if brand_id is provided, counts only templates for that brand.
    For other metrics: reads from team_activity.usage.{metric_name}.
    Returns 0 if not found or error.
    """
    try:
        supabase = get_supabase()
        count = 0

        # Use COUNT queries for resource-based metrics
        if metric_name == "brand_count":
            result = (
                supabase.table("brand")
                .select("id", count="exact")
                .eq("team_id", team_id)
                .execute()
            )
            count = result.count or 0
        elif metric_name == "template_count":
            if brand_id:
                # Count templates for specific brand
                print(
                    f"[DEBUG _get_metric_usage] Counting templates for brand_id: {brand_id} (type: {type(brand_id)})"
                )
                try:
                    # Use limit 0 to only get count without fetching rows
                    result = (
                        supabase.table("template")
                        .select("id", count="exact")
                        .eq("brand_id", brand_id)
                        .limit(0)
                        .execute()
                    )
                    print(
                        f"[DEBUG _get_metric_usage] Query result - count: {result.count}, status: {result.status_code if hasattr(result, 'status_code') else 'N/A'}"
                    )
                    if hasattr(result, "error") and result.error:
                        print(f"[DEBUG _get_metric_usage] Query error: {result.error}")
                    count = result.count or 0
                except Exception as e:
                    print(
                        f"[DEBUG _get_metric_usage] Exception during brand query: {e}"
                    )
                    count = 0
            else:
                # Count templates for entire team
                print(
                    f"[DEBUG _get_metric_usage] Counting all templates for team_id: {team_id}"
                )
                result = supabase.rpc(
                    "get_template_counts_by_team", {"team_id": team_id}
                ).execute()

                print(f"[DEBUG _get_metric_usage] Team template counts: {result.data}")
                count = result.data or 0
        else:
            # For other metrics, read from stored usage
            usage_map = _get_team_usage(team_id)
            count = int(usage_map.get(metric_name) or 0)

        print(
            f"[DEBUG _get_metric_usage] Final count for {metric_name} (brand_id={brand_id}): {count}"
        )
        return count
    except Exception as e:
        print(f"[ERROR _get_metric_usage] for {metric_name} failed: {e}")
        import traceback

        traceback.print_exc()
        return 0


def _store_metric_usage(team_id: str, metric_name: str, count: int):
    """
    Store a metric count in team_activity.usage for record-keeping.
    Called after resource creation succeeds to record the new count.
    """
    try:
        supabase = get_supabase()
        usage_map = _get_team_usage(team_id)
        usage_map[metric_name] = count
        activity = usage_repo.get_team_activity(team_id)
        if activity:
            supabase.table("team_activity").update({"usage": usage_map}).eq(
                "id", activity.get("id")
            ).execute()
    except Exception as e:
        # Log but don't fail - this is just for record-keeping
        print(f"Warning: Failed to store metric usage for {metric_name}: {e}")


# ============================================================================
# GENERIC USAGE METHODS - These can be reused for any metric
# ============================================================================


def get_metric_limit(
    user_id: str, metric_name: str, brand_id: Optional[str] = None
) -> int:
    try:
        print(f"[get_metric_usage START] metric={metric_name}, brand_id={brand_id}")
        team_id = usage_repo.get_user_team_id(user_id)
        if not team_id:
            raise api_error(status_code=400, code="NO_TEAM_FOUND", message="The current user is not a part of a team.")

        product_id = _get_user_product_id(user_id)
        metric_limit = _get_metric_limit(product_id, metric_name)
        
        if not metric_limit:
            raise api_error(status_code=400, code="NO_LIMIT_FOUND", message="Unable to find usage limit for period.")

        return metric_limit
    except Exception as e:
        print(f"get_metric_usage({metric_name}) failed: {e}")
        raise api_error(status_code=400, code="GET_LIMIT_FAILED", message=f"Get limit error: {e}")



def get_metric_usage(
    user_id: str, metric_name: str, brand_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Read current usage for a metric.

    If brand_id is provided for template_count, filters templates by brand.
    Otherwise, returns usage for the user's team.

    Returns: {"metric_count": int, "metric_limit": int|None, "remaining": int|None}
    """
    import time

    start = time.time()
    try:
        print(f"[get_metric_usage START] metric={metric_name}, brand_id={brand_id}")
        team_id = usage_repo.get_user_team_id(user_id)
        if not team_id:
            return {
                "metric_count": 0,
                "metric_limit": None,
                "remaining": None,
                "error": "User not found",
            }

        product_id = _get_user_product_id(user_id)
        metric_count_raw = _get_metric_usage(team_id, metric_name, brand_id=brand_id)
        elapsed = time.time() - start
        print(
            f"[get_metric_usage _get_metric_usage] took {elapsed:.2f}s, result={metric_count_raw}"
        )
        # Always convert to int - sum per-brand breakdown for rate limiting display
        if isinstance(metric_count_raw, list):
            metric_count = sum(
                item.get("template_count", 0) for item in metric_count_raw
            )
        else:
            metric_count = int(metric_count_raw) if metric_count_raw else 0

        metric_limit = _get_metric_limit(product_id, metric_name)

        remaining = (metric_limit - metric_count) if metric_limit is not None else None

        print(
            f"[get_metric_usage END] metric_count={metric_count}, metric_limit={metric_limit}, remaining={remaining}, total_time={time.time()-start:.2f}s"
        )

        return {
            "metric_count": metric_count,
            "metric_limit": metric_limit,
            "remaining": remaining,
        }
    except Exception as e:
        print(f"get_metric_usage({metric_name}) failed: {e}")
        import traceback

        traceback.print_exc()
        return {
            "metric_count": 0,
            "metric_limit": None,
            "remaining": None,
            "error": str(e),
        }


def check_and_track_metric(
    user_id: str, metric_name: str, amount: int = 1
) -> Dict[str, Any]:
    """
    Check if user has remaining quota for a metric.

    For resource-based metrics (brand_count, template_count):
    - Checks current COUNT from actual resources
    - Does NOT manually increment (the actual resource creation increments the COUNT)

    For other metrics:
    - Checks and increments a counter in team_activity.usage

    Returns: {"allowed": bool, "metric_count": int, "metric_limit": int|None, "remaining": int|None, "message": str|None}
    """
    try:
        team_id = usage_repo.get_user_team_id(user_id)
        if not team_id:
            error_msg = f"check_and_track_metric({metric_name}): Team not found for user {user_id}"
            print(error_msg)
            return {"allowed": False, "error": error_msg}

        product_id = _get_user_product_id(user_id)
        print(
            f"check_and_track_metric({metric_name}): product_id={product_id}, team_id={team_id}"
        )

        metric_count_raw = _get_metric_usage(team_id, metric_name)
        # Always convert to int - sum per-brand breakdown for rate limiting display
        if isinstance(metric_count_raw, list):
            metric_count = sum(
                item.get("template_count", 0) for item in metric_count_raw
            )
        else:
            metric_count = int(metric_count_raw) if metric_count_raw else 0

        metric_limit = _get_metric_limit(product_id, metric_name)

        print(
            f"check_and_track_metric({metric_name}): count={metric_count}, limit={metric_limit}"
        )

        # Check limit
        if metric_limit is not None:
            remaining = metric_limit - metric_count
            print(
                f"check_and_track_metric({metric_name}): remaining={remaining}, amount={amount}"
            )
            if remaining < amount:
                msg = f"{metric_name.capitalize()} limit reached: {metric_count}/{metric_limit}"
                print(f"check_and_track_metric({metric_name}): DENIED - {msg}")
                return {
                    "allowed": False,
                    "metric_count": metric_count,
                    "metric_limit": metric_limit,
                    "remaining": max(0, remaining),
                    "message": msg,
                }

        # For resource-based metrics, don't manually increment - the resource creation does that
        # For other metrics, manually increment
        print(f"check_and_track_metric({metric_name}): ALLOWED")
        if metric_name not in ("brand_count", "template_count"):
            # Manually increment for non-resource metrics
            usage_repo.increment_or_create_usage(team_id, metric_name, amount)
            new_count = metric_count + amount
        else:
            # For resource metrics, the count will be updated by actual resource creation
            # Don't manually increment here - caller will create the resource
            new_count = metric_count

        new_remaining = (metric_limit - new_count) if metric_limit is not None else None

        return {
            "allowed": True,
            "metric_count": new_count,
            "metric_limit": metric_limit,
            "remaining": new_remaining,
        }

    except Exception as e:
        error_msg = f"check_and_track_metric({metric_name}) failed: {e}"
        print(error_msg)
        import traceback

        traceback.print_exc()
        return {"allowed": False, "error": error_msg}


def decrement_metric(user_id: str, metric_name: str, amount: int = 1) -> Dict[str, Any]:
    """
    Remove/decrement usage for a metric (e.g., when a brand/template is deleted).

    For resource-based metrics (brand_count, template_count):
    - Uses COUNT query on actual resources (automatically reflects deletion)

    For other metrics:
    - Manually decrements counter in team_activity.usage

    Returns: {"metric_count": int, "metric_limit": int|None, "remaining": int|None}
    """
    try:
        team_id = usage_repo.get_user_team_id(user_id)
        if not team_id:
            return {"error": "User not found"}

        product_id = _get_user_product_id(user_id)

        # For resource metrics, _get_metric_usage will do a fresh COUNT
        # For other metrics, manually decrement
        if metric_name not in ("brand_count", "template_count"):
            metric_count = _get_metric_usage(team_id, metric_name)
            metric_limit = _get_metric_limit(product_id, metric_name)

            # Decrement (but don't go below 0)
            new_count = max(0, metric_count - amount)
            if new_count < metric_count:
                # Only update if there's actually a decrement
                usage_map = _get_team_usage(team_id)
                usage_map[metric_name] = new_count
                supabase = get_supabase()
                activity = usage_repo.get_team_activity(team_id)
                if activity:
                    updated = (
                        supabase.table("team_activity")
                        .update({"usage": usage_map})
                        .eq("id", activity.get("id"))
                        .execute()
                    )
        else:
            # For resource metrics, just query the current count (will reflect the deletion)
            metric_count = _get_metric_usage(team_id, metric_name)
            metric_limit = _get_metric_limit(product_id, metric_name)
            new_count = metric_count

        new_remaining = (metric_limit - new_count) if metric_limit is not None else None

        return {
            "metric_count": new_count,
            "metric_limit": metric_limit,
            "remaining": new_remaining,
        }

    except Exception as e:
        print(f"decrement_metric({metric_name}) failed: {e}")
        return {"error": str(e)}


def _get_active_subscription_for_customer(customer_id: str) -> Optional[Dict[str, Any]]:
    """Return the first active subscription for a customer, or None."""
    require_stripe_key()
    try:
        subs = stripe.Subscription.list(customer=customer_id, limit=10)
        if not getattr(subs, "data", None):
            return None
        # Prefer 'active' or 'trialing', fall back to first
        for s in subs.data:
            status = getattr(s, "status", None)
            if status in ("active", "trialing", "past_due"):
                return s
        return subs.data[0]
    except Exception as e:
        print("Failed to fetch subscriptions from Stripe", e)
        return None


def sync_usage_period_from_subscription(user_id: str) -> Optional[Dict[str, Any]]:
    """Ensure team_activity.period_start/period_end is set from Stripe subscription periods.

    Returns the updated/created team_activity row or None.
    """
    supabase = get_supabase()
    try:
        # Resolve user to team
        team_id = usage_repo.get_user_team_id(user_id)
        if not team_id:
            print(f"No team found for user {user_id}")
            return None

        # read user stripe customer id
        user_res = (
            supabase.table("users")
            .select("stripe_customer_id")
            .eq("id", user_id)
            .execute()
        )
        if not getattr(user_res, "data", None) or len(user_res.data) == 0:
            print("No user found when syncing usage period")
            return None
        customer_id = user_res.data[0].get("stripe_customer_id")
        if not customer_id:
            print("User has no stripe_customer_id")
            return None

        sub = _get_active_subscription_for_customer(customer_id)
        if not sub:
            print("No subscription found for customer", customer_id)
            return None

        # defensive access
        period_start = getattr(sub, "current_period_start", None) or None
        period_end = getattr(sub, "current_period_end", None) or None

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
            print(
                "Subscription missing period_start/period_end", getattr(sub, "id", None)
            )
            return None

        # If a row already exists for this exact billing period, return it.
        existing = usage_repo.get_team_activity_for_period(team_id, ps, pe)
        if existing:
            return existing

        # Otherwise create a new row for this billing cycle (preserve history)
        row = usage_repo.upsert_team_activity(team_id, ps, pe, post_inc=0, credit_inc=0)
        return row
    except Exception as e:
        print("sync_usage_period_from_subscription failed", e)
        return None


def check_and_consume(user_id: str, product_id: str, amount: int = 1) -> Dict[str, Any]:
    """Main rate-limit check: validates period, fetches product limit, checks usage and optionally consumes usage.

    Returns dict: {allowed: bool, remaining: int|null, limit: int|null, usage_row: {...}}
    """
    # Resolve user to team
    team_id = usage_repo.get_user_team_id(user_id)
    if not team_id:
        return {
            "allowed": False,
            "remaining": None,
            "limit": None,
            "error": f"User {user_id} not found",
        }

    # Ensure period synced to Stripe subscription
    usage_row = sync_usage_period_from_subscription(user_id)

    # Read product rate-limit configuration
    rate = usage_repo.get_product_rate_limit(product_id)
    if not rate:
        # No limit configured: allow by default
        # But still increment usage for observability (post_count)
        updated = usage_repo.increment_usage_field(team_id, "post_count", amount)
        return {"allowed": True, "remaining": None, "limit": None, "usage": updated}

    # If rules JSON exists, parse and evaluate
    raw_rules = rate.get("rules")
    if raw_rules:
        rules_doc = usage_rules.parse_rules(raw_rules)
        if rules_doc:
            eval_res = usage_rules.evaluate_rules_for_user(team_id, rules_doc, amount)
            if not eval_res.get("allowed"):
                return {
                    "allowed": False,
                    "remaining": eval_res.get("remaining"),
                    "limit": None,
                    "usage": usage_repo.get_team_activity(team_id),
                    "details": eval_res,
                }

            # determine metric to increment: prefer first rule metric, then product-level metric, then post_count
            first_rule_metric = None
            if len(rules_doc.rules) > 0:
                first_rule_metric = rules_doc.rules[0].metric
            metric = first_rule_metric or rate.get("metric") or "post_count"
            updated = usage_repo.increment_usage_field(team_id, metric, amount)
            return {
                "allowed": True,
                "remaining": eval_res.get("remaining"),
                "limit": None,
                "usage": updated,
                "details": eval_res,
            }

    # Fall back to legacy flat schema behavior
    limit = int(rate.get("limit") or 0)
    metric = rate.get("metric") or "post_count"

    current = usage_repo.get_team_activity(team_id) or {}
    current_metric = int(current.get(metric) or 0)

    remaining = limit - current_metric
    if remaining < amount:
        return {
            "allowed": False,
            "remaining": max(0, remaining),
            "limit": limit,
            "usage": current,
        }

    # consume
    updated = usage_repo.increment_usage_field(team_id, metric, amount)
    return {
        "allowed": True,
        "remaining": limit - (current_metric + amount),
        "limit": limit,
        "usage": updated,
    }


def track_slides_generated(user_id: str, count: int = 1) -> Optional[Dict[str, Any]]:
    """Track slides generated as credits consumed. Each slide = 1 text_generation credit.

    Stores credits consumed in team_activity.usage['credits'] as JSON:
    {
        "text_generation": int,
        "image_generation": int,
        "total": int
    }
    """
    try:
        # Resolve user to team
        team_id = usage_repo.get_user_team_id(user_id)
        if not team_id:
            print(f"track_slides_generated: No team found for user {user_id}")
            return None

        # Each slide consumed = 1 text_generation credit
        text_gen_credits = count * CREDIT_USAGE["text_generation"]
        return usage_repo.increment_credits(
            team_id, "text_generation", text_gen_credits
        )
    except Exception as e:
        print("track_slides_generated failed", e)
        return None


def check_generation_credits(user_id: str, slides_to_generate: int) -> Dict[str, Any]:
    """Check if user has sufficient credits for generation with grace period logic.

    Grace period:
    - Projected <= limit: Allow (normal)
    - limit < projected < 2x limit: Allow with warning (grace period)
    - Projected >= 2x limit: Hard block (over quota)

    Returns:
    {
        "allowed": bool,
        "current_credits": int,
        "credits_to_consume": int,
        "projected_credits": int,
        "credit_limit": int | None,
        "will_exceed": bool,
        "message": str,
    }
    """
    try:
        supabase = get_supabase()

        # Resolve user to team
        team_id = usage_repo.get_user_team_id(user_id)
        if not team_id:
            # Allow generation if user not found (safety fallback)
            return {
                "allowed": False,
                "current_credits": 0,
                "credits_to_consume": 0,
                "projected_credits": 0,
                "credit_limit": None,
                "will_exceed": False,
                "message": f"User not found, blocking generation",
            }

        # Get current credit balance
        ua = usage_repo.get_team_activity(team_id) or {}
        usage_map = ua.get("usage") or {}
        current_credits = int(usage_map.get("credits", {}).get("total") or 0)

        # Calculate credits to consume (1 credit per slide)
        credits_to_consume = slides_to_generate * CREDIT_USAGE["text_generation"]
        projected_credits = current_credits + credits_to_consume

        # Get user's Stripe subscription and credit limit
        try:
            user_res = (
                supabase.table("users")
                .select("stripe_customer_id")
                .eq("id", user_id)
                .execute()
            )
            if not getattr(user_res, "data", None) or len(user_res.data) == 0:
                # No user found, allow generation (fallback to unlimited)
                return {
                    "allowed": False,
                    "current_credits": current_credits,
                    "credits_to_consume": credits_to_consume,
                    "projected_credits": projected_credits,
                    "credit_limit": None,
                    "will_exceed": False,
                    "message": "No user found, blocking generation",
                }

            customer_id = user_res.data[0].get("stripe_customer_id")
            if not customer_id:
                # No Stripe customer, allow unlimited
                return {
                    "allowed": False,
                    "current_credits": current_credits,
                    "credits_to_consume": credits_to_consume,
                    "projected_credits": projected_credits,
                    "credit_limit": None,
                    "will_exceed": False,
                    "message": "No subscription, blocking generation",
                }

            # Get subscription and credit limit from metadata
            credit_limit = get_metric_limit(user_id, "credits")
            
            if not credit_limit:
                # No limit set, allow unlimited
                return {
                    "allowed": False,
                    "current_credits": current_credits,
                    "credits_to_consume": credits_to_consume,
                    "projected_credits": projected_credits,
                    "credit_limit": None,
                    "will_exceed": False,
                    "message": "No credit limit set, blocking generation",
                }

            # Check against limit with grace period
            will_exceed = projected_credits > credit_limit
            hard_block = projected_credits >= (credit_limit * 1.1) 
            # For 500 credits allow up to 550

            if hard_block:
                # Over 2x limit - hard block
                return {
                    "allowed": False,
                    "current_credits": current_credits,
                    "credits_to_consume": credits_to_consume,
                    "projected_credits": projected_credits,
                    "credit_limit": credit_limit,
                    "will_exceed": True,
                    "message": f"Generation blocked: projected credits ({projected_credits}) would exceed 1.2x your limit ({credit_limit * 1.2}). Current: {current_credits}/{credit_limit}",
                }

            if will_exceed:
                # Grace period: between limit and 2x limit
                return {
                    "allowed": True,
                    "current_credits": current_credits,
                    "credits_to_consume": credits_to_consume,
                    "projected_credits": projected_credits,
                    "credit_limit": credit_limit,
                    "will_exceed": True,
                    "message": f"⚠️ Warning: generation will exceed your credit limit. Current: {current_credits}/{credit_limit}. Projected: {projected_credits}. Please consider upgrading your plan.",
                }

            # Within limit
            return {
                "allowed": True,
                "current_credits": current_credits,
                "credits_to_consume": credits_to_consume,
                "projected_credits": projected_credits,
                "credit_limit": credit_limit,
                "will_exceed": False,
                "message": f"OK: {projected_credits}/{credit_limit} credits after generation",
            }

        except Exception as e:
            print(
                f"check_generation_credits: Stripe check failed - {e}. Allowing generation."
            )
            # Fallback: allow generation if Stripe check fails
            return {
                "allowed": False,
                "current_credits": current_credits,
                "credits_to_consume": credits_to_consume,
                "projected_credits": projected_credits,
                "credit_limit": None,
                "will_exceed": False,
                "message": "Stripe check failed, blocking generation",
            }

    except Exception as e:
        print(f"check_generation_credits failed: {e}")
        # Fail open: allow generation if anything goes wrong
        return {
            "allowed": False,
            "current_credits": 0,
            "credits_to_consume": 0,
            "projected_credits": 0,
            "credit_limit": None,
            "will_exceed": False,
            "message": f"System check failed, blocking generation: {str(e)}",
        }


# ============================================================================
# BRAND USAGE - Using optimized helpers
# ============================================================================


def get_brand_usage(user_id: str) -> Dict[str, Any]:
    """Get current brand usage for a user."""
    result = get_metric_usage(user_id, "brand_count")
    return {
        "brand_count": result.get("metric_count"),
        "brand_limit": result.get("metric_limit"),
        "remaining": result.get("remaining"),
        "error": result.get("error"),
    }


def check_and_track_brand(user_id: str, amount: int = 1) -> Dict[str, Any]:
    """Check brand limit and increment brand usage if allowed."""
    result = check_and_track_metric(user_id, "brand_count", amount)
    return {
        "allowed": result.get("allowed"),
        "brand_count": result.get("metric_count"),
        "brand_limit": result.get("metric_limit"),
        "remaining": result.get("remaining"),
        "message": result.get("message"),
        "error": result.get("error"),
        "usage": result.get("usage"),
    }


def decrement_brand(user_id: str, amount: int = 1) -> Dict[str, Any]:
    """Decrement brand usage (e.g., when a brand is deleted)."""
    result = decrement_metric(user_id, "brand_count", amount)
    return {
        "brand_count": result.get("metric_count"),
        "brand_limit": result.get("metric_limit"),
        "remaining": result.get("remaining"),
        "error": result.get("error"),
    }


# ============================================================================
# TEMPLATE USAGE - Using optimized helpers
# ============================================================================


def get_template_usage(user_id: str, brand_id: str) -> Dict[str, Any]:
    """Get current template usage for a user.

    If brand_id is provided, returns only templates for that brand.
    Otherwise, returns all templates for the user's team.
    """
    print(f"[SERVICE get_template_usage] user_id={user_id}, brand_id={brand_id}")
    template_usage = get_template_count(brand_id)

    
    template_limit = get_metric_limit(user_id, "template_count", brand_id=brand_id)
    
    print(f"[SERVICE get_template_usage] get_metric_usage {get_template_count}/{template_limit}")
    return {
        "template_count": template_usage,
        "template_limit": template_limit,
        "remaining": template_limit - template_usage,
    }


def check_and_track_template(user_id: str, amount: int = 1) -> Dict[str, Any]:
    """Check template limit and increment template usage if allowed."""
    result = check_and_track_metric(user_id, "template_count", amount)
    return {
        "allowed": result.get("allowed"),
        "template_count": result.get("metric_count"),
        "template_limit": result.get("metric_limit"),
        "remaining": result.get("remaining"),
        "message": result.get("message"),
        "error": result.get("error"),
        "usage": result.get("usage"),
    }


def decrement_template(user_id: str, amount: int = 1) -> Dict[str, Any]:
    """Decrement template usage (e.g., when a template is deleted)."""
    result = decrement_metric(user_id, "template_count", amount)
    return {
        "template_count": result.get("metric_count"),
        "template_limit": result.get("metric_limit"),
        "remaining": result.get("remaining"),
        "error": result.get("error"),
    }


# ============================================================================
# CREDITS USAGE - Using optimized helpers
# ============================================================================


def get_credits_usage(user_id: Optional[str], team_id: Optional[str] = None) -> Dict[str, Any]:
    """Get current credits usage and limit for a user or a specific team.

    Args:
        user_id: Optional user ID (used to get product limits). Can be None for public team access.
        team_id: Optional specific team ID to fetch credits for. If not provided, uses user's team (requires user_id).

    Returns: {"credits_used": int, "credits_limit": int|None}
    """
    try:
        # If team_id not provided, get from user
        if not team_id:
            if not user_id:
                return {"credits_used": 0, "credits_limit": None, "error": "No team_id or user_id provided"}
            team_id = usage_repo.get_user_team_id(user_id)
        
        if not team_id:
            return {"credits_used": 0, "credits_limit": None, "error": "User not found"}

        # Get credits used from team_activity usage.credits.total
        usage_map = _get_team_usage(team_id)
        credits_obj = usage_map.get("credits") or {}
        credits_used = int(credits_obj.get("total") or 0)

        # Get credits limit from product (only if we have a user_id)
        credits_limit = None
        if user_id:
            product_id = _get_user_product_id(user_id)
            credits_limit = _get_metric_limit(product_id, "credits")

        return {"credits_used": credits_used, "credits_limit": credits_limit}

    except Exception as e:
        print(f"get_credits_usage failed: {e}")
        return {"credits_used": 0, "credits_limit": None, "error": str(e)}
