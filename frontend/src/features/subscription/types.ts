// Type definitions migrated from Polar SDK Python model
// Source: .venv/Lib/site-packages/polar_sdk/models/subscription.py

/** Basic scalar unions */
export type MetadataOutput = string | number | boolean;

/** Recurring interval values from Polar SDK */
export type SubscriptionRecurringInterval = 'day' | 'week' | 'month' | 'year';

/** Subscription status values from Polar SDK */
export type SubscriptionStatus =
	| 'incomplete'
	| 'incomplete_expired'
	| 'trialing'
	| 'active'
	| 'past_due'
	| 'canceled'
	| 'unpaid';

/** Reasons a customer cancelled (Polar SDK enum) */
export type CustomerCancellationReason =
	| 'customer_service'
	| 'low_quality'
	| 'missing_features'
	| 'switched_service'
	| 'too_complex'
	| 'too_expensive'
	| 'unused'
	| 'other';

/** Benefit object within a product */
export interface ProductBenefit {
	id?: string;
	type?: string | null;
	description?: string | null;
	is_highlighted?: boolean;
}

/** Minimal representation of a product (keeps parity with backend Product shape)
 * Extend as needed when more product fields are required in the UI.
 */
export interface PolarProduct {
	id: string;
	name?: string | null;
	description?: string | null;
	benefits?: ProductBenefit[] | null;
	metadata?: Record<string, any> | null;
}

/** Minimal customer representation returned by Polar */
export interface SubscriptionCustomer {
	id: string;
	external_id?: string | null;
	metadata?: Record<string, any> | null;
}

/** Price variant in a subscription */
export interface SubscriptionPrice {
	id: string;
	price_amount?: number;
	price_currency?: string;
	recurring_interval?: SubscriptionRecurringInterval | string;
}

/** Meter entry within a subscription */
export interface SubscriptionMeter {
	id: string;
	name?: string | null;
	balance?: number;
}

/** Pending update object applied at next period */
export interface PendingSubscriptionUpdate {
	created_at: string;
	modified_at?: string | null;
	id: string;
	applies_at: string;
	product_id?: string | null;
	seats?: number | null;
}

/** Main Subscription interface (mirrors Polar SDK Subscription model)
 * Dates are represented as ISO strings in the frontend.
 */
export interface PolarSubscription {
	created_at: string;
	modified_at?: string | null;
	id: string;
	amount: number;
	currency: string;
	recurring_interval: SubscriptionRecurringInterval | string;
	recurring_interval_count: number;
	status: SubscriptionStatus;
	current_period_start: string;
	current_period_end: string;
	trial_start?: string | null;
	trial_end?: string | null;
	cancel_at_period_end: boolean;
	canceled_at?: string | null;
	started_at?: string | null;
	ends_at?: string | null;
	ended_at?: string | null;
	customer_id: string;
	product_id: string;
	discount_id?: string | null;
	checkout_id?: string | null;
	customer_cancellation_reason?: CustomerCancellationReason | null;
	customer_cancellation_comment?: string | null;
	metadata: Record<string, MetadataOutput>;
	customer: SubscriptionCustomer;
	product: PolarProduct;
	discount?: any | null; // keep flexible — map more precisely if needed
	prices: SubscriptionPrice[];
	meters: SubscriptionMeter[];
	pending_update?: PendingSubscriptionUpdate | null;
	seats?: number | null;
	custom_field_data?: Record<string, MetadataOutput | null> | null;
}

export default PolarSubscription;
