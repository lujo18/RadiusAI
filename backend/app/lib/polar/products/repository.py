"""Polar products and pricing sync to local database.

Implements dual-source reads: fetch Polar products/prices from API,
cache in Supabase for fast fallback, and sync benefits data to our
billing_plans table.
"""

from typing import Optional, List, Dict, Any
import logging

from app.lib.polar.client import get_polar_client
from app.lib.polar.errors import PolarAPIError, PolarConfigurationError
from app.core.config import settings
from app.lib.polar.products.models import Products
from app.shared.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class PolarProductsRepository(BaseRepository[Products]):
    """Manages Polar products and pricing sync."""

    def __init__(self):
        super().__init__(Products)
        # For Polar product caching we use Supabase client via self.supabase
        
        
    async def get_all(self) -> Dict[str, Any]:
      """Fetch all Polar products that are stored in supabase"""
      supabase = self.supabase or get_polar_client()  # fallback to polar client if needed
      # if we have a Supabase client use it for cached products
      if self.supabase:
          res = self.supabase.table('polar_products').select('*').execute()
          if getattr(res, 'error', None):
              return {}
          return {
              'products': res.data or [],
              'count': len(res.data or []),
          }
      # otherwise return empty
      return {'products': [], 'count': 0}
      
      

    async def sync_products(self) -> Dict[str, Any]:
        """Fetch all Polar products and prices; cache results.

        Returns a dict with keys:
        - `products`: list of Polar product dicts
        - `prices`: list of Polar price dicts
        - `synced_at`: ISO timestamp
        - `count`: total products synced

        Raises:
            PolarConfigurationError: if POLAR_API_KEY not set
            PolarAPIError: if Polar API call fails
        """
        try:
            with get_polar_client() as polar:
                # Fetch all products and prices from Polar; paginate if needed
                products = []
                prices = []

                # Get products
                prod_response = polar.products.list()
                if hasattr(prod_response, "items"):
                    products = prod_response.items or []
                elif isinstance(prod_response, list):
                    products = prod_response

                # Get prices
                price_response = polar.prices.list()
                if hasattr(price_response, "items"):
                    prices = price_response.items or []
                elif isinstance(price_response, list):
                    prices = price_response

                result = {
                    "products": products,
                    "prices": prices,
                    "synced_at": None,
                    "count": len(products),
                }

                logger.info(
                    f"Synced {len(products)} Polar products and {len(prices)} prices"
                )

                return result

        except Exception as exc:
            logger.error(f"Failed to sync Polar products: {exc}")
            raise PolarAPIError(f"Product sync failed: {exc}") from exc

    async def get_plans_from_polar(self) -> List[Dict[str, Any]]:
        """Fetch Polar products filtered as billing plans.

        Returns list of dicts with keys: `polar_product_id`, `polar_price_id`,
        `name`, `description`, `amount`, `currency`, `billing_period`,
        `features` (from metadata), `limits` (from metadata).
        """
        try:
            sync_result = await self.sync_products()
            products = sync_result["products"]
            prices = sync_result["prices"]

            # Build a map of product_id -> prices
            prices_by_product = {}
            for price in prices:
                prod_id = getattr(price, "product_id", None)
                if prod_id:
                    if prod_id not in prices_by_product:
                        prices_by_product[prod_id] = []
                    prices_by_product[prod_id].append(price)

            # Map products to plans
            plans = []
            for product in products:
                product_id = getattr(product, "id", None)
                if not product_id:
                    continue

                # Get prices for this product
                product_prices = prices_by_product.get(product_id, [])
                if not product_prices:
                    logger.warning(f"Product {product_id} has no prices; skipping")
                    continue

                # Use the first price (or implement more sophisticated selection)
                price = product_prices[0]

                # Extract fields
                plan_dict = {
                    "polar_product_id": product_id,
                    "polar_price_id": getattr(price, "id", None),
                    "name": getattr(product, "name", "Unknown"),
                    "description": getattr(product, "description", ""),
                    "amount": getattr(price, "amount", 0),
                    "currency": getattr(price, "currency", "USD").upper(),
                    "billing_period": getattr(price, "billing_period", "monthly"),
                    "features": getattr(product, "metadata", {}).get("features", {}),
                    "limits": getattr(product, "metadata", {}).get("limits", {}),
                }
                plans.append(plan_dict)

            return plans

        except Exception as exc:
            logger.error(f"Failed to get plans from Polar: {exc}")
            raise PolarAPIError(f"Get plans failed: {exc}") from exc

    def map_polar_to_billing_plan(self, polar_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Polar product structure to our billing_plans schema.

        Input: Polar product dict with fields like:
        - polar_product_id, polar_price_id, name, amount, currency, features, limits

        Output: dict ready for upsert into billing_plans:
        - stripe_product_id (map to polar_product_id for backward compat)
        - stripe_price_id (map to polar_price_id)
        - tier (inferred from name: 'free', 'pro', 'agency')
        - price_amount (cents)
        - billing_period, features, limits, etc.
        """
        name = polar_plan.get("name", "").lower()

        # Infer tier from product name
        tier = "free"
        if "pro" in name:
            tier = "pro"
        elif "agency" in name or "enterprise" in name:
            tier = "agency"

        return {
            "stripe_product_id": polar_plan["polar_product_id"],  # Store for compat
            "stripe_price_id": polar_plan["polar_price_id"],  # Store for compat
            "tier": tier,
            "name": polar_plan["name"],
            "price_amount": int(polar_plan["amount"]),  # Ensure integer (cents)
            "currency": polar_plan["currency"],
            "billing_period": polar_plan["billing_period"],
            "features": polar_plan.get("features", {}),
            "limits": polar_plan.get("limits", {}),
            "is_active": True,
            "payment_processor": "polar",  # Tag for identification
        }

    async def is_configured(self) -> bool:
        """Check if Polar is properly configured (API key present)."""
        return bool(settings.POLAR_API_KEY)


# Singleton instance
_products_repo: Optional[PolarProductsRepository] = None


def get_polar_products_repository() -> PolarProductsRepository:
    """Get or create the Polar products repository singleton."""
    global _products_repo
    if _products_repo is None:
        _products_repo = PolarProductsRepository()
    return _products_repo

