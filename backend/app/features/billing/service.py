"""
Billing Service - Business logic for subscription and payment management.

Handles:
- Stripe checkout session creation
- Subscription lifecycle (create, update, cancel)
- Invoice tracking
- Payment status synchronization
"""

import logging
import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, UTC
from typing import Optional
from uuid import uuid4

from app.core.exceptions import NotFoundError, ValidationError, ExternalServiceError
from app.core.config import settings
from app.features.billing.models import (
    BillingPlan,
    Subscription,
    Invoice,
    SubscriptionStatus,
)
from app.features.billing.schemas import (
    CreateCheckoutSessionRequest,
    UpdateSubscriptionRequest,
    CancelSubscriptionRequest,
    CheckoutSessionResponse,
    SubscriptionResponse,
    SubscriptionDetailResponse,
    BillingPlanResponse,
    InvoiceResponse,
    BillingPortalResponse,
)
from app.features.billing.repository import plan_repo, subscription_repo, invoice_repo

logger = logging.getLogger(__name__)

# Initialize Stripe
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


class BillingService:
    """Service for billing and subscription operations."""

    # ═════════ PLANS ═════════

    async def get_available_plans(self, db: AsyncSession) -> list[BillingPlan]:
        """Get all available billing plans."""
        plans = await plan_repo.get_active_plans(db)
        return plans

    # ═════════ CHECKOUT & STRIPE INTEGRATION ═════════

    
    async def handle_checkout_completed(
        self, db: AsyncSession, user_id: str, session_id: str, plan_id: str
    ) -> SubscriptionResponse:
        """
        Process completed checkout and create subscription record.

        Called after user completes Stripe checkout.
        """
        try:
            # Get Stripe session
            session = stripe.checkout.Session.retrieve(session_id)
            if not session.subscription:
                raise ValidationError("Session has no subscription")

            stripe_subscription_id = session.subscription
            stripe_customer_id = session.customer

            # Get plan
            plan = await plan_repo.get(db, plan_id)
            if not plan:
                raise NotFoundError("BillingPlan", plan_id)

            # Create or update subscription record
            existing = await subscription_repo.get_by_user(db, user_id)

            if existing:
                # Update existing subscription
                existing.stripe_subscription_id = stripe_subscription_id
                existing.plan_id = plan_id
                existing.status = SubscriptionStatus.ACTIVE.value
                existing.auto_renew = True
                subscription = await subscription_repo.update(db, existing)
            else:
                # Create new subscription
                sub_id = f"sub_{uuid4().hex[:12]}"
                subscription = Subscription(
                    id=sub_id,
                    user_id=user_id,
                    plan_id=plan_id,
                    stripe_subscription_id=stripe_subscription_id,
                    stripe_customer_id=stripe_customer_id,
                    status=SubscriptionStatus.ACTIVE.value,
                    auto_renew=True,
                )
                subscription = await subscription_repo.create(db, subscription)

            # Sync subscription details from Stripe
            subscription = await self._sync_subscription_with_stripe(db, subscription)

            logger.info(
                f"Subscription created/updated for user {user_id}: {subscription.id}"
            )

            return SubscriptionResponse.model_validate(subscription)

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error processing checkout: {e}")
            raise ExternalServiceError(f"Failed to process checkout: {str(e)}")

    # ═════════ SUBSCRIPTION MANAGEMENT ═════════

    async def get_subscription(
        self, db: AsyncSession, user_id: str
    ) -> SubscriptionDetailResponse:
        """Get user's current subscription with plan details."""
        subscription = await subscription_repo.get_by_user(db, user_id)
        if not subscription:
            raise NotFoundError("Subscription", user_id)

        plan = await plan_repo.get(db, subscription.plan_id)
        if not plan:
            raise NotFoundError("BillingPlan", subscription.plan_id)

        # Calculate next invoice date
        next_invoice_date = None
        if subscription.current_period_end:
            next_invoice_date = subscription.current_period_end

        return SubscriptionDetailResponse(
            subscription=SubscriptionResponse.model_validate(subscription),
            plan=BillingPlanResponse.model_validate(plan),
            next_invoice_date=next_invoice_date,
            can_cancel=subscription.status
            in [SubscriptionStatus.ACTIVE.value, SubscriptionStatus.TRIALING.value],
            can_update=subscription.status
            in [SubscriptionStatus.ACTIVE.value, SubscriptionStatus.TRIALING.value],
        )

    async def update_subscription(
        self, db: AsyncSession, user_id: str, payload: UpdateSubscriptionRequest
    ) -> SubscriptionResponse:
        """Update subscription (change plan, auto-renew setting)."""
        subscription = await subscription_repo.get_by_user(db, user_id)
        if not subscription:
            raise NotFoundError("Subscription", user_id)

        if not stripe.api_key:
            raise ExternalServiceError("Stripe not configured")

        try:
            if payload.plan_id:
                # Change plan
                new_plan = await plan_repo.get(db, payload.plan_id)
                if not new_plan:
                    raise NotFoundError("BillingPlan", payload.plan_id)

                # Update in Stripe
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id,
                    items=[
                        {
                            "id": subscription.stripe_subscription_id,
                            "price": new_plan.stripe_price_id,
                        }
                    ],
                )

                subscription.plan_id = payload.plan_id

            if payload.auto_renew is not None:
                subscription.auto_renew = payload.auto_renew

            updated = await subscription_repo.update(db, subscription)

            # Sync with Stripe
            updated = await self._sync_subscription_with_stripe(db, updated)

            logger.info(f"Subscription updated for user {user_id}")
            return SubscriptionResponse.model_validate(updated)

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error updating subscription: {e}")
            raise ExternalServiceError(f"Failed to update subscription: {str(e)}")

    async def cancel_subscription(
        self, db: AsyncSession, user_id: str, payload: CancelSubscriptionRequest
    ) -> SubscriptionResponse:
        """Cancel user's subscription."""
        subscription = await subscription_repo.get_by_user(db, user_id)
        if not subscription:
            raise NotFoundError("Subscription", user_id)

        if subscription.status == SubscriptionStatus.CANCELED.value:
            raise ValidationError("Subscription is already canceled")

        if not stripe.api_key:
            raise ExternalServiceError("Stripe not configured")

        try:
            # Cancel in Stripe
            if payload.immediate:
                stripe.Subscription.delete(subscription.stripe_subscription_id)
            else:
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id, cancel_at_period_end=True
                )

            subscription.status = SubscriptionStatus.CANCELED.value
            subscription.canceled_at = datetime.now(UTC)

            updated = await subscription_repo.update(db, subscription)

            logger.info(f"Subscription canceled for user {user_id}")
            return SubscriptionResponse.model_validate(updated)

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error canceling subscription: {e}")
            raise ExternalServiceError(f"Failed to cancel subscription: {str(e)}")

    # ═════════ INVOICES ═════════

    async def get_invoices(
        self, db: AsyncSession, user_id: str, limit: int = 50
    ) -> list[InvoiceResponse]:
        """Get user's invoices."""
        invoices = await invoice_repo.get_by_user(db, user_id, limit)
        return [InvoiceResponse.model_validate(inv) for inv in invoices]

    async def get_unpaid_invoices(
        self, db: AsyncSession, user_id: str
    ) -> list[InvoiceResponse]:
        """Get unpaid invoices for user."""
        invoices = await invoice_repo.get_unpaid(db, user_id)
        return [InvoiceResponse.model_validate(inv) for inv in invoices]

    # ═════════ STRIPE WEBHOOKS & SYNC ═════════

    async def _sync_subscription_with_stripe(
        self, db: AsyncSession, subscription: Subscription
    ) -> Subscription:
        """Fetch latest subscription details from Stripe and update locally."""
        if not subscription.stripe_subscription_id or not stripe.api_key:
            return subscription

        try:
            stripe_sub = stripe.Subscription.retrieve(
                subscription.stripe_subscription_id
            )

            subscription.status = stripe_sub.status
            subscription.auto_renew = not stripe_sub.cancel_at_period_end
            subscription.current_period_start = datetime.fromtimestamp(
                stripe_sub.current_period_start, tz=UTC
            )
            subscription.current_period_end = datetime.fromtimestamp(
                stripe_sub.current_period_end, tz=UTC
            )

            if stripe_sub.trial_start:
                subscription.trial_start = datetime.fromtimestamp(
                    stripe_sub.trial_start, tz=UTC
                )
            if stripe_sub.trial_end:
                subscription.trial_end = datetime.fromtimestamp(
                    stripe_sub.trial_end, tz=UTC
                )

            return await subscription_repo.update(db, subscription)

        except stripe.error.StripeError as e:
            logger.warning(f"Failed to sync subscription from Stripe: {e}")
            return subscription

    async def handle_invoice_webhook(
        self, db: AsyncSession, stripe_invoice_id: str
    ) -> None:
        """Process invoice event from Stripe webhook."""
        if not stripe.api_key:
            raise ExternalServiceError("Stripe not configured")

        try:
            stripe_invoice = stripe.Invoice.retrieve(stripe_invoice_id)

            # Find or create invoice record
            existing = await invoice_repo.get_by_stripe_id(db, stripe_invoice_id)

            if existing:
                existing.paid = stripe_invoice.paid
                existing.payment_status = stripe_invoice.status
                if stripe_invoice.paid_at:
                    existing.paid_at = datetime.fromtimestamp(
                        stripe_invoice.paid_at, tz=UTC
                    )
                await invoice_repo.update(db, existing)
            else:
                # Create new invoice record
                inv_id = f"inv_{uuid4().hex[:12]}"
                invoice = Invoice(
                    id=inv_id,
                    user_id="",  # TODO: Resolve from subscription
                    stripe_invoice_id=stripe_invoice_id,
                    invoice_number=stripe_invoice.number,
                    subtotal_amount=stripe_invoice.subtotal or 0,
                    tax_amount=stripe_invoice.tax or 0,
                    total_amount=stripe_invoice.total,
                    currency=stripe_invoice.currency,
                    paid=stripe_invoice.paid,
                    payment_status=stripe_invoice.status,
                    invoice_date=datetime.fromtimestamp(stripe_invoice.created, tz=UTC),
                    due_date=datetime.fromtimestamp(stripe_invoice.due_date, tz=UTC)
                    if stripe_invoice.due_date
                    else None,
                    paid_at=datetime.fromtimestamp(stripe_invoice.paid_at, tz=UTC)
                    if stripe_invoice.paid_at
                    else None,
                )
                await invoice_repo.create(db, invoice)

            logger.info(f"Invoice webhook processed: {stripe_invoice_id}")

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error handling invoice webhook: {e}")
            raise ExternalServiceError(f"Failed to process invoice webhook: {str(e)}")

    # ═════════ CUSTOMER PORTAL ═════════

    async def get_customer_portal_url(
        self, db: AsyncSession, user_id: str, return_url: Optional[str] = None
    ) -> BillingPortalResponse:
        """Get Stripe customer portal URL for subscription/payment management."""
        subscription = await subscription_repo.get_by_user(db, user_id)
        if not subscription or not subscription.stripe_customer_id:
            raise NotFoundError("Subscription", user_id)

        if not stripe.api_key:
            raise ExternalServiceError("Stripe not configured")

        try:
            session = stripe.billingportal.Session.create(
                customer=subscription.stripe_customer_id,
                return_url=return_url or f"{settings.FRONTEND_URL}/billing",
            )

            return BillingPortalResponse(portal_url=session.url)

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating portal session: {e}")
            raise ExternalServiceError(f"Failed to create billing portal: {str(e)}")


# Module-level singleton
billing_service = BillingService()
