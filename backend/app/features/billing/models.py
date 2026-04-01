"""
Billing ORM Models for subscription and payment tracking.

Stores subscription state, plans, and invoices locally for quick access.
Syncs with Stripe for authoritative source of truth.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String,
    Integer,
    DateTime,
    JSON,
    ForeignKey,
    Index,
    Boolean,
    Enum as SQLEnum,
)
from sqlalchemy.orm import Mapped, mapped_column
import enum

from app.core.database import Base


class BillingPlanTier(str, enum.Enum):
    """Billing plan tiers."""

    FREE = "free"
    PRO = "pro"
    AGENCY = "agency"


class SubscriptionStatus(str, enum.Enum):
    """Subscription lifecycle states."""

    ACTIVE = "active"
    PAUSED = "paused"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    TRIAL = "trial"
    INACTIVE = "inactive"


class BillingPlan(Base):
    """
    Stored billing plan information (mirrors Stripe products).

    Each user can have one active subscription at a time.
    """

    __tablename__ = "billing_plans"

    # Primary Key
    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # plan_{uuid}

    # Stripe references
    stripe_product_id: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True
    )
    stripe_price_id: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True
    )

    # Plan info
    tier: Mapped[str] = mapped_column(String(50), nullable=False)  # free, pro, agency
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Pricing
    price_amount: Mapped[int] = mapped_column(Integer, nullable=False)  # In cents
    currency: Mapped[str] = mapped_column(String(3), default="usd")
    billing_period: Mapped[str] = mapped_column(String(50))  # monthly, yearly, one_time

    # Features & limits (stored as JSON for flexibility)
    features: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    limits: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.utcnow()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow()
    )

    # Indexes
    __table_args__ = (
        Index("ix_billing_plan_tier", "tier"),
        Index("ix_billing_plan_stripe_product", "stripe_product_id"),
    )


class Subscription(Base):
    """
    User subscription tracking.

    Links user to active plan with status and dates.
    """

    __tablename__ = "subscriptions"

    # Primary Key & Foreign Keys
    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # sub_{uuid}
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id"), nullable=False, unique=True
    )
    plan_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("billing_plans.id"), nullable=False
    )

    # Stripe references
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, unique=True
    )
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )

    # Status
    status: Mapped[str] = mapped_column(
        String(50), default=SubscriptionStatus.ACTIVE.value
    )

    # Period tracking
    current_period_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    current_period_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    trial_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    trial_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Auto-renewal & cancellation
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True)
    canceled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Metadata
    meta_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.utcnow()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow()
    )

    # Indexes
    __table_args__ = (
        Index("ix_subscription_user_id", "user_id"),
        Index("ix_subscription_plan_id", "plan_id"),
        Index("ix_subscription_status", "status"),
        Index("ix_subscription_stripe", "stripe_subscription_id"),
    )


class Invoice(Base):
    """
    Billing invoice tracking.

    Records all charges and payments to user.
    """

    __tablename__ = "invoices"

    # Primary Key & Foreign Keys
    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # inv_{uuid}
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("users.id"), nullable=False
    )
    subscription_id: Mapped[Optional[str]] = mapped_column(
        String(50), ForeignKey("subscriptions.id"), nullable=True
    )

    # Stripe references
    stripe_invoice_id: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True
    )

    # Invoice info
    invoice_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Amount
    subtotal_amount: Mapped[int] = mapped_column(Integer)  # In cents
    tax_amount: Mapped[int] = mapped_column(Integer, default=0)
    total_amount: Mapped[int] = mapped_column(Integer)  # In cents
    currency: Mapped[str] = mapped_column(String(3), default="usd")

    # Status
    paid: Mapped[bool] = mapped_column(Boolean, default=False)
    payment_status: Mapped[str] = mapped_column(
        String(50)
    )  # paid, draft, pending, void, uncollectible

    # Dates
    invoice_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Metadata
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    meta_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.utcnow()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow()
    )

    # Indexes
    __table_args__ = (
        Index("ix_invoice_user_id", "user_id"),
        Index("ix_invoice_subscription_id", "subscription_id"),
        Index("ix_invoice_paid_status", "paid"),
        Index("ix_invoice_stripe", "stripe_invoice_id"),
    )
