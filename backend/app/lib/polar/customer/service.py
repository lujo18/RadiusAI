"""Polar customer service helpers."""

from __future__ import annotations

from typing import Any

from polar_sdk import (
	CustomerSessionCustomerExternalIDCreate,
	CustomerSessionCustomerIDCreate,
)

from app.lib.polar.client import get_polar_client
from app.lib.polar.errors import PolarAPIError
from app.lib.polar.utils import get_external_customer_id_for_team


def create_customer_portal_session(
	team_id: str,
	return_url: str | None = None,
) -> dict[str, Any]:
	"""Create a Polar customer portal session for a team.

	Uses `customer_id` when the team is already linked to a Polar customer,
	otherwise falls back to `external_customer_id=team_id`.
	"""
	if not team_id:
		raise PolarAPIError("team_id is required")

	try:
		# Returns polar_customer_id when present, otherwise team_id.
		customer_ref = get_external_customer_id_for_team(team_id)

		with get_polar_client() as polar:
			if customer_ref and customer_ref != team_id:
				request = CustomerSessionCustomerIDCreate(
					customer_id=customer_ref,
					return_url=return_url,
				)
			else:
				request = CustomerSessionCustomerExternalIDCreate(
					external_customer_id=team_id,
					return_url=return_url,
				)

			session = polar.customer_sessions.create(request=request)

			portal_url = getattr(session, "customer_portal_url", None)
			if portal_url is None and hasattr(session, "get"):
				portal_url = session.get("customer_portal_url")

			if not portal_url:
				raise PolarAPIError("Polar customer portal session did not include a URL")

			return {
				"url": str(portal_url),
				"session_id": getattr(session, "id", None),
				"customer_id": getattr(session, "customer_id", None),
				"expires_at": getattr(session, "expires_at", None),
			}
	except PolarAPIError:
		raise
	except Exception as exc:
		raise PolarAPIError(str(exc)) from exc


__all__ = ["create_customer_portal_session"]
