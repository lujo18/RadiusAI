"""
Billing Repository - Data access for subscriptions, plans, and invoices.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import Optional
from uuid import uuid4

from app.shared.base_repository import BaseRepository
from app.features.billing.models import BillingPlan, Subscription, Invoice


class BillingPlanRepository(BaseRepository[BillingPlan]):
    """Repository for BillingPlan ORM operations."""
    
    def __init__(self):
        super().__init__(BillingPlan)
    
    async def get_by_stripe_product(
        self, 
        db: AsyncSession, 
        stripe_product_id: str
    ) -> Optional[BillingPlan]:
        """Get plan by Stripe product ID."""
        stmt = select(BillingPlan).where(BillingPlan.stripe_product_id == stripe_product_id)
        result = await db.execute(stmt)
        return result.scalars().first()
    
    async def get_by_tier(
        self, 
        db: AsyncSession, 
        tier: str
    ) -> Optional[BillingPlan]:
        """Get plan by tier (assumes one plan per tier)."""
        stmt = select(BillingPlan).where(
            and_(
                BillingPlan.tier == tier,
                BillingPlan.is_active == True
            )
        )
        result = await db.execute(stmt)
        return result.scalars().first()
    
    async def get_active_plans(
        self, 
        db: AsyncSession
    ) -> list[BillingPlan]:
        """Get all active billing plans."""
        stmt = select(BillingPlan).where(BillingPlan.is_active == True)
        result = await db.execute(stmt)
        return result.scalars().all()


class SubscriptionRepository(BaseRepository[Subscription]):
    """Repository for Subscription ORM operations."""
    
    def __init__(self):
        super().__init__(Subscription)
    
    async def get_by_user(
        self, 
        db: AsyncSession, 
        user_id: str
    ) -> Optional[Subscription]:
        """Get user's active subscription."""
        stmt = select(Subscription).where(Subscription.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalars().first()
    
    async def get_by_stripe_id(
        self, 
        db: AsyncSession, 
        stripe_subscription_id: str
    ) -> Optional[Subscription]:
        """Get subscription by Stripe subscription ID."""
        stmt = select(Subscription).where(
            Subscription.stripe_subscription_id == stripe_subscription_id
        )
        result = await db.execute(stmt)
        return result.scalars().first()
    
    async def get_by_status(
        self, 
        db: AsyncSession, 
        status: str
    ) -> list[Subscription]:
        """Get all subscriptions with a specific status."""
        stmt = select(Subscription).where(Subscription.status == status)
        result = await db.execute(stmt)
        return result.scalars().all()
    
    async def get_expiring_soon(
        self, 
        db: AsyncSession, 
        days: int = 7
    ) -> list[Subscription]:
        """Get subscriptions expiring in N days."""
        from datetime import datetime, timedelta, timezone
        
        cutoff = datetime.now(timezone.utc) + timedelta(days=days)
        stmt = select(Subscription).where(
            and_(
                Subscription.current_period_end <= cutoff,
                Subscription.auto_renew == True,
                Subscription.status.in_(["active", "trialing"])
            )
        )
        result = await db.execute(stmt)
        return result.scalars().all()


class InvoiceRepository(BaseRepository[Invoice]):
    """Repository for Invoice ORM operations."""
    
    def __init__(self):
        super().__init__(Invoice)
    
    async def get_by_user(
        self, 
        db: AsyncSession, 
        user_id: str,
        limit: int = 50
    ) -> list[Invoice]:
        """Get invoices for a user."""
        stmt = select(Invoice).where(
            Invoice.user_id == user_id
        ).order_by(desc(Invoice.invoice_date)).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()
    
    async def get_by_subscription(
        self, 
        db: AsyncSession, 
        subscription_id: str
    ) -> list[Invoice]:
        """Get invoices for a subscription."""
        stmt = select(Invoice).where(
            Invoice.subscription_id == subscription_id
        ).order_by(desc(Invoice.invoice_date))
        result = await db.execute(stmt)
        return result.scalars().all()
    
    async def get_by_stripe_id(
        self, 
        db: AsyncSession, 
        stripe_invoice_id: str
    ) -> Optional[Invoice]:
        """Get invoice by Stripe invoice ID."""
        stmt = select(Invoice).where(Invoice.stripe_invoice_id == stripe_invoice_id)
        result = await db.execute(stmt)
        return result.scalars().first()
    
    async def get_unpaid(
        self, 
        db: AsyncSession, 
        user_id: str
    ) -> list[Invoice]:
        """Get unpaid invoices for a user."""
        stmt = select(Invoice).where(
            and_(
                Invoice.user_id == user_id,
                Invoice.paid == False
            )
        ).order_by(desc(Invoice.invoice_date))
        result = await db.execute(stmt)
        return result.scalars().all()


# Module-level singletons
plan_repo = BillingPlanRepository()
subscription_repo = SubscriptionRepository()
invoice_repo = InvoiceRepository()
