"""
Usage Service - Business logic for quota tracking and rate limiting.

Manages:
- Usage metric tracking (slides, images, templates, posts, AI credits)
- Quota enforcement (check remaining, consume, enforce limits)
- Billing period management
- Plan tier quotas
"""

import logging
from importlib import import_module
from datetime import UTC, datetime, timedelta
from typing import Any, Callable, Optional

from app.core.config import settings
from app.core.database import get_db_session
from app.core.exceptions import QuotaExceededError, ValidationError
from app.features.usage.models import UsageMetric, UsageQuota
from app.features.usage.repository import UsageMetricRepository, UsageQuotaRepository
from app.features.usage.schemas import (
    ConsumeResponse,
    QuotaCheckResponse,
    UsageMetricResponse,
    UsageQuotaResponse,
    UsageSummaryResponse,
)


PLAN_TIER_QUOTAS = {
    "free": {
        "slides_limit": 50,
        "images_limit": 10,
        "templates_limit": 3,
        "posts_limit": 50,
        "ai_credits_limit": 100,
        "brands_limit": 1,
    },
    "pro": {
        "slides_limit": 500,
        "images_limit": 100,
        "templates_limit": 20,
        "posts_limit": 1000,
        "ai_credits_limit": 5000,
        "brands_limit": 5,
    },
    "agency": {
        "slides_limit": None,
        "images_limit": None,
        "templates_limit": None,
        "posts_limit": None,
        "ai_credits_limit": None,
        "brands_limit": None,
    },
}

METRIC_LIMIT_FIELD = {
    "slides_generated": "slides_limit",
    "images_generated": "images_limit",
    "templates_created": "templates_limit",
    "posts_generated": "posts_limit",
    "ai_credits_used": "ai_credits_limit",
    "brands_limit": "brands_limit",
}

logger = logging.getLogger(__name__)


class UsageMetricService:
    """Service for usage metric operations."""

    def __init__(
        self,
        metric_repository: Optional[UsageMetricRepository] = None,
        quota_repository: Optional[UsageQuotaRepository] = None,
    ):
        self.metric_repository = metric_repository or UsageMetricRepository()
        self.quota_repository = quota_repository or UsageQuotaRepository()

    async def _get_user_quota(self, db, user_id: str) -> UsageQuota:
        return await self.quota_repository.get_or_create(db, user_id)

    async def _get_brand_current_usage(self, db, brand_id: str, user_id: str) -> UsageMetric:
        current = await self.metric_repository.get_current_period(db, brand_id)
        if current:
            return current
        return await self.metric_repository.get_or_create_current(db, brand_id, user_id)

    async def _check_quota_with_db(
        self,
        db,
        user_id: str,
        brand_id: str,
        metric: str,
        amount: int = 1,
    ) -> QuotaCheckResponse:
        if metric not in METRIC_LIMIT_FIELD:
            raise ValidationError(f"Unknown metric: {metric}")

        quota = await self._get_user_quota(db, user_id)
        limit_field = METRIC_LIMIT_FIELD[metric]
        limit = getattr(quota, limit_field, None)

        if metric == "brands_limit":
            current_usage = 0
        else:
            usage = await self._get_brand_current_usage(db, brand_id, user_id)
            current_usage = getattr(usage, metric, 0)

        if limit is None:
            allowed = True
            remaining = None
            percentage_used = None
        else:
            remaining = limit - current_usage
            allowed = remaining >= amount
            percentage_used = min(100.0, (current_usage / limit * 100)) if limit > 0 else 0.0

        return QuotaCheckResponse(
            metric=metric,
            current_usage=current_usage,
            limit=limit,
            remaining=remaining,
            allowed=allowed,
            percentage_used=percentage_used,
        )

    async def get_user_quota(self, user_id: str) -> UsageQuota:
        """Get or create user's quota configuration."""
        async with get_db_session() as db:
            return await self._get_user_quota(db, user_id)

    async def get_brand_current_usage(self, brand_id: str, user_id: str) -> UsageMetric:
        """Get current billing period usage for a brand."""
        async with get_db_session() as db:
            return await self._get_brand_current_usage(db, brand_id, user_id)

    async def check_quota(
        self,
        user_id: str,
        brand_id: str,
        metric: str,
        amount: int = 1,
    ) -> QuotaCheckResponse:
        """Check if user can consume amount units of metric."""
        async with get_db_session() as db:
            return await self._check_quota_with_db(db, user_id, brand_id, metric, amount)

    async def consume_quota(
        self,
        user_id: str,
        brand_id: str,
        metric: str,
        amount: int = 1,
    ) -> ConsumeResponse:
        """Attempt to consume quota. Raises QuotaExceededError if limit exceeded."""
        async with get_db_session() as db:
            check = await self._check_quota_with_db(db, user_id, brand_id, metric, amount)
            if not check.allowed:
                raise QuotaExceededError(
                    f"Cannot consume {amount} {metric}. "
                    f"Limit: {check.limit}, Remaining: {check.remaining}"
                )

            if metric != "brands_limit":
                await self.metric_repository.increment_metric(db, brand_id, user_id, metric, amount)

            new_check = await self._check_quota_with_db(db, user_id, brand_id, metric, 0)
            return ConsumeResponse(
                allowed=True,
                consumed=amount,
                new_total=new_check.current_usage,
                quota_check=new_check,
            )

    async def track_usage(
        self,
        user_id: str,
        brand_id: str,
        metric: str,
        amount: int = 1,
    ) -> UsageMetric:
        """Track usage without enforcing quota (for analytics)."""
        if metric == "brands_limit":
            raise ValidationError("brands_limit cannot be tracked as usage")
        async with get_db_session() as db:
            return await self.metric_repository.increment_metric(
                db, brand_id, user_id, metric, amount
            )

    async def get_usage_summary(
        self,
        user_id: str,
        brand_id: str,
    ) -> UsageSummaryResponse:
        """Get comprehensive usage and quota summary."""
        async with get_db_session() as db:
            metrics = await self._get_brand_current_usage(db, brand_id, user_id)
            quota = await self._get_user_quota(db, user_id)

            checks = []
            for metric_name in [
                "slides_generated",
                "images_generated",
                "templates_created",
                "posts_generated",
                "ai_credits_used",
            ]:
                checks.append(
                    await self._check_quota_with_db(db, user_id, brand_id, metric_name, 0)
                )

            period_active = metrics.period_start is not None and metrics.period_end is not None
            return UsageSummaryResponse(
                brand_id=brand_id,
                metrics=UsageMetricResponse.model_validate(metrics),
                quotas=UsageQuotaResponse.model_validate(quota),
                checks=checks,
                period_active=period_active,
                period_start=metrics.period_start,
                period_end=metrics.period_end,
            )

    async def set_plan_tier(self, user_id: str, plan_tier: str) -> UsageQuota:
        """Update user's plan tier and associated quotas."""
        if plan_tier not in PLAN_TIER_QUOTAS:
            raise ValidationError(f"Invalid plan tier: {plan_tier}")

        async with get_db_session() as db:
            quota = await self.quota_repository.get_or_create(db, user_id, plan_tier)
            quota.plan_tier = plan_tier
            for key, value in PLAN_TIER_QUOTAS[plan_tier].items():
                setattr(quota, key, value)
            return await self.quota_repository.update(db, quota)

    async def sync_period_from_stripe(self, user_id: str) -> Optional[UsageMetric]:
        """Sync billing period from subscription data (placeholder month-based window)."""
        async with get_db_session() as db:
            await self._get_user_quota(db, user_id)

            now = datetime.now(UTC)
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)

            metrics = await self.metric_repository.get_by_user(db, user_id)
            for metric in metrics:
                metric.period_start = month_start
                metric.period_end = month_end
                await self.metric_repository.update(db, metric)

            return metrics[0] if metrics else None



def get_usage_service() -> UsageMetricService:
    """Create request-scoped usage service."""
    return UsageMetricService()


# Legacy compatibility stubs

def _get_user_product_id(user_id: str):
    return None



def _get_team_usage(team_id: str):
    return {}



def _get_metric_limit(product_id, metric_name):
    return None



def _get_metric_usage(team_id, metric):
    return 0


_track_slides_generated = None
_check_generation_credits = None
_USAGE_HANDLER_SOURCE = "unresolved"
_USAGE_HANDLER_ERRORS: list[str] = []

HandlerFn = Callable[..., Any]


def _usage_handler_candidates() -> tuple[str, ...]:
    if settings.USE_POLAR:
        return (
            "app.lib.polar.adapter",
            "backend.app.lib.polar.adapter",
            "backend.services.usage.service",
            "services.usage.service",
        )
    return (
        "backend.services.usage.service",
        "services.usage.service",
        "app.lib.polar.adapter",
        "backend.app.lib.polar.adapter",
    )


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _build_fail_open_credit_check(slides_to_generate: int, reason: str) -> dict[str, Any]:
    credits_to_consume = max(0, _safe_int(slides_to_generate))
    message = "Credit check temporarily unavailable; allowing generation."
    if reason:
        message = f"{message} ({reason})"

    return {
        "allowed": True,
        "current_credits": 0,
        "credits_to_consume": credits_to_consume,
        "projected_credits": credits_to_consume,
        "credit_limit": None,
        "will_exceed": False,
        "message": message,
    }


def _normalize_credit_check(payload: dict[str, Any], slides_to_generate: int) -> dict[str, Any]:
    fallback = _build_fail_open_credit_check(
        slides_to_generate, "malformed credit check response"
    )

    current_credits = _safe_int(payload.get("current_credits"), 0)
    credits_to_consume = max(
        0,
        _safe_int(
            payload.get("credits_to_consume"), _safe_int(fallback["credits_to_consume"])
        ),
    )
    projected_credits = _safe_int(
        payload.get("projected_credits"), current_credits + credits_to_consume
    )

    credit_limit_raw = payload.get("credit_limit")
    credit_limit = None if credit_limit_raw is None else _safe_int(credit_limit_raw)

    message = payload.get("message")

    return {
        "allowed": bool(payload.get("allowed", True)),
        "current_credits": current_credits,
        "credits_to_consume": credits_to_consume,
        "projected_credits": projected_credits,
        "credit_limit": credit_limit,
        "will_exceed": bool(payload.get("will_exceed", False)),
        "message": str(message) if message is not None else fallback["message"],
    }


def _ensure_usage_handlers() -> None:
    global _check_generation_credits
    global _track_slides_generated
    global _USAGE_HANDLER_SOURCE
    global _USAGE_HANDLER_ERRORS

    if _check_generation_credits is not None and _track_slides_generated is not None:
        return

    _USAGE_HANDLER_ERRORS = []
    _USAGE_HANDLER_SOURCE = "unavailable"

    for module_path in _usage_handler_candidates():
        try:
            module = import_module(module_path)
        except Exception as exc:
            _USAGE_HANDLER_ERRORS.append(f"{module_path}: {exc}")
            continue

        maybe_check: Optional[HandlerFn] = getattr(
            module, "check_generation_credits", None
        )
        maybe_track: Optional[HandlerFn] = getattr(module, "track_slides_generated", None)

        if callable(maybe_check):
            _check_generation_credits = maybe_check
        else:
            _USAGE_HANDLER_ERRORS.append(
                f"{module_path}: missing check_generation_credits"
            )

        if callable(maybe_track):
            _track_slides_generated = maybe_track
        else:
            _USAGE_HANDLER_ERRORS.append(f"{module_path}: missing track_slides_generated")

        if _check_generation_credits is not None and _track_slides_generated is not None:
            _USAGE_HANDLER_SOURCE = module_path
            return


def _handler_errors_summary() -> str:
    if not _USAGE_HANDLER_ERRORS:
        return "none"
    return " | ".join(_USAGE_HANDLER_ERRORS)



def track_slides_generated(user_id: str, count: int = 1):
    _ensure_usage_handlers()

    if _track_slides_generated is None:
        logger.warning(
            "track_slides_generated unavailable; skipping usage tracking. errors=%s",
            _handler_errors_summary(),
        )
        return None

    try:
        return _track_slides_generated(user_id, count)
    except Exception as exc:
        logger.warning(
            "track_slides_generated failed; skipping usage tracking. source=%s error=%s",
            _USAGE_HANDLER_SOURCE,
            exc,
            exc_info=True,
        )
        return None



def check_generation_credits(user_id: str, slides_to_generate: int):
    _ensure_usage_handlers()

    if _check_generation_credits is None:
        logger.warning(
            "check_generation_credits unavailable; fail-open activated. errors=%s",
            _handler_errors_summary(),
        )
        return _build_fail_open_credit_check(
            slides_to_generate, "credit checker unavailable"
        )

    try:
        payload = _check_generation_credits(user_id, slides_to_generate)
    except Exception as exc:
        logger.warning(
            "check_generation_credits handler failed; fail-open activated. source=%s error=%s",
            _USAGE_HANDLER_SOURCE,
            exc,
            exc_info=True,
        )
        return _build_fail_open_credit_check(
            slides_to_generate, "credit checker raised"
        )

    if not isinstance(payload, dict):
        logger.warning(
            "check_generation_credits returned non-dict (%s); fail-open activated.",
            type(payload).__name__,
        )
        return _build_fail_open_credit_check(
            slides_to_generate, "invalid checker response"
        )

    return _normalize_credit_check(payload, slides_to_generate)


__all__ = ["UsageMetricService", "get_usage_service", "track_slides_generated", "check_generation_credits"]
