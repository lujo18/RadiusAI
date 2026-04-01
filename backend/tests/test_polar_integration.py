"""Unit tests for Polar integration helpers."""

import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch, call
from datetime import datetime

# Test imports
from backend.app.lib.polar.client import get_polar_client
from backend.app.lib.polar.errors import PolarConfigurationError, PolarAPIError
from backend.app.lib.polar.checkout.checkout import create_checkout_link
from backend.app.lib.polar.products.repository import (
    PolarProductsRepository,
    get_polar_products_repository,
)
from backend.app.lib.polar.webhooks.adapter import (
    PolarWebhookAdapter,
    get_polar_webhook_adapter,
)
from backend.app.lib.polar.reconciliation import (
    PolarReconciliationService,
    get_polar_reconciliation_service,
)
from backend.app.lib.polar.billing_service import (
    PolarBillingService,
    get_polar_billing_service,
)


class TestPolarClient:
    """Test Polar client initialization and error handling."""

    def test_get_polar_client_raises_when_no_api_key(self):
        """Should raise PolarConfigurationError if POLAR_API_KEY not set."""
        with patch("backend.app.lib.polar.client.settings") as mock_settings:
            mock_settings.POLAR_API_KEY = None
            with pytest.raises(PolarConfigurationError):
                get_polar_client()

    def test_get_polar_client_succeeds_with_api_key(self):
        """Should return Polar client when API key is set."""
        with patch("backend.app.lib.polar.client.settings") as mock_settings:
            mock_settings.POLAR_API_KEY = "test_key_123"
            with patch("backend.app.lib.polar.client.Polar") as mock_polar:
                client = get_polar_client()
                mock_polar.assert_called_once_with(access_token="test_key_123")


class TestCheckoutHelper:
    """Test checkout link creation."""

    def test_create_checkout_link_success(self):
        """Should create checkout link and normalize response."""
        with patch("backend.app.lib.polar.checkout.get_polar_client") as mock_client:
            mock_client_instance = MagicMock()
            mock_client.return_value.__enter__.return_value = mock_client_instance

            # Mock Polar response
            mock_response = MagicMock()
            mock_response.id = "checkout_123"
            mock_response.url = "https://checkout.polar.sh/abc"
            mock_client_instance.checkout_links.create.return_value = mock_response

            result = create_checkout_link(
                user_id="user_123",
                product_price_id="price_456",
                success_url="https://app.local/success",
                cancel_url="https://app.local/cancel",
            )

            assert result["id"] == "checkout_123"
            assert result["url"] == "https://checkout.polar.sh/abc"
            assert result["polar_response"] is not None

    def test_create_checkout_link_handles_api_error(self):
        """Should wrap API errors as PolarAPIError."""
        with patch("backend.app.lib.polar.checkout.get_polar_client") as mock_client:
            mock_client.return_value.__enter__.side_effect = Exception("API Error")

            with pytest.raises(PolarAPIError):
                create_checkout_link(
                    user_id="user_123",
                    product_price_id="price_456",
                    success_url="https://app.local/success",
                )


class TestProductsRepository:
    """Test Polar products sync."""

    @pytest.mark.asyncio
    async def test_sync_products_fetches_and_caches(self):
        """Should fetch products and prices from Polar."""
        repo = PolarProductsRepository()

        with patch.object(repo, "client"):
            with patch(
                "backend.app.lib.polar.products.repository.get_polar_client"
            ) as mock_client:
                mock_client_instance = MagicMock()
                mock_client.return_value.__enter__.return_value = mock_client_instance

                # Mock Polar response
                mock_product = MagicMock()
                mock_product.id = "prod_123"
                mock_product.name = "Pro Plan"

                mock_price = MagicMock()
                mock_price.id = "price_456"
                mock_price.product_id = "prod_123"
                mock_price.amount = 2999
                mock_price.currency = "USD"

                mock_client_instance.products.list.return_value = [mock_product]
                mock_client_instance.prices.list.return_value = [mock_price]

                result = await repo.sync_products()

                assert result["count"] == 1
                assert len(result["products"]) == 1

    @pytest.mark.asyncio
    async def test_map_polar_to_billing_plan(self):
        """Should map Polar product to internal billing schema."""
        repo = PolarProductsRepository()

        polar_plan = {
            "polar_product_id": "prod_123",
            "polar_price_id": "price_456",
            "name": "Pro Plan",
            "amount": 2999,
            "currency": "USD",
            "billing_period": "monthly",
            "features": {"seats": 5},
            "limits": {"api_calls": 10000},
        }

        mapped = repo.map_polar_to_billing_plan(polar_plan)

        assert mapped["stripe_product_id"] == "prod_123"
        assert mapped["tier"] == "pro"
        assert mapped["price_amount"] == 2999
        assert mapped["payment_processor"] == "polar"


class TestWebhookAdapter:
    """Test Polar webhook event processing."""

    def test_validate_signature_valid(self):
        """Should accept valid signature."""
        import hmac
        import hashlib

        adapter = PolarWebhookAdapter(webhook_secret="secret_123")
        body = b'{"type": "subscription.created"}'

        signature = hmac.new(b"secret_123", body, hashlib.sha256).hexdigest()

        assert adapter.validate_signature(body, signature) is True

    def test_validate_signature_invalid(self):
        """Should reject invalid signature."""
        adapter = PolarWebhookAdapter(webhook_secret="secret_123")
        body = b'{"type": "subscription.created"}'
        bad_signature = "invalid_signature_xyz"

        assert adapter.validate_signature(body, bad_signature) is False

    def test_parse_event_extracts_user_id(self):
        """Should extract user_id from event metadata."""
        adapter = PolarWebhookAdapter()

        event = {
            "type": "subscription.created",
            "created_at": "2025-01-01T12:00:00Z",
            "data": {
                "id": "sub_123",
                "metadata": {"supabase_user_id": "user_456"},
            },
        }

        parsed = adapter.parse_event(event)

        assert parsed["event_type"] == "subscription.created"
        assert parsed["user_id"] == "user_456"

    @pytest.mark.asyncio
    async def test_handle_subscription_created(self):
        """Should handle subscription.created event."""
        adapter = PolarWebhookAdapter()

        event = {
            "event_type": "subscription.created",
            "event_id": "sub_123",
            "user_id": "user_456",
            "subject": {
                "id": "sub_123",
                "customer_id": "cus_789",
                "product_id": "prod_abc",
                "status": "active",
                "current_period_start": "2025-01-01",
                "current_period_end": "2025-02-01",
            },
        }

        save_funcs = {
            "save_subscription": AsyncMock(return_value={"id": "local_sub_123"}),
        }

        result = await adapter.handle_subscription_created(event, save_funcs)

        assert result["success"] is True
        save_funcs["save_subscription"].assert_called_once()


class TestReconciliationService:
    """Test usage reconciliation."""

    @pytest.mark.asyncio
    async def test_log_usage_event_dual_write(self):
        """Should log usage locally and attempt to log in Polar."""
        service = PolarReconciliationService()

        with patch(
            "backend.app.lib.polar.reconciliation.get_polar_client"
        ) as mock_client:
            mock_client_instance = MagicMock()
            mock_client.return_value.__enter__.return_value = mock_client_instance
            mock_client_instance.customer_benefits.create_usage.return_value = {
                "success": True
            }

            result = await service.log_usage_event_dual_write(
                user_id="user_123",
                event_type="slide_generated",
                usage_count=1,
            )

            assert result["user_id"] == "user_123"
            assert result["event_type"] == "slide_generated"


class TestBillingService:
    """Test feature-flagged billing service."""

    @pytest.mark.asyncio
    async def test_create_checkout_session_with_polar_enabled(self):
        """Should delegate to Polar when USE_POLAR=True."""
        service = PolarBillingService()

        with patch("backend.app.lib.polar.billing_service.settings") as mock_settings:
            mock_settings.USE_POLAR = True

            with patch(
                "backend.app.lib.polar.billing_service.create_checkout_link"
            ) as mock_create:
                mock_create.return_value = {
                    "id": "checkout_123",
                    "url": "https://checkout.polar.sh/abc",
                    "polar_response": {},
                }

                result = await service.create_checkout_session(
                    user_id="user_123",
                    product_price_id="price_456",
                    success_url="https://app.local/success",
                    cancel_url="https://app.local/cancel",
                )

                assert result["provider"] == "polar"
                assert result["session_id"] == "checkout_123"
                mock_create.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_checkout_session_with_stripe_enabled(self):
        """Should delegate to Stripe when USE_POLAR=False."""
        service = PolarBillingService()

        with patch("backend.app.lib.polar.billing_service.settings") as mock_settings:
            mock_settings.USE_POLAR = False

            result = await service.create_checkout_session(
                user_id="user_123",
                product_price_id="price_456",
                success_url="https://app.local/success",
                cancel_url="https://app.local/cancel",
            )

            assert result["provider"] == "stripe"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
