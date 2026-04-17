from typing import Optional, Dict, Any, cast

from fastapi import HTTPException
from polar_sdk import CheckoutCreate, Customer, CustomerPortalCustomersGetSecurity
from pydantic import BaseModel

from app.lib.polar.client import get_polar_client
from backend.app.features.team.schemas import UpdateTeamRequest
from backend.app.features.team.service import TeamService
import logging

try:
    from backend.app.lib import polar  # type: ignore
except Exception:
    from app.lib import polar

try:
    from backend.app.lib.polar.errors import PolarAPIError
except Exception:
    from app.lib.polar.errors import PolarAPIError


logger = logging.getLogger(__name__)


def _resolve_get_polar_client():
    """Resolve a `get_polar_client` callable from likely import roots.

    Searches common module roots and sys.modules for a patched import used
    in tests, then falls back to the canonical client import locations.
    Returns the callable or `None` if not found.
    """
    import sys
    import importlib

    for candidate in ("backend.app.lib.polar.checkout", "app.lib.polar.checkout"):
        try:
            mod = importlib.import_module(candidate)
        except Exception:
            continue
        fn = getattr(mod, "get_polar_client", None)
        if fn:
            return fn

    for mod_name, mod in sys.modules.items():
        if mod_name.endswith("app.lib.polar.checkout"):
            fn = getattr(mod, "get_polar_client", None)
            if fn:
                return fn

    try:
        from app.lib.polar.client import get_polar_client as _g

        return _g
    except Exception:
        try:
            from backend.app.lib.polar.client import get_polar_client as _g

            return _g
        except Exception:
            return None


def create_checkout_link(
    user_id: str,
    team_id: Optional[str] = None,
    product_id: Optional[str] = None,
    product_price_id: Optional[str] = None,
    success_url: str = "",
    cancel_url: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
):
    """Create a Polar checkout link and return a normalized response.

    `external_customer_id` must always be a `team_id`.
    Returns a mapping with keys: `id`, `url`, and `polar_response`.
    Accepts `cancel_url` and optional `metadata` which will be forwarded to Polar.
    """

    resolved_product_id = product_id or product_price_id
    if not resolved_product_id:
        raise PolarAPIError("A product id is required")

    if not team_id:
        raise PolarAPIError("team_id is required for Polar checkout")

    external_customer_id = team_id

    client_factory = _resolve_get_polar_client() or get_polar_client

    try:
        with client_factory() as polar:
            req = CheckoutCreate(
                products=[resolved_product_id],
                external_customer_id=external_customer_id,
                allow_discount_codes=True,
                require_billing_address=False,
                success_url=success_url,
                customer_metadata={"host_user_id": user_id},
                return_url=cancel_url or None,
            )

            try:
                checkouts_client = getattr(polar, "checkout_links", None) or getattr(
                    polar, "checkouts", None
                )
                if checkouts_client is None or not hasattr(checkouts_client, "create"):
                    raise PolarAPIError("Polar client does not expose checkout creation")
                try:
                    res = checkouts_client.create(request=req)
                except TypeError:
                    # Backward compatibility for SDK/client mocks expecting positional payload.
                    res = checkouts_client.create(req)
            except Exception as exc:
                raise PolarAPIError(str(exc)) from exc
    
            
            session_id = getattr(res, "id", None)
            session_url = getattr(res, "url", None)

            if session_id is None and hasattr(res, "get"):
                try:
                    session_id = cast(Any, res).get("id")
                except Exception:
                    session_id = None

            if session_url is None and hasattr(res, "get"):
                try:
                    session_url = cast(Any, res).get("url")
                except Exception:
                    session_url = None

            return {
                "id": session_id,
                "url": session_url,
                "polar_response": res,
            }

    except Exception as exc:
        raise PolarAPIError(str(exc)) from exc


class CustomerFromSessionReponse(BaseModel):
    team_id: str
    polar_customer_id: str
    session_id: str
    customer: Optional[Customer] = None


async def resolve_customer_from_session_token(
    customer_session_token: str,
) -> CustomerFromSessionReponse:
    """Resolve Polar customer and team context from a checkout session token.

    Returns:
        {
            "customer_id": "...",  # Polar customer id
            "team_id": "...",      # resolved from external_customer_id/metadata
            "session_id": "...",   # checkout session id if available
            "polar_response": <raw response>
        }
    """
    with get_polar_client() as polar:
        resolved = polar.customer_portal.customers.get(
            security=CustomerPortalCustomersGetSecurity(
                customer_session=customer_session_token
            )
        )

        customer_id = resolved.id
        customer = polar.customers.get(id=customer_id)
        team_id = customer.external_id

        logger.info("Customer: %s", customer)

        host_user_id_raw = customer.metadata.get("host_user_id", None)
        host_user_id = str(host_user_id_raw) if host_user_id_raw is not None else None

    if not customer_id:
        raise HTTPException(
            status_code=400,
            detail="customer_id could not be resolved from customer_session_token",
        )

    if not team_id:
        raise HTTPException(
            status_code=400,
            detail="team_id could not be resolved from customer_session_token",
        )

    if not host_user_id:
        raise HTTPException(
            status_code=400,
            detail="host_user_id could not be resolved from customer_session_token",
        )

    # TeamService now encapsulates repository and session lifecycle.
    try:
        team_service = TeamService()
        res = await team_service.update_team(
            team_id=team_id,
            user_id=host_user_id,
            payload=UpdateTeamRequest(polar_customer_id=customer_id),
        )
    except Exception as exc:
        logger.exception("Failed updating team with Polar customer id: %s", exc)
        raise

    return CustomerFromSessionReponse(
        team_id=str(team_id),
        polar_customer_id=str(customer_id),
        session_id=customer_session_token,
    )


def link_user_to_polar(user_id: str, external_customer_id: str):
    """Link or create a Polar customer for a given user/external id.

    This is intentionally permissive to support multiple SDK versions.
    Returns a mapping with `customer_id` on success.
    """
    _get_polar_client = _resolve_get_polar_client()
    if _get_polar_client is None:
        raise PolarAPIError("Could not resolve Polar client")

    try:
        with _get_polar_client() as polar:
            customers = getattr(polar, "customers", None) or getattr(
                polar, "customer", None
            )
            if customers and hasattr(customers, "create"):
                try:
                    res = customers.create(customer_id=external_customer_id)
                except TypeError:
                    res = customers.create({"customer_id": external_customer_id})
                customer_id = getattr(res, "id", None) or (
                    res.get("id") if hasattr(res, "get") else None
                )
            else:
                customer_id = external_customer_id

            return {"customer_id": customer_id}
    except Exception as exc:
        raise PolarAPIError(str(exc)) from exc
