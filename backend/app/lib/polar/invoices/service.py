from __future__ import annotations

from datetime import datetime
from typing import Any

from app.lib.polar.invoices.model import BillingInvoice, BillingInvoicesResponse
from app.lib.polar.invoices.repository import get_polar_invoices_repository
from app.lib.polar.utils import get_external_customer_id_for_team


def list_invoices_for_team(team_id: str, limit: int = 10, offset: int = 0) -> BillingInvoicesResponse:
    """Return team invoices from Polar in a frontend-compatible shape."""
    customer_id = get_external_customer_id_for_team(team_id)

    repo = get_polar_invoices_repository()
    order_page = repo.list_orders_for_team(
        team_id=team_id,
        customer_id=customer_id,
        limit=limit,
        offset=offset,
    )

    invoices = [_map_order_to_invoice(order) for order in order_page.items]

    return BillingInvoicesResponse(
        invoices=invoices,
        total=order_page.total_count,
        limit=limit,
        offset=offset,
    )


def _map_order_to_invoice(order: Any) -> BillingInvoice:
    created_ts = _to_unix_seconds(_get_value(order, "created_at"), fallback=0)
    status = _normalize_status(_get_value(order, "status"), paid=bool(_get_value(order, "paid", False)))

    subscription = _get_value(order, "subscription")
    period_start = _to_unix_seconds(_get_value(subscription, "current_period_start"), fallback=created_ts)
    period_end = _to_unix_seconds(_get_value(subscription, "current_period_end"), fallback=created_ts)

    paid_at = created_ts if _get_value(order, "paid", False) else 0

    metadata = _get_value(order, "metadata", {})
    pdf_url = _extract_pdf_url(metadata)

    return BillingInvoice(
        id=str(_get_value(order, "id", "")),
        amount=int(_get_value(order, "total_amount", 0) or 0),
        currency=str(_get_value(order, "currency", "USD") or "USD").upper(),
        status=status,
        created=created_ts,
        paid_at=paid_at,
        invoice_date=created_ts,
        period_start=period_start,
        period_end=period_end,
        pdf_url=pdf_url,
    )


def _get_value(obj: Any, key: str, default: Any = None) -> Any:
    if obj is None:
        return default

    if isinstance(obj, dict):
        return obj.get(key, default)

    return getattr(obj, key, default)


def _to_unix_seconds(value: Any, fallback: int) -> int:
    if value is None:
        return fallback

    if isinstance(value, datetime):
        return int(value.timestamp())

    if isinstance(value, (int, float)):
        return int(value)

    if isinstance(value, str):
        try:
            if value.isdigit():
                return int(value)
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return int(parsed.timestamp())
        except ValueError:
            return fallback

    return fallback


def _normalize_status(status: Any, paid: bool) -> str:
    if status is None:
        return "paid" if paid else "pending"

    if hasattr(status, "value"):
        return str(status.value)

    return str(status)


def _extract_pdf_url(metadata: Any) -> str | None:
    if not isinstance(metadata, dict):
        return None

    for key in ("invoice_pdf_url", "invoice_url", "pdf_url"):
        raw = metadata.get(key)
        if raw:
            return str(raw)

    return None
