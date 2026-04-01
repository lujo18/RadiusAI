from typing import Optional

from app.lib.polar.client import get_polar_client
from app.lib.polar.errors import PolarAPIError

def create_checkout_link(
    user_id: str,
    product_id: str,
    success_url: str,
):
    """Create a Polar checkout link and return a normalized response.

    The returned object is a small mapping with keys commonly used by the billing
    service: `id`, `url`, and raw `polar_response` for further inspection.
    """
    try:
        with get_polar_client() as polar:
            req = {
                "products": [product_id],
                "external_customer_id": user_id,
                "allow_discount_codes": True,
                "require_billing_address": False,
                "success_url": success_url,
            }

            res = polar.checkout.create(request=req)

            # Normalize minimal useful fields
            return {
                "id": res.get("id"),
                "url": res.get("url"),
                "polar_response": res,
            }

    except Exception as exc:
        # Let caller decide how to handle logging/metrics; wrap generic errors
        raise PolarAPIError(str(exc)) from exc


def link_user_to_polar() -> Optional[str]:
    return None