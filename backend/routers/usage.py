import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

from auth import get_current_user
from backend.features.error.helper import api_error
from services.usage import repo as usage_repo
from services.usage import service as usage_service
from services.integrations.supabase.client import get_supabase
from typing import List
import json
import stripe

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/usage", tags=["usage"])


class ConsumeRequest(BaseModel):
    product_id: str
    amount: int = 1


class TrackRequest(BaseModel):
    metric: str
    amount: int = 1
    product_id: Optional[str] = None


class SlidesRequest(BaseModel):
    count: int = 1


class AiCreditsRequest(BaseModel):
    amount: int = 1
    action: Optional[str] = "consume"  # 'consume' or 'add'


@router.get("", name="get_usage")
@router.get("/", name="get_usage_with_slash")
def get_usage(user: str = Depends(get_current_user)):
    """Return the user's team usage row and any applicable product limits (does not mutate)."""
    try:
        
        team_id = usage_repo.get_user_team_id(user)
        if not team_id:
            api_error(status_code=404, code="TEAM_NOT_FOUND", message="User not found or not associated with team")
        
        # Read usage (team_activity) row
        row = usage_repo.get_team_activity(team_id)

        # Ensure we always return an object for usage so frontend doesn't get null
        if not row:
            api_error(status_code=404, code="USAGE_NOT_FOUND", message="Team usage does not exist")
            # row = {"team_id": team_id, "usage": {}, "period_start": None, "period_end": None}

        # Determine the team owner so we can find the owner's subscription/product
        supabase = get_supabase()
        team_res = supabase.table('teams').select('owner_id').eq('id', team_id).limit(1).execute()
        owner_id = None
        if getattr(team_res, 'data', None) and len(team_res.data) > 0:
            owner_id = team_res.data[0].get('owner_id')

        product_ids: List[str] = []

        # If we have an owner, look up their subscription/customer and extract product ids
        if owner_id:
            # Try to read a subscription id or stripe customer id from the users table
            user_res = supabase.table('users').select('stripe_subscription_id, stripe_customer_id').eq('id', owner_id).limit(1).execute()
            if getattr(user_res, 'data', None) and len(user_res.data) > 0:
                owner_row = user_res.data[0]
                subscription_id = owner_row.get('stripe_subscription_id')
                customer_id = owner_row.get('stripe_customer_id')

                # Prefer explicit subscription id if present
                try:
                    if subscription_id:
                        # retrieve subscription directly
                        try:
                            sub = stripe.Subscription.retrieve(subscription_id)
                        except Exception:
                            sub = None
                    elif customer_id:
                        sub = usage_service._get_active_subscription_for_customer(customer_id)
                    else:
                        sub = None

                    # Extract product ids from subscription items (prices -> product)
                    if sub:
                        items_obj = None
                        # stripe objects may behave like dicts
                        if hasattr(sub, 'get'):
                            items_obj = sub.get('items')
                        else:
                            items_obj = getattr(sub, 'items', None)

                        items_data = []
                        if isinstance(items_obj, dict):
                            items_data = items_obj.get('data', [])
                        elif isinstance(items_obj, list):
                            items_data = items_obj

                        for it in items_data:
                            # price may be nested dict or id
                            price = None
                            if isinstance(it, dict):
                                price = it.get('price') or it.get('price_id') or it.get('price_id')
                            else:
                                # try attribute access
                                price = getattr(it, 'price', None)

                            product_id = None
                            if isinstance(price, dict):
                                product_id = price.get('product')
                            elif isinstance(price, str):
                                # need to fetch price object to resolve product
                                try:
                                    price_obj = stripe.Price.retrieve(price)
                                    product_id = getattr(price_obj, 'product', None)
                                except Exception:
                                    product_id = None

                            if product_id and isinstance(product_id, str):
                                product_ids.append(product_id)
                except Exception as exc:
                    api_error(status_code=400, code="STRIPE_ERROR", message=str(exc))
                    # swallow errors from Stripe calls - we'll fall back to returning usage only
                    product_ids = []

        # Fetch matching product_rate_limits rows for the discovered product ids
        limits_rows = []
        for pid in set(product_ids):
            try:
                pr = usage_repo.get_product_rate_limit(pid)
                if pr:
                    # parse rules if string
                    if isinstance(pr.get('rules'), str):
                        try:
                            pr['rules'] = json.loads(pr['rules'])
                        except Exception:
                            pass
                    limits_rows.append(pr)
            except Exception as e:
                api_error(status_code=400, code="FAILED_RATE_LIMIT_QUERY", message=str(e))
                

        # If no specific limits found, return empty list rather than all limits
        print("out", {"usage": row, "limits": limits_rows})
        return {"usage": row, "limits": limits_rows}
    except Exception as e:
        logger.exception("Failed to fetch usage")
        api_error(status_code=500, code="FAILED_FETCHING_USAGE", message=str(e))



@router.post("/consume")
def consume(request: ConsumeRequest, user: str = Depends(get_current_user)):
    """Attempt to consume `amount` units for the given product_id. Returns allowed/remaining/limit."""
    try:
        res = usage_service.check_and_consume(user, request.product_id, request.amount)
        return res
    except Exception as e:
        logger.exception("Failed to consume usage")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/track")
def track_usage(request: TrackRequest, user: str = Depends(get_current_user)):
    """Track arbitrary usage metric. If `product_id` is provided, performs rate-limit check via `check_and_consume`.

    This endpoint is intended to be called by backend services when a billable action occurs.
    """
    try:
        if request.product_id:
            # perform full rate-limit check and consume
            res = usage_service.check_and_consume(user, request.product_id, request.amount)
            return res

        # simple tick of metric - resolve user to team
        team_id = usage_repo.get_user_team_id(user)
        if not team_id:
            raise HTTPException(status_code=404, detail="User not found or not associated with team")
        row = usage_repo.increment_or_create_usage(team_id, request.metric, request.amount)
        if not row:
            raise HTTPException(status_code=500, detail="Failed to record usage")
        return {"allowed": True, "usage": row}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to track usage")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/track/slides")
def track_slides(request: SlidesRequest, user: str = Depends(get_current_user)):
    """Track slides generated (default metric `slides_generated`)."""
    try:
        row = usage_service.track_slides_generated(user, int(request.count or 1))
        if row is None:
            raise HTTPException(status_code=500, detail="Failed to record slides generated")
        return {"allowed": True, "usage": row}
    except Exception as e:
        logger.exception("Failed to track slides")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/track/ai-credits")
def track_ai_credits(request: AiCreditsRequest, user: str = Depends(get_current_user)):
    """Add or consume AI credits for a user.

    POST body: { amount: int, action: 'consume' | 'add' }
    """
    try:
        if request.action == 'add':
            row = usage_service.add_ai_credits(user, int(request.amount or 1))
            if row is None:
                raise HTTPException(status_code=500, detail="Failed to add AI credits")
            return {"allowed": True, "usage": row}

        # consume
        res = usage_service.consume_ai_credits(user, int(request.amount or 1))
        return res
    except Exception as e:
        logger.exception("Failed to track ai credits")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync-period")
def sync_period(user: str = Depends(get_current_user)):
    """Force-sync the usage period from Stripe subscription for the current user."""
    try:
        row = usage_service.sync_usage_period_from_subscription(user)
        if not row:
            raise HTTPException(status_code=404, detail="No subscription or period found for user")
        return {"usage": row}
    except Exception as e:
        logger.exception("Failed to sync period")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/brands")
def get_brand_usage(user: str = Depends(get_current_user)):
    """Get current brand usage and limits for the authenticated user."""
    try:
        result = usage_service.get_brand_usage(user)
        # Return result even if it contains an error - let the client handle it
        # This ensures the endpoint always returns 200 with reasonable defaults
        return {
            "brand_count": result.get("brand_count", 0),
            "brand_limit": result.get("brand_limit"),
            "remaining": result.get("remaining")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to get brand usage")
        # Return defaults instead of 500 to prevent UI crashes
        return {
            "brand_count": 0,
            "brand_limit": None,
            "remaining": None
        }


@router.post("/brands/track")
def track_brand(user: str = Depends(get_current_user)):
    """Check brand limit and increment brand usage if allowed.
    
    This should be called when creating a new brand.
    Returns: {allowed: bool, brand_count: int, brand_limit: int|null, remaining: int|null}
    """
    try:
        result = usage_service.check_and_track_brand(user, amount=1)
        if not result.get("allowed"):
            raise HTTPException(
                status_code=403,
                detail=result.get("message", "Brand limit exceeded")
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to track brand")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates")
def get_template_usage(brand_id: str, user: str = Depends(get_current_user)):
    """Get current template usage and limits for the authenticated user.
    
    If brand_id is provided, returns only templates for that brand.
    Otherwise, returns all templates for the user's team.
    """
    try:
        logger.info("Brandid", brand_id)
        print(f"[ENDPOINT /api/usage/templates] user={user}, brand_id={brand_id}")
        result = usage_service.get_template_usage(user, brand_id=brand_id)
        print(f"[ENDPOINT /api/usage/templates] result={result}")
        # Return result even if it contains an error - let the client handle it
        # This ensures the endpoint always returns 200 with reasonable defaults
        return {
            "template_count": result.get("template_count", 0),
            "template_limit": result.get("template_limit"),
            "remaining": result.get("remaining")
        }
    except HTTPException as he:
        raise api_error(status_code=400, code="GET_USAGE_ERROR", message=f"Get template usage error: {he}")

    except Exception as e:
        print(f"[ENDPOINT /api/usage/templates] ERROR: {e}")
        logger.exception("Failed to get template usage")
        # Return defaults instead of 500 to prevent UI crashes
        return {
            "template_count": 0,
            "template_limit": None,
            "remaining": None
        }


# ============================================================================
# DEBUG ENDPOINTS - For troubleshooting usage tracking
# ============================================================================

@router.get("/debug/brands/check")
def debug_brand_check(user: str = Depends(get_current_user)):
    """Debug endpoint: Returns detailed info about brand usage"""
    try:
        from services.usage.service import _get_user_product_id, _get_team_usage, _get_metric_limit, _get_metric_usage
        
        team_id = usage_repo.get_user_team_id(user)
        product_id = _get_user_product_id(user)
        brand_count = _get_metric_usage(team_id, "brand_count")
        brand_limit = _get_metric_limit(product_id, "brand_count")
        
        return {
            "user_id": user,
            "team_id": team_id,
            "product_id": product_id,
            "brand_count": brand_count,
            "brand_limit": brand_limit,
            "remaining": (brand_limit - brand_count) if brand_limit else None,
            "allowed": (brand_limit - brand_count) > 0 if brand_limit else True
        }
    except Exception as e:
        logger.exception("Debug brand check failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/debug/templates/check")
def debug_template_check(user: str = Depends(get_current_user)):
    """Debug endpoint: Returns detailed info about template usage"""
    try:
        from services.usage.service import _get_user_product_id, _get_team_usage, _get_metric_limit, _get_metric_usage
        
        team_id = usage_repo.get_user_team_id(user)
        product_id = _get_user_product_id(user)
        template_count = _get_metric_usage(team_id, "template_count")
        template_limit = _get_metric_limit(product_id, "template_count")
        
        return {
            "user_id": user,
            "team_id": team_id,
            "product_id": product_id,
            "template_count": template_count,
            "template_limit": template_limit,
            "remaining": (template_limit - template_count) if template_limit else None,
            "allowed": (template_limit - template_count) > 0 if template_limit else True
        }
    except Exception as e:
        logger.exception("Debug template check failed")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CREDITS ENDPOINTS - For displaying credit limit and usage
# ============================================================================

@router.get("/credits")
def get_credits_usage(user: str = Depends(get_current_user)):
    """Get current credits usage and limit for the authenticated user.
    
    Returns: {credits_used: int, credits_limit: int|null}
    """
    try:
        result = usage_service.get_credits_usage(user)
        # Return result even if it contains an error - let the client handle it
        # This ensures the endpoint always returns 200 with reasonable defaults
        return {
            "credits_used": result.get("credits_used", 0),
            "credits_limit": result.get("credits_limit")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to get credits usage")
        # Return defaults instead of 500 to prevent UI crashes
        return {
            "credits_used": 0,
            "credits_limit": None
        }
