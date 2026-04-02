from typing import Optional, Dict, Any

from app.lib.polar.client import get_polar_client
from app.lib.polar.errors import PolarAPIError


def create_checkout_link(
    external_customer_id: str,
    product_id: str,
    success_url: str,
    cancel_url: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
):
    """Create a Polar checkout link and return a normalized response.

    `external_customer_id` may be a `team_id` or a `user_id` depending on caller.
    Returns a mapping with keys: `id`, `url`, and `polar_response`.
    Accepts `cancel_url` and optional `metadata` which will be forwarded to Polar.
    """
    try:
        with get_polar_client() as polar:
            req = {
                "products": [product_id],
                "external_customer_id": external_customer_id,
                "allow_discount_codes": True,
                "require_billing_address": False,
                "success_url": success_url,
            }

            if cancel_url:
                req["cancel_url"] = cancel_url

            if metadata:
                # Polar accepts arbitrary metadata under `metadata` key in many SDKs
                req["metadata"] = metadata

            res = polar.checkout.create(request=req)

            return {
                "id": res.get("id"),
                "url": res.get("url"),
                "polar_response": res,
            }

    except Exception as exc:
        raise PolarAPIError(str(exc)) from exc


def link_user_to_polar() -> Optional[str]:
    return None