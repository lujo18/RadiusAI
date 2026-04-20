"""Webhooks router for Polar webhook events."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request

from app.features.integrations.supabase.client import get_supabase
from app.features.usage.service import UsageMetricService
from app.lib.polar.webhooks.adapter import get_polar_webhook_adapter

logger = logging.getLogger(__name__)
router = APIRouter(tags=["billing"])

_USAGE_TIER_MAP = {
	"starter": "free",
	"growth": "pro",
	"unlimited": "agency",
	"free": "free",
	"pro": "pro",
	"agency": "agency",
}


def _normalize_plan_key(raw_plan: str | None) -> str | None:
	if not raw_plan:
		return None
	key = str(raw_plan).strip().lower()
	return key if key else None


def _infer_plan_from_product_id(product_id: str | None) -> str | None:
	if not product_id:
		return None

	lowered = str(product_id).lower()
	for candidate in ("starter", "growth", "unlimited", "free", "pro", "agency"):
		if candidate in lowered:
			return candidate

	return None


def _lookup_plan_for_product(product_id: str | None) -> str | None:
	if not product_id:
		return None

	try:
		supabase = get_supabase()
		res = (
			supabase.table("plans")
			.select("plan_id")
			.eq("polar_product_id", product_id)
			.limit(1)
			.execute()
		)
		rows = getattr(res, "data", None) or []
		if rows:
			return _normalize_plan_key(rows[0].get("plan_id"))
	except Exception:
		logger.debug("Plan lookup by polar_product_id failed", exc_info=True)

	return None


def _resolve_usage_tier(plan_key: str | None) -> str | None:
	normalized = _normalize_plan_key(plan_key)
	if not normalized:
		return None
	return _USAGE_TIER_MAP.get(normalized)


def _resolve_team_id(user_id: str | None, payload: dict[str, Any]) -> str | None:
	external_customer_id = payload.get("external_customer_id")
	if external_customer_id:
		return str(external_customer_id)

	supabase = get_supabase()

	polar_customer_id = payload.get("polar_customer_id")
	if polar_customer_id:
		try:
			team_by_customer = (
				supabase.table("teams")
				.select("id")
				.eq("polar_customer_id", str(polar_customer_id))
				.limit(1)
				.execute()
			)
			rows = getattr(team_by_customer, "data", None) or []
			if rows:
				return str(rows[0].get("id"))
		except Exception:
			logger.debug("Team lookup by polar_customer_id failed", exc_info=True)

	if user_id:
		try:
			team_by_owner = (
				supabase.table("teams")
				.select("id")
				.eq("owner_id", str(user_id))
				.limit(1)
				.execute()
			)
			rows = getattr(team_by_owner, "data", None) or []
			if rows:
				return str(rows[0].get("id"))
		except Exception:
			logger.debug("Team lookup by owner_id failed", exc_info=True)

	return None


def _upsert_team_billing_metadata(team_id: str, updates: dict[str, Any]) -> dict[str, Any]:
	supabase = get_supabase()

	team_res = supabase.table("teams").select("id,metadata").eq("id", team_id).limit(1).execute()
	rows = getattr(team_res, "data", None) or []
	if not rows:
		raise ValueError(f"Team not found: {team_id}")

	row = rows[0]
	metadata = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
	billing_meta = metadata.get("billing") if isinstance(metadata.get("billing"), dict) else {}

	for key, value in updates.items():
		if value is not None:
			billing_meta[key] = value

	billing_meta["updated_at"] = datetime.utcnow().isoformat()
	metadata["billing"] = billing_meta

	update_res = (
		supabase.table("teams")
		.update({"metadata": metadata})
		.eq("id", team_id)
		.execute()
	)

	update_rows = getattr(update_res, "data", None) or []
	return update_rows[0] if update_rows else {"id": team_id}


async def _apply_usage_tier_if_possible(user_id: str | None, plan_key: str | None) -> None:
	if not user_id:
		return

	usage_tier = _resolve_usage_tier(plan_key)
	if not usage_tier:
		return

	try:
		usage_service = UsageMetricService()
		await usage_service.set_plan_tier(str(user_id), usage_tier)
	except Exception:
		logger.debug("Failed to apply usage plan tier from webhook", exc_info=True)


async def _save_subscription(subscription_data: dict[str, Any]) -> dict[str, Any]:
	user_id = subscription_data.get("user_id")
	team_id = _resolve_team_id(user_id, subscription_data)

	product_id = subscription_data.get("plan_id") or subscription_data.get("polar_product_id")
	plan_key = _lookup_plan_for_product(product_id) or _infer_plan_from_product_id(product_id)

	await _apply_usage_tier_if_possible(user_id, plan_key)

	if team_id:
		_upsert_team_billing_metadata(
			team_id,
			{
				"polar_subscription_id": subscription_data.get("polar_subscription_id"),
				"polar_customer_id": subscription_data.get("polar_customer_id"),
				"polar_product_id": product_id,
				"polar_price_id": subscription_data.get("polar_price_id"),
				"plan_id": plan_key or product_id,
				"status": subscription_data.get("status"),
				"current_period_start": subscription_data.get("current_period_start"),
				"current_period_end": subscription_data.get("current_period_end"),
			},
		)

	return {"id": subscription_data.get("polar_subscription_id") or team_id}


async def _update_subscription(user_id: str, update_data: dict[str, Any]) -> dict[str, Any]:
	team_id = _resolve_team_id(user_id, update_data)

	product_id = update_data.get("polar_product_id") or update_data.get("plan_id")
	plan_key = _lookup_plan_for_product(product_id) or _infer_plan_from_product_id(product_id)

	await _apply_usage_tier_if_possible(user_id, plan_key)

	if team_id:
		_upsert_team_billing_metadata(
			team_id,
			{
				"polar_subscription_id": update_data.get("polar_subscription_id"),
				"polar_product_id": product_id,
				"polar_price_id": update_data.get("polar_price_id"),
				"plan_id": plan_key or product_id,
				"status": update_data.get("status"),
				"current_period_start": update_data.get("current_period_start"),
				"current_period_end": update_data.get("current_period_end"),
				"canceled_at": update_data.get("canceled_at"),
			},
		)

	return {"id": update_data.get("polar_subscription_id") or team_id}


async def _cancel_subscription(user_id: str, cancel_data: dict[str, Any]) -> dict[str, Any]:
	team_id = _resolve_team_id(user_id, cancel_data)
	if team_id:
		_upsert_team_billing_metadata(
			team_id,
			{
				"polar_subscription_id": cancel_data.get("polar_subscription_id"),
				"status": "canceled",
				"canceled_at": cancel_data.get("canceled_at"),
			},
		)
	return {"id": cancel_data.get("polar_subscription_id") or team_id}


async def _save_invoice(invoice_data: dict[str, Any]) -> dict[str, Any]:
	user_id = invoice_data.get("user_id")
	team_id = _resolve_team_id(user_id, invoice_data)
	if team_id:
		_upsert_team_billing_metadata(
			team_id,
			{
				"last_invoice_id": invoice_data.get("polar_invoice_id"),
				"last_invoice_paid_at": invoice_data.get("paid_at"),
			},
		)
	return {"id": invoice_data.get("polar_invoice_id")}


async def _handle_polar_webhook(
	request: Request,
	x_polar_signature: str | None,
) -> dict[str, Any]:
	if not x_polar_signature:
		raise HTTPException(status_code=401, detail="Missing Polar signature")

	raw_body = await request.body()
	adapter = get_polar_webhook_adapter()

	if not adapter.validate_signature(raw_body, x_polar_signature):
		raise HTTPException(status_code=401, detail="Invalid Polar signature")

	event_json = await request.json()
	result = await adapter.process_event(
		event_json,
		{
			"save_subscription": _save_subscription,
			"update_subscription": _update_subscription,
			"cancel_subscription": _cancel_subscription,
			"save_invoice": _save_invoice,
		},
	)

	if not result.get("success", True):
		raise HTTPException(
			status_code=500,
			detail=result.get("error", "Failed processing Polar webhook"),
		)

	return {
		"received": True,
		"processed_as": result.get("processed_as"),
		"event_id": result.get("event_id"),
	}


@router.post("/webhook/polar", summary="Polar webhook endpoint")
async def polar_webhook_compat(
	request: Request,
	x_polar_signature: str | None = Header(default=None, alias="x-polar-signature"),
) -> dict[str, Any]:
	"""Compatibility endpoint for existing Polar webhook integrations."""
	return await _handle_polar_webhook(request, x_polar_signature)


@router.post("/webhooks/polar", summary="Polar webhook endpoint")
async def polar_webhook(
	request: Request,
	x_polar_signature: str | None = Header(default=None, alias="x-polar-signature"),
) -> dict[str, Any]:
	"""Canonical endpoint for Polar webhook integrations."""
	return await _handle_polar_webhook(request, x_polar_signature)


__all__ = ["router"]
