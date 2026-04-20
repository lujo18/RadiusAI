from ..client import get_stripe_supabase
from typing import List, Optional

# DEPRECATED - DELETE
# DEPRECATED - Stripe plans repository. Use Polar-backed products repository.
try:
    import stripe  # type: ignore
except Exception:
    stripe = None  # type: ignore


class PlansRepository:
    @staticmethod
    def get_plans() -> List[dict]:
        """Prefer listing live Stripe products/prices when possible.

        Returns a list of plan-like dicts with keys matching the previous
        supabase 'plans' row shape used by admin UI (plan_id, name, max_* fields).
        """
        try:
            products = stripe.Product.list(limit=100)
            prices = stripe.Price.list(limit=200)

            # Map prices by product id
            price_map = {}
            for p in prices.data:
                prod = getattr(p, "product", None)
                price_map.setdefault(prod, []).append(p)

            out = []
            for prod in products.data:
                pid = getattr(prod, "id", None)
                name = getattr(prod, "name", None)
                metadata = getattr(prod, "metadata", None) or {}

                # Compose a plan-like object: keep max_* unset (null) by default
                item = {
                    "plan_id": pid,
                    "name": name,
                    "metadata": metadata,
                    "max_brands": None,
                    "max_posts_per_month": None,
                    "max_slides_per_month": None,
                    "prices": [
                        {
                            "id": getattr(pr, "id", None),
                            "unit_amount": getattr(pr, "unit_amount", None),
                            "currency": getattr(pr, "currency", None),
                            "recurring": getattr(pr, "recurring", None),
                        }
                        for pr in price_map.get(pid, [])
                    ],
                }
                out.append(item)

            return out
        except Exception:
            # Fallback to reading cached plans from Supabase if Stripe API fails
            supabase = get_stripe_supabase()
            response = supabase.table("plans").select("*").order("plan_id").execute()
            return response.data if response.data else []

    @staticmethod
    def get_plan(plan_id: str) -> Optional[dict]:
        """Fetch a single product from Stripe and return a plan-like dict.

        Falls back to the Supabase cached `plans` row when Stripe is unavailable.
        """
        try:
            prod = stripe.Product.retrieve(plan_id)
            prices = stripe.Price.list(product=plan_id, limit=50)
            item = {
                "plan_id": getattr(prod, "id", None),
                "name": getattr(prod, "name", None),
                "metadata": getattr(prod, "metadata", None) or {},
                "max_brands": None,
                "max_posts_per_month": None,
                "max_slides_per_month": None,
                "prices": [
                    {
                        "id": getattr(pr, "id", None),
                        "unit_amount": getattr(pr, "unit_amount", None),
                        "currency": getattr(pr, "currency", None),
                        "recurring": getattr(pr, "recurring", None),
                    }
                    for pr in prices.data
                ],
            }
            return item
        except Exception:
            supabase = get_stripe_supabase()
            response = (
                supabase.table("plans").select("*").eq("plan_id", plan_id).execute()
            )
            return response.data[0] if response.data else None

    @staticmethod
    def create_plan(plan_data: dict) -> dict:
        """Create a new plan in the cached Supabase table (admin-only operation)."""
        supabase = get_stripe_supabase()
        response = supabase.table("plans").insert(plan_data).execute()
        if not response.data:
            raise ValueError("Failed to create plan")
        return response.data[0]

    @staticmethod
    def update_plan(plan_id: str, updates: dict) -> dict:
        """Update the cached Supabase plan row."""
        supabase = get_stripe_supabase()
        response = (
            supabase.table("plans").update(updates).eq("plan_id", plan_id).execute()
        )
        if not response.data:
            raise ValueError("Plan not found")
        return response.data[0]

    @staticmethod
    def delete_plan(plan_id: str) -> bool:
        """Delete the cached Supabase plan row."""
        supabase = get_stripe_supabase()
        supabase.table("plans").delete().eq("plan_id", plan_id).execute()
        return True
