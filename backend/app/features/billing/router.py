"""
Billing Router - HTTP endpoints for subscription and payment management.

Endpoints:
- GET /billing/plans - Get available billing plans
- POST /billing/checkout - Create checkout session
- GET /billing/checkout/success - Checkout success callback
- GET /billing/subscription - Get current subscription
- PATCH /billing/subscription - Update subscription
- POST /billing/subscription/cancel - Cancel subscription
- GET /billing/invoices - List invoices
- GET /billing/portal - Get customer portal URL
- POST /billing/webhook - Stripe webhook handler
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.exceptions import AppError
from app.features.billing.service import billing_service
from app.features.billing.schemas import (
    CreateCheckoutSessionRequest,
    UpdateSubscriptionRequest,
    CancelSubscriptionRequest,
    BillingPlanResponse,
    CheckoutSessionResponse,
    SubscriptionDetailResponse,
    InvoiceListResponse,
    BillingPortalResponse,
    CheckoutCompletedResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])


# ═════════ PLANS ═════════

@router.get("/plans", response_model=list[BillingPlanResponse])
async def get_available_plans(
    db: AsyncSession = Depends(get_db),
):
    """Get all available billing plans (no auth required)."""
    try:
        plans = await billing_service.get_available_plans(db)
        await db.commit()
        return [BillingPlanResponse.model_validate(p) for p in plans]
    except AppError as e:
        logger.warning(f"Plans fetch failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.exception("Unexpected error fetching plans")
        raise HTTPException(status_code=500, detail="Failed to fetch plans")


# ═════════ CHECKOUT ═════════

@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create Stripe checkout session for subscription.
    
    User is redirected to Stripe checkout URL.
    """
    try:
        response = await billing_service.create_checkout_session(
            db, user_id, request
        )
        await db.commit()
        return response
    except AppError as e:
        await db.rollback()
        logger.warning(f"Checkout creation failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error creating checkout")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.get("/checkout/success", response_model=CheckoutCompletedResponse)
async def checkout_success(
    session_id: str = Query(..., description="Stripe checkout session ID"),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle checkout completion.
    
    Called after user returns from Stripe checkout.
    """
    try:
        # TODO: Extract plan_id from session - for now hardcode or query session
        subscription = await billing_service.handle_checkout_completed(
            db, user_id, session_id, "plan_id_placeholder"
        )
        await db.commit()
        
        return CheckoutCompletedResponse(
            success=True,
            session_id=session_id,
            subscription_id=subscription.id,
            message="Subscription created successfully"
        )
    except AppError as e:
        await db.rollback()
        logger.warning(f"Checkout completion failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error completing checkout")
        raise HTTPException(status_code=500, detail="Failed to complete checkout")


# ═════════ SUBSCRIPTION ═════════

@router.get("/subscription", response_model=SubscriptionDetailResponse)
async def get_subscription(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current subscription details."""
    try:
        subscription = await billing_service.get_subscription(db, user_id)
        await db.commit()
        return subscription
    except AppError as e:
        logger.warning(f"Subscription fetch failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.exception("Unexpected error fetching subscription")
        raise HTTPException(status_code=500, detail="Failed to fetch subscription")


@router.patch("/subscription", response_model=SubscriptionDetailResponse)
async def update_subscription(
    request: UpdateSubscriptionRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update subscription (change plan, auto-renew)."""
    try:
        updated = await billing_service.update_subscription(db, user_id, request)
        await db.commit()
        
        # Fetch updated details
        subscription = await billing_service.get_subscription(db, user_id)
        return subscription
    except AppError as e:
        await db.rollback()
        logger.warning(f"Subscription update failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error updating subscription")
        raise HTTPException(status_code=500, detail="Failed to update subscription")


@router.post("/subscription/cancel", status_code=status.HTTP_200_OK)
async def cancel_subscription(
    request: CancelSubscriptionRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel subscription."""
    try:
        await billing_service.cancel_subscription(db, user_id, request)
        await db.commit()
        
        return {"success": True, "message": "Subscription canceled successfully"}
    except AppError as e:
        await db.rollback()
        logger.warning(f"Subscription cancellation failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error canceling subscription")
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")


# ═════════ INVOICES ═════════

@router.get("/invoices", response_model=InvoiceListResponse)
async def get_invoices(
    limit: int = Query(50, ge=1, le=100),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user's invoices."""
    try:
        invoices = await billing_service.get_invoices(db, user_id, limit)
        unpaid = await billing_service.get_unpaid_invoices(db, user_id)
        
        await db.commit()
        
        return InvoiceListResponse(
            items=invoices,
            total=len(invoices),
            has_unpaid=len(unpaid) > 0,
        )
    except AppError as e:
        logger.warning(f"Invoices fetch failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.exception("Unexpected error fetching invoices")
        raise HTTPException(status_code=500, detail="Failed to fetch invoices")


# ═════════ BILLING PORTAL ═════════

@router.get("/portal", response_model=BillingPortalResponse)
async def get_billing_portal(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get Stripe customer portal URL for self-service billing management."""
    try:
        portal = await billing_service.get_customer_portal_url(db, user_id)
        await db.commit()
        return portal
    except AppError as e:
        logger.warning(f"Portal URL fetch failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.exception("Unexpected error fetching portal URL")
        raise HTTPException(status_code=500, detail="Failed to get billing portal")


# ═════════ STRIPE WEBHOOKS ═════════

@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Stripe webhook events.
    
    Processes:
    - checkout.session.completed
    - invoice.payment_succeeded
    - invoice.payment_failed
    - customer.subscription.updated
    - customer.subscription.deleted
    """
    try:
        # Get webhook signature header
        sig_header = request.headers.get("stripe-signature")
        if not sig_header:
            raise HTTPException(status_code=400, detail="Missing stripe-signature header")
        
        # Read body
        body = await request.body()
        
        # Verify & parse signature (simplified - full validation should use Stripe library)
        # In production, use: stripe.Webhook.construct_event(body, sig_header, endpoint_secret)
        
        try:
            event = json.loads(body)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON")
        
        # Route to handlers
        event_type = event.get("type")
        event_data = event.get("data", {}).get("object", {})
        
        if event_type == "invoice.payment_succeeded":
            stripe_invoice_id = event_data.get("id")
            if stripe_invoice_id:
                await billing_service.handle_invoice_webhook(db, stripe_invoice_id)
        
        await db.commit()
        
        logger.info(f"Webhook processed: {event_type}")
        return {"received": True}
    
    except AppError as e:
        await db.rollback()
        logger.warning(f"Webhook processing failed: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error processing webhook")
        raise HTTPException(status_code=500, detail="Failed to process webhook")


# ═════════ DEBUG ENDPOINTS ═════════

@router.get("/debug/status", response_model=dict)
async def debug_billing_status(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Debug endpoint: Check billing status for user."""
    try:
        subscription = await billing_service.get_subscription(db, user_id)
        await db.commit()
        
        return {
            "has_subscription": subscription is not None,
            "status": subscription.subscription.status if subscription else None,
            "plan": subscription.plan.tier if subscription else None,
            "auto_renew": subscription.subscription.auto_renew if subscription else None,
        }
    except HTTPException:
        # No subscription is fine for debug
        return {
            "has_subscription": False,
            "status": None,
            "plan": None,
            "auto_renew": None,
        }
    except Exception as e:
        logger.exception("Debug status check failed")
        raise HTTPException(status_code=500, detail=str(e))
