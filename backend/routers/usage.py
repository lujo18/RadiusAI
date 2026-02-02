import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from backend.auth import get_current_user
from backend.services.usage import repo as usage_repo
from backend.services.usage import service as usage_service

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


@router.get("/")
def get_usage(user: str = Depends(get_current_user)):
    """Return the user's usage row and any applicable product limits (does not mutate)."""
    try:
        row = usage_repo.get_user_activity(user)
        limits = usage_repo.get_all_product_rate_limits()
        return {"usage": row, "limits": limits}
    except Exception as e:
        logger.exception("Failed to fetch usage")
        raise HTTPException(status_code=500, detail=str(e))


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

        # simple tick of metric
        row = usage_repo.increment_or_create_usage(user, request.metric, request.amount)
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
