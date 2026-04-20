"""Polar products and pricing sync to local database.

Implements dual-source reads: fetch Polar products/prices from API,
cache in Supabase for fast fallback, and sync benefits data to our
billing_plans table.
"""

from datetime import datetime, UTC
from typing import Optional, List, Dict, Any
import logging

from polar_sdk import Product


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
        # Backwards-compatible attribute used in tests for patching
        self.client = None


    async def sync_products(self) -> List[Product]:
        """Fetch all Polar products only

        Returns a dict with keys:
        - `products`: list of Polar product dicts

        Raises:
            PolarConfigurationError: if POLAR_API_KEY not set
            PolarAPIError: if Polar API call fails
        """
        try:            
            polar = get_polar_client()
            logger.info(polar)
            res = polar.products.list(is_archived=False)

            if not res:
                raise ValueError("Did not get products from polar")

            products = res.result.items

            return products

        except Exception as exc:
            logger.error(f"Failed to sync Polar products: {exc}")
            raise PolarAPIError(f"Product sync failed: {exc}") from exc


# Singleton instance
_products_repo: Optional[PolarProductsRepository] = None

def get_polar_products_repository() -> PolarProductsRepository:
    """Get or create the Polar products repository singleton."""
    global _products_repo
    if _products_repo is None:
        _products_repo = PolarProductsRepository()
    return _products_repo

