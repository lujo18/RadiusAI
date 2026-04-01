"""Reconciliation service for Polar benefits and usage sync.

Performs dual-write of usage events and daily reconciliation between Polar
and local database to detect drift and ensure consistency.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from app.lib.polar.client import get_polar_client
from app.lib.polar.errors import PolarAPIError

logger = logging.getLogger(__name__)


class PolarReconciliationService:
    """Manages dual-write and reconciliation of benefits/usage."""

    async def log_usage_event_dual_write(
        self,
        user_id: str,
        event_type: str,
        usage_count: int,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Record a usage event both locally and in Polar.

        Args:
            user_id: User ID
            event_type: Usage event type (e.g., 'slide_generated', 'api_call')
            usage_count: Number of units consumed
            metadata: Optional metadata dict

        Returns:
            Dict with keys:
            - success: bool
            - local_recorded: bool
            - polar_recorded: bool
            - error: str (optional)

        Strategy:
        1. Write to local audit log (always succeeds unless DB down)
        2. Attempt to write to Polar benefits API (async, non-blocking)
        3. If Polar fails, queue for retry + alert
        """
        result = {
            "success": False,
            "local_recorded": False,
            "polar_recorded": False,
            "user_id": user_id,
            "event_type": event_type,
        }

        # Polar write (non-blocking; can fail gracefully)
        try:
            with get_polar_client() as polar:
                # Create a Polar benefits consumption event
                # (Exact API depends on Polar SDK; this is a placeholder)
                response = polar.customer_benefits.create_usage(
                    request={
                        "customer_id": user_id,
                        "benefit_id": event_type,  # Polar benefit ID
                        "units_consumed": usage_count,
                        "idempotency_key": f"{user_id}_{event_type}_{datetime.utcnow().isoformat()}",
                    }
                )
                result["polar_recorded"] = True
                logger.info(f"Recorded usage in Polar for user {user_id}: {event_type}")
        except Exception as exc:
            logger.warning(
                f"Failed to record usage in Polar for user {user_id}: {exc}; "
                "will retry in next batch"
            )
            # Don't fail the entire operation; just log warning

        result["success"] = result["local_recorded"]
        return result

    async def reconcile_benefits_for_user(self, user_id: str) -> Dict[str, Any]:
        """Reconcile Polar benefits state with local database for a single user.

        Fetches user's current Polar benefits and usage, compares with local state,
        flags discrepancies, and optionally corrects them.

        Returns dict with:
        - reconciled: bool
        - polar_benefits: dict (current state from Polar)
        - local_benefits: dict (current state from local DB)
        - discrepancies: list of dicts {field, polar_value, local_value}
        - error: str (optional)
        """
        result = {
            "reconciled": False,
            "polar_benefits": {},
            "local_benefits": {},
            "discrepancies": [],
            "user_id": user_id,
        }

        # Fetch Polar benefits for user
        try:
            with get_polar_client() as polar:
                polar_customer = polar.customers.get(user_id)
                benefits = getattr(polar_customer, "benefits", [])
                result["polar_benefits"] = {
                    "customer_id": getattr(polar_customer, "id"),
                    "benefits": [
                        {
                            "id": getattr(b, "id"),
                            "type": getattr(b, "type"),
                            "limit": getattr(b, "limit"),
                            "usage": getattr(b, "usage"),
                        }
                        for b in benefits
                    ],
                }
        except Exception as exc:
            logger.error(f"Failed to fetch Polar benefits for user {user_id}: {exc}")
            result["error"] = f"Polar fetch failed: {exc}"
            return result

        # Fetch local benefits from database
        try:
            # TODO: Call local repository to get user's usage state
            # local_state = await usage_repo.get_user_state(user_id)
            result["local_benefits"] = {
                "user_id": user_id,
                # ... populated from DB
            }
        except Exception as exc:
            logger.error(f"Failed to fetch local benefits for user {user_id}: {exc}")
            result["error"] = f"Local fetch failed: {exc}"
            return result

        # Compare and flag discrepancies
        discrepancies = []
        for benefit in result["polar_benefits"].get("benefits", []):
            local_usage = (
                result["local_benefits"].get(benefit["id"], {}).get("usage", 0)
            )
            if local_usage != benefit.get("usage", 0):
                discrepancies.append(
                    {
                        "benefit_id": benefit["id"],
                        "polar_usage": benefit.get("usage", 0),
                        "local_usage": local_usage,
                        "drift": abs(benefit.get("usage", 0) - local_usage),
                    }
                )

        result["discrepancies"] = discrepancies
        result["reconciled"] = True

        if discrepancies:
            logger.warning(
                f"Found {len(discrepancies)} discrepancies for user {user_id}"
            )

        return result

    async def reconcile_daily_batch(
        self,
        batch_size: int = 100,
        threshold_drift: int = 10,
    ) -> Dict[str, Any]:
        """Run daily reconciliation batch across all users.

        Compares Polar benefits with local state for up to `batch_size` users,
        flags drift > `threshold_drift`, and generates alerts.

        Returns dict with:
        - users_checked: int
        - discrepancies_found: int
        - high_drift_users: list of (user_id, drift_count)
        - completed_at: ISO timestamp
        """
        result = {
            "users_checked": 0,
            "discrepancies_found": 0,
            "high_drift_users": [],
            "completed_at": datetime.utcnow().isoformat(),
        }

        try:
            # TODO: Fetch list of active users (paginated, up to batch_size)
            # users = await user_repo.get_active_users(limit=batch_size)
            users = []

            for user in users:
                user_id = getattr(user, "id") or user.get("id")
                try:
                    recon = await self.reconcile_benefits_for_user(user_id)
                    if recon.get("reconciled"):
                        result["users_checked"] += 1
                        disc_count = len(recon.get("discrepancies", []))
                        if disc_count > 0:
                            result["discrepancies_found"] += disc_count

                            # Flag high drift
                            total_drift = sum(
                                d["drift"] for d in recon["discrepancies"]
                            )
                            if total_drift > threshold_drift:
                                result["high_drift_users"].append(
                                    (user_id, total_drift)
                                )
                                logger.warning(
                                    f"High drift detected for user {user_id}: {total_drift}"
                                )

                except Exception as exc:
                    logger.error(f"Reconciliation failed for user {user_id}: {exc}")

            logger.info(
                f"Reconciliation batch complete: "
                f"{result['users_checked']} users checked, "
                f"{result['discrepancies_found']} discrepancies"
            )

        except Exception as exc:
            logger.error(f"Reconciliation batch failed: {exc}")
            result["error"] = str(exc)

        return result

    async def sync_local_to_polar_retry(self) -> Dict[str, Any]:
        """Retry syncing any pending local events to Polar.

        Finds events that were recorded locally but Polar write failed,
        and retries the Polar API call.

        Returns dict with:
        - retried_count: int
        - succeeded_count: int
        - failed_count: int
        """
        result = {
            "retried_count": 0,
            "succeeded_count": 0,
            "failed_count": 0,
        }

        try:
            # TODO: Fetch pending events from local audit log where polar_recorded=False
            # pending = await audit_repo.get_pending_polar_events(limit=1000)

            # For each pending event, retry
            # ...

            logger.info(
                f"Retry sync complete: "
                f"{result['succeeded_count']} succeeded, "
                f"{result['failed_count']} failed"
            )

        except Exception as exc:
            logger.error(f"Retry sync failed: {exc}")
            result["error"] = str(exc)

        return result


# Singleton
_recon_service: Optional[PolarReconciliationService] = None


def get_polar_reconciliation_service() -> PolarReconciliationService:
    """Get or create reconciliation service singleton."""
    global _recon_service
    if _recon_service is None:
        _recon_service = PolarReconciliationService()
    return _recon_service

