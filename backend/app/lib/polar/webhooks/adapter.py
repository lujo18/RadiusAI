"""Polar webhook event adapter.

Translates Polar webhook events into internal subscription and benefits updates.
Validates signatures, deduplicates events, and maintains idempotency.
"""

import json
import hmac
import hashlib
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from app.lib.polar.errors import PolarError
from app.core.config import settings

logger = logging.getLogger(__name__)


class PolarWebhookAdapter:
    """Adapts Polar webhook events to internal subscription flow."""

    def __init__(self, webhook_secret: Optional[str] = None):
        """Initialize adapter with optional webhook secret for signature validation.

        Args:
            webhook_secret: Polar webhook signing secret (from POLAR_WEBHOOK_SECRET env).
        """
        self.webhook_secret = webhook_secret or settings.POLAR_WEBHOOK_SECRET

    def validate_signature(self, raw_body: bytes, signature_header: str) -> bool:
        """Validate that the webhook is genuinely from Polar.

        Polar sends an 'X-Polar-Signature' header with HMAC-SHA256 of the raw body.

        Args:
            raw_body: Raw HTTP request body
            signature_header: Value of X-Polar-Signature header

        Returns:
            True if signature is valid, False otherwise
        """
        if not self.webhook_secret:
            logger.warning(
                "No POLAR_WEBHOOK_SECRET configured; skipping signature validation"
            )
            return True

        try:
            # Compute expected signature: HMAC-SHA256(secret, body) in hex
            expected_sig = hmac.new(
                self.webhook_secret.encode(),
                raw_body,
                hashlib.sha256,
            ).hexdigest()

            # Secure comparison to prevent timing attacks
            return hmac.compare_digest(expected_sig, signature_header.lower())

        except Exception as exc:
            logger.error(f"Signature validation failed: {exc}")
            return False

    def parse_event(self, event_json: Dict[str, Any]) -> Dict[str, Any]:
        """Extract and normalize Polar event structure.

        Expected Polar webhook structure:
        {
            "type": "subscription.created|subscription.updated|subscription.cancelled|invoice.paid|invoice.created",
            "created_at": "2025-01-01T12:00:00Z",
            "data": {
                "id": "sub_...",
                "customer_id": "cus_...",
                "product_id": "prod_...",
                "price_id": "price_...",
                "status": "active|trialing|paused|canceled",
                "metadata": {...},
                ...
            }
        }

        Returns normalized event dict with keys:
        - event_type: str (e.g., 'subscription.created')
        - event_id: str (Polar event ID for dedup)
        - created_at: ISO timestamp
        - subject: dict (Polar object data)
        - user_id: str (extracted from metadata or None)
        """
        event_type = event_json.get("type", "unknown")
        subject = event_json.get("data", {})
        metadata = subject.get("metadata", {})

        # Extract user_id from metadata (we store it there during checkout)
        user_id = metadata.get("supabase_user_id") or metadata.get("user_id")

        return {
            "event_type": event_type,
            "event_id": subject.get("id"),
            "created_at": event_json.get("created_at", datetime.utcnow().isoformat()),
            "subject": subject,
            "user_id": user_id,
        }

    async def handle_subscription_created(
        self, event: Dict[str, Any], save_funcs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle subscription.created event.

        Args:
            event: Parsed event dict
            save_funcs: Dict with `save_subscription` callable

        Returns:
            Result dict with keys: success (bool), subscription_id (str), error (str optional)
        """
        subject = event["subject"]
        user_id = event["user_id"]

        if not user_id:
            logger.warning(
                f"subscription.created event {event['event_id']} missing user_id"
            )
            return {
                "success": False,
                "error": "Missing user_id in metadata",
            }

        try:
            # Extract subscription details
            subscription_data = {
                "user_id": user_id,
                "polar_subscription_id": subject.get("id"),
                "polar_customer_id": subject.get("customer_id"),
                "plan_id": subject.get("product_id"),
                "status": subject.get("status", "active"),
                "current_period_start": subject.get("current_period_start"),
                "current_period_end": subject.get("current_period_end"),
                "trial_start": subject.get("trial_starts_at"),
                "trial_end": subject.get("trial_ends_at"),
                "auto_renew": True,
                "payment_processor": "polar",
            }

            # Call shared subscription save function (provided by billing service)
            save_func = save_funcs.get("save_subscription")
            if save_func:
                result = await save_func(subscription_data)
                return {
                    "success": True,
                    "subscription_id": result.get("id"),
                }
            else:
                logger.error("No save_subscription function provided")
                return {
                    "success": False,
                    "error": "Handler not configured",
                }

        except Exception as exc:
            logger.error(
                f"Failed to handle subscription.created for user {user_id}: {exc}"
            )
            return {
                "success": False,
                "error": str(exc),
            }

    async def handle_subscription_updated(
        self, event: Dict[str, Any], save_funcs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle subscription.updated event (plan changes, cancellation, renewal)."""
        subject = event["subject"]
        user_id = event["user_id"]

        if not user_id:
            logger.warning(
                f"subscription.updated event {event['event_id']} missing user_id"
            )
            return {"success": False, "error": "Missing user_id"}

        try:
            # Determine if this is a cancellation or plan change
            status = subject.get("status")
            update_data = {
                "polar_subscription_id": subject.get("id"),
                "status": status,
                "current_period_start": subject.get("current_period_start"),
                "current_period_end": subject.get("current_period_end"),
                "updated_at": datetime.utcnow().isoformat(),
            }

            if status == "canceled":
                update_data["canceled_at"] = datetime.utcnow().isoformat()

            update_func = save_funcs.get("update_subscription")
            if update_func:
                result = await update_func(user_id, update_data)
                return {"success": True, "subscription_id": result.get("id")}
            else:
                return {"success": False, "error": "Handler not configured"}

        except Exception as exc:
            logger.error(
                f"Failed to handle subscription.updated for user {user_id}: {exc}"
            )
            return {"success": False, "error": str(exc)}

    async def handle_subscription_cancelled(
        self, event: Dict[str, Any], save_funcs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle subscription.cancelled event."""
        subject = event["subject"]
        user_id = event["user_id"]

        if not user_id:
            logger.warning(
                f"subscription.cancelled event {event['event_id']} missing user_id"
            )
            return {"success": False, "error": "Missing user_id"}

        try:
            cancel_data = {
                "polar_subscription_id": subject.get("id"),
                "status": "canceled",
                "canceled_at": datetime.utcnow().isoformat(),
            }

            cancel_func = save_funcs.get("cancel_subscription")
            if cancel_func:
                result = await cancel_func(user_id, cancel_data)
                return {"success": True, "subscription_id": result.get("id")}
            else:
                return {"success": False, "error": "Handler not configured"}

        except Exception as exc:
            logger.error(
                f"Failed to handle subscription.cancelled for user {user_id}: {exc}"
            )
            return {"success": False, "error": str(exc)}

    async def handle_invoice_paid(
        self, event: Dict[str, Any], save_funcs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle invoice.paid event (record payment)."""
        subject = event["subject"]
        user_id = event["user_id"]

        if not user_id:
            logger.warning(f"invoice.paid event {event['event_id']} missing user_id")
            return {"success": False, "error": "Missing user_id"}

        try:
            invoice_data = {
                "user_id": user_id,
                "polar_invoice_id": subject.get("id"),
                "polar_subscription_id": subject.get("subscription_id"),
                "amount": int(subject.get("amount", 0)),
                "currency": subject.get("currency", "USD").upper(),
                "paid": True,
                "paid_at": datetime.utcnow().isoformat(),
                "payment_processor": "polar",
            }

            save_invoice_func = save_funcs.get("save_invoice")
            if save_invoice_func:
                result = await save_invoice_func(invoice_data)
                return {"success": True, "invoice_id": result.get("id")}
            else:
                return {"success": False, "error": "Handler not configured"}

        except Exception as exc:
            logger.error(f"Failed to handle invoice.paid for user {user_id}: {exc}")
            return {"success": False, "error": str(exc)}

    async def process_event(
        self,
        event_json: Dict[str, Any],
        save_funcs: Dict[str, Any],
        deduplicate_func: Optional[callable] = None,
    ) -> Dict[str, Any]:
        """Main entry point: process a Polar webhook event.

        Args:
            event_json: Raw Polar webhook payload
            save_funcs: Dict with handler functions (save_subscription, update_subscription, etc.)
            deduplicate_func: Optional callable to check/record event deduplication (prevent double-processing)

        Returns:
            Result dict with keys: success (bool), processed_as (str), error (str optional)
        """
        try:
            event = self.parse_event(event_json)
            event_id = event["event_id"]

            # Check for deduplication if provided
            if deduplicate_func:
                if await deduplicate_func(event_id):
                    logger.info(f"Skipping duplicate event {event_id}")
                    return {
                        "success": True,
                        "processed_as": "dedup",
                        "event_id": event_id,
                    }

            event_type = event["event_type"]
            logger.info(f"Processing Polar event: {event_type} (ID: {event_id})")

            # Route to appropriate handler
            if event_type == "subscription.created":
                result = await self.handle_subscription_created(event, save_funcs)
            elif event_type == "subscription.updated":
                result = await self.handle_subscription_updated(event, save_funcs)
            elif event_type == "subscription.cancelled":
                result = await self.handle_subscription_cancelled(event, save_funcs)
            elif event_type == "invoice.paid":
                result = await self.handle_invoice_paid(event, save_funcs)
            else:
                logger.debug(f"Unhandled event type: {event_type}")
                result = {"success": True, "processed_as": "no_op"}

            result["event_id"] = event_id
            result["processed_as"] = event_type

            return result

        except Exception as exc:
            logger.error(f"Fatal error processing Polar webhook: {exc}", exc_info=True)
            return {
                "success": False,
                "error": str(exc),
                "processed_as": "error",
            }


# Singleton instance
_adapter: Optional[PolarWebhookAdapter] = None


def get_polar_webhook_adapter() -> PolarWebhookAdapter:
    """Get or create the Polar webhook adapter singleton."""
    global _adapter
    if _adapter is None:
        _adapter = PolarWebhookAdapter()
    return _adapter

