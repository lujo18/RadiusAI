"""Main Polar billing router that organizes all /billing endpoints"""
from fastapi import APIRouter

# Import sub-routers
from backend.app.lib.polar.meter.router import router as meter_router
from backend.app.lib.polar.checkout.router import router as checkout_router
from backend.app.lib.polar.customer.router import (
	router as customer_router,
	portal_router,
)
from backend.app.lib.polar.products.router import router as products_router
from backend.app.lib.polar.subscription.router import router as subscription_router
from backend.app.lib.polar.invoices.router import router as invoices_router
from backend.app.lib.polar.webhooks.router import router as webhooks_router

# Create main router
router = APIRouter(prefix="/billing", tags=["billing"])

# Include sub-routers
router.include_router(meter_router)
router.include_router(checkout_router)
router.include_router(portal_router)
router.include_router(customer_router)
router.include_router(products_router)
router.include_router(subscription_router)
router.include_router(invoices_router)
router.include_router(webhooks_router)

__all__ = ["router"]
