"""
Billing Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ═════════ REQUEST SCHEMAS ═════════


class CreateCheckoutSessionRequest(BaseModel):
    """Request to create a Stripe checkout session."""

    plan_id: str = Field(description="Billing plan ID to checkout")
    success_url: Optional[str] = None


class UpdateSubscriptionRequest(BaseModel):
    """Request to update subscription (change plan or auto-renew)."""

    plan_id: Optional[str] = None
    auto_renew: Optional[bool] = None


class CancelSubscriptionRequest(BaseModel):
    """Request to cancel subscription."""

    immediate: bool = Field(
        default=False, description="Cancel immediately or at period end"
    )
    reason: Optional[str] = None


# ═════════ RESPONSE SCHEMAS ═════════


class BillingPlanResponse(BaseModel):
    """Response with billing plan information."""

    id: str
    stripe_product_id: str
    stripe_price_id: str
    tier: str
    name: str
    description: Optional[str]
    price_amount: int
    currency: str
    billing_period: str
    features: Optional[dict]
    limits: Optional[dict]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SubscriptionResponse(BaseModel):
    """Response with subscription details."""

    id: str
    user_id: str
    plan_id: str
    status: str
    stripe_subscription_id: Optional[str]
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    trial_start: Optional[datetime]
    trial_end: Optional[datetime]
    auto_renew: bool
    canceled_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InvoiceResponse(BaseModel):
    """Response with invoice information."""

    id: str
    user_id: str
    stripe_invoice_id: str
    invoice_number: Optional[str]
    subtotal_amount: int
    tax_amount: int
    total_amount: int
    currency: str
    paid: bool
    payment_status: str
    invoice_date: datetime
    due_date: Optional[datetime]
    paid_at: Optional[datetime]
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CheckoutSessionResponse(BaseModel):
    """Response with Stripe checkout session."""

    session_id: str
    checkout_url: str
    expires_at: datetime


class SubscriptionDetailResponse(BaseModel):
    """Comprehensive subscription response with plan details."""

    subscription: SubscriptionResponse
    plan: BillingPlanResponse
    next_invoice_date: Optional[datetime]
    can_cancel: bool
    can_update: bool


class BillingPortalResponse(BaseModel):
    """Response with Stripe customer portal URL."""

    portal_url: str


class InvoiceListResponse(BaseModel):
    """Response with list of invoices."""

    items: list[InvoiceResponse]
    total: int
    has_unpaid: bool


class CheckoutCompletedResponse(BaseModel):
    """Response when checkout is completed."""

    success: bool
    session_id: str
    subscription_id: Optional[str]
    message: str
