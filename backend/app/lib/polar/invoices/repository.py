from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Any

from app.lib.polar.client import get_polar_client

logger = logging.getLogger(__name__)


@dataclass
class PolarOrderPage:
    items: list[Any]
    total_count: int


class PolarInvoicesRepository:
    """Read invoices (orders) from Polar for a team/customer context."""

    def list_orders_for_team(
        self,
        *,
        team_id: str,
        customer_id: str | None,
        limit: int,
        offset: int,
    ) -> PolarOrderPage:
        """Fetch order history with customer_id first, then external_customer_id fallback."""
        if customer_id and customer_id != team_id:
            try:
                customer_page = self._list_orders(
                    customer_id=customer_id,
                    external_customer_id=None,
                    limit=limit,
                    offset=offset,
                )
                if customer_page.items:
                    return customer_page
            except Exception as exc:
                logger.warning("Polar orders lookup by customer_id failed: %s", exc)

        return self._list_orders(
            customer_id=None,
            external_customer_id=team_id,
            limit=limit,
            offset=offset,
        )

    def _list_orders(
        self,
        *,
        customer_id: str | None,
        external_customer_id: str | None,
        limit: int,
        offset: int,
    ) -> PolarOrderPage:
        page = max(1, (offset // max(limit, 1)) + 1)

        kwargs: dict[str, Any] = {
            "limit": limit,
            "page": page,
        }
        if customer_id:
            kwargs["customer_id"] = customer_id
        if external_customer_id:
            kwargs["external_customer_id"] = external_customer_id

        response = get_polar_client().orders.list(**kwargs)
        items = self._extract_items(response)
        total_count = self._extract_total_count(response, default=offset + len(items))

        return PolarOrderPage(items=items, total_count=total_count)

    @staticmethod
    def _extract_items(response: Any) -> list[Any]:
        result = getattr(response, "result", None)
        if result is not None and hasattr(result, "items"):
            items = getattr(result, "items", [])
            return list(items or [])

        if isinstance(response, dict):
            result_dict = response.get("result") or {}
            items = result_dict.get("items") if isinstance(result_dict, dict) else None
            return list(items or [])

        return []

    @staticmethod
    def _extract_total_count(response: Any, default: int) -> int:
        result = getattr(response, "result", None)
        pagination = getattr(result, "pagination", None) if result is not None else None
        total_count = getattr(pagination, "total_count", None) if pagination is not None else None
        if isinstance(total_count, int):
            return total_count

        if isinstance(response, dict):
            result_dict = response.get("result") or {}
            if isinstance(result_dict, dict):
                pagination_dict = result_dict.get("pagination") or {}
                if isinstance(pagination_dict, dict):
                    raw_total = pagination_dict.get("total_count")
                    if isinstance(raw_total, int):
                        return raw_total

        return default


_invoices_repo: PolarInvoicesRepository | None = None


def get_polar_invoices_repository() -> PolarInvoicesRepository:
    global _invoices_repo
    if _invoices_repo is None:
        _invoices_repo = PolarInvoicesRepository()
    return _invoices_repo
