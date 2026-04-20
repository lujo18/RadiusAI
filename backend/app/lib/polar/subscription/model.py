from __future__ import annotations

from pydantic import BaseModel


from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime
"""
Consolidated Polar subscription models

This file removes duplicate definitions and organizes models by category:
 - Shared types
 - Meter models
 - Benefit models
 - Customer / Subscription models
 - Product models

Keep definitions small and import only once.
"""


# -----------------------------
# Shared types
# -----------------------------


class Pagination(BaseModel):
    total_count: int
    max_page: int


# -----------------------------
# Meter-related models
# -----------------------------


class MeterFilterClause(BaseModel):
    property: str
    operator: str
    value: str


class MeterFilter(BaseModel):
    conjunction: str
    clauses: List[MeterFilterClause]


class MeterAggregation(BaseModel):
    func: str


class Meter(BaseModel):
    metadata: Dict[str, str]
    created_at: datetime
    modified_at: datetime
    id: str
    name: str
    filter: MeterFilter
    aggregation: MeterAggregation
    organization_id: str
    archived_at: Optional[datetime]


class MeterEntry(BaseModel):
    created_at: datetime
    modified_at: datetime
    id: str
    consumed_units: int
    credited_units: int
    amount: int
    meter_id: str
    meter: Meter


class MeterListResponse(BaseModel):
    items: List[Meter]
    pagination: Pagination


# -----------------------------
# Benefit-related models
# -----------------------------


class BenefitProperties(BaseModel):
    note: Optional[str]


class Benefit(BaseModel):
    id: str
    created_at: datetime
    modified_at: datetime
    type: str
    description: Optional[str]
    selectable: bool
    deletable: bool
    organization_id: str
    metadata: Dict[str, str]
    properties: BenefitProperties


class BenefitListResponse(BaseModel):
    items: List[Benefit]
    pagination: Pagination


# -----------------------------
# Customer / Subscription models
# -----------------------------


class BillingAddress(BaseModel):
    country: Optional[str]
    line1: Optional[str]
    line2: Optional[str]
    postal_code: Optional[str]
    city: Optional[str]
    state: Optional[str]


class GrantedBenefitProperties(BaseModel):
    account_id: Optional[str]
    guild_id: Optional[str]
    role_id: Optional[str]
    granted_account_id: Optional[str]


class GrantedBenefit(BaseModel):
    id: str
    created_at: datetime
    modified_at: datetime
    granted_at: datetime
    benefit_id: str
    benefit_type: str
    benefit_metadata: Dict[str, str]
    properties: GrantedBenefitProperties


class ActiveMeter(BaseModel):
    id: str
    created_at: datetime
    modified_at: datetime
    meter_id: str
    consumed_units: int
    credited_units: int
    balance: int


class ActiveSubscription(BaseModel):
    id: str
    created_at: datetime
    modified_at: datetime
    metadata: Dict[str, str]
    status: str
    amount: int
    currency: str
    recurring_interval: Optional[str]
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    trial_start: Optional[datetime]
    trial_end: Optional[datetime]
    cancel_at_period_end: bool
    canceled_at: Optional[datetime]
    started_at: Optional[datetime]
    ends_at: Optional[datetime]
    product_id: str
    discount_id: Optional[str]
    meters: List[MeterEntry]
    custom_field_data: Dict[str, str]


class CustomerState(BaseModel):
    id: str
    created_at: datetime
    modified_at: datetime
    metadata: Dict[str, str]
    email: Optional[str]
    email_verified: Optional[bool]
    name: Optional[str]
    billing_address: Optional[BillingAddress]
    tax_id: Optional[Dict[str, str]]
    organization_id: Optional[str]
    deleted_at: Optional[datetime]

    active_subscriptions: List[ActiveSubscription]
    granted_benefits: List[GrantedBenefit]
    active_meters: List[ActiveMeter]

    avatar_url: Optional[str]
    external_id: Optional[str]
    type: Optional[str]
    locale: Optional[str]


# -----------------------------
# Product-related models
# -----------------------------


class Price(BaseModel):
    created_at: datetime
    modified_at: datetime
    id: str
    source: str
    amount_type: Optional[str]
    price_currency: Optional[str]
    is_archived: bool
    product_id: str
    type: Optional[str]
    recurring_interval: Optional[str]
    price_amount: Optional[int]
    legacy: Optional[bool]


class Media(BaseModel):
    id: str
    organization_id: str
    name: str
    path: str
    mime_type: str
    size: int
    storage_version: Optional[str]
    checksum_etag: Optional[str]
    checksum_sha256_base64: Optional[str]
    checksum_sha256_hex: Optional[str]
    last_modified_at: datetime
    version: Optional[str]
    service: Optional[str]
    is_uploaded: bool
    created_at: datetime
    size_readable: Optional[str]
    public_url: Optional[str]


class CustomFieldProperties(BaseModel):
    form_label: Optional[str]
    form_help_text: Optional[str]
    form_placeholder: Optional[str]
    textarea: Optional[bool]
    min_length: Optional[int]
    max_length: Optional[int]


class CustomField(BaseModel):
    created_at: datetime
    modified_at: datetime
    id: str
    metadata: Dict[str, str]
    type: str
    slug: str
    name: str
    organization_id: str
    properties: CustomFieldProperties


class AttachedCustomField(BaseModel):
    custom_field_id: str
    custom_field: CustomField
    order: int
    required: bool


class AttachedCustomFieldList(BaseModel):
    items: List[AttachedCustomField]


class Discount(BaseModel):
    duration: Optional[str]
    type: Optional[str]
    amount: Optional[int]
    currency: Optional[str]
    amounts: Dict[str, int]
    created_at: datetime
    modified_at: datetime
    id: str
    metadata: Dict[str, str]
    name: Optional[str]
    code: Optional[str]
    starts_at: Optional[datetime]
    ends_at: Optional[datetime]
    max_redemptions: Optional[int]
    redemptions_count: Optional[int]
    organization_id: Optional[str]


class PendingUpdate(BaseModel):
    created_at: datetime
    modified_at: datetime
    id: str
    applies_at: datetime
    product_id: str
    seats: int


class Product(BaseModel):
    id: str
    created_at: datetime
    modified_at: datetime
    trial_interval: Optional[str]
    trial_interval_count: Optional[int]
    name: str
    description: Optional[str]
    visibility: str
    recurring_interval: Optional[str]
    recurring_interval_count: Optional[int]
    is_recurring: bool
    is_archived: bool
    organization_id: str
    metadata: Dict[str, str]
    prices: List[Price]
    benefits: List[Benefit]
    medias: List[Media]
    attached_custom_fields: List[AttachedCustomField]


class SubscriptionItem(BaseModel):
    created_at: datetime
    modified_at: datetime
    id: str
    amount: int
    currency: str
    recurring_interval: Optional[str]
    recurring_interval_count: Optional[int]
    status: str
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    trial_start: Optional[datetime]
    trial_end: Optional[datetime]
    cancel_at_period_end: bool
    canceled_at: Optional[datetime]
    started_at: Optional[datetime]
    ends_at: Optional[datetime]
    ended_at: Optional[datetime]
    customer_id: str
    product_id: str
    discount_id: Optional[str]
    checkout_id: Optional[str]
    customer_cancellation_reason: Optional[str]
    customer_cancellation_comment: Optional[str]
    metadata: Dict[str, str]
    customer: Optional[CustomerState]
    product: Optional[Product]
    discount: Optional[Discount]
    prices: List[Price]
    meters: List[MeterEntry]
    pending_update: Optional[PendingUpdate]
    seats: Optional[int]
    custom_field_data: Dict[str, str]


class SubscriptionListResponse(BaseModel):
    items: List[SubscriptionItem]
    pagination: Pagination


class ProductListResponse(BaseModel):
    items: List[Product]
    pagination: Pagination
