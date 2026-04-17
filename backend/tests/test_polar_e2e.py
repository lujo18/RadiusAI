"""End-to-end integration test for full Polar checkout → webhook → subscription flow.

Tests the complete payment lifecycle:
1. Create checkout link
2. Simulate Polar webhook: subscription.created
3. Verify subscription saved to DB
4. Simulate webhook: invoice.paid
5. Verify invoice saved to DB
"""

import pytest
import json
import hmac
import hashlib
from datetime import datetime, UTC
from unittest.mock import AsyncMock, patch, MagicMock

from backend.app.lib.polar.checkout.checkout import create_checkout_link
from backend.app.lib.polar.webhooks.adapter import get_polar_webhook_adapter
from backend.app.lib.polar.billing_service import get_polar_billing_service
from backend.app.features.billing.unified_service import get_unified_billing_service


class TestPolarIntegrationFlow:
    """End-to-end tests for unified Polar payment flow."""

    @pytest.fixture
    def mock_polar_client(self):
        """Mock Polar SDK client."""
        with patch("backend.app.lib.polar.client.Polar") as mock_polar:
            mock_instance = MagicMock()
            mock_polar.return_value = mock_instance
            yield mock_instance

    @pytest.fixture
    def webhook_adapter(self):
        """Polar webhook adapter with test secret."""
        return get_polar_webhook_adapter()

    def create_valid_webhook_signature(self, body: bytes, secret: str) -> str:
        """Create a valid HMAC-SHA256 signature for webhook testing."""
        return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

    @pytest.mark.asyncio
    async def test_complete_checkout_to_subscription_flow(self, mock_polar_client):
        """Test complete flow: create checkout → receive webhook → save subscription."""

        # Setup
        user_id = "user_test_123"
        product_price_id = "price_polar_456"
        webhook_secret = "test_secret_xyz"

        # ═══ Step 1: Create checkout link ═══
        mock_response = MagicMock()
        mock_response.id = "checkout_abc123"
        mock_response.url = "https://checkout.polar.sh/abc123"
        mock_polar_client.checkout_links.create.return_value = mock_response

        with patch(
            "backend.app.lib.polar.checkout.get_polar_client"
        ) as mock_client_getter:
            mock_client_getter.return_value.__enter__.return_value = mock_polar_client

            checkout_result = create_checkout_link(
                user_id=user_id,
                team_id="team_test_123",
                product_price_id=product_price_id,
                success_url="https://app.local/success",
                cancel_url="https://app.local/cancel",
            )

            assert checkout_result["id"] == "checkout_abc123"
            assert checkout_result["url"] == "https://checkout.polar.sh/abc123"

        # ═══ Step 2: Simulate subscription.created webhook ═══
        webhook_event = {
            "type": "subscription.created",
            "created_at": datetime.now(UTC).isoformat(),
            "data": {
                "id": f"sub_polar_{user_id}",
                "customer_id": f"cus_polar_{user_id}",
                "product_id": "prod_pro_plan",
                "price_id": product_price_id,
                "status": "active",
                "current_period_start": datetime.now(UTC).isoformat(),
                "current_period_end": "2025-04-26T00:00:00Z",
                "metadata": {"supabase_user_id": user_id},
            },
        }

        webhook_body = json.dumps(webhook_event).encode()
        adapter = get_polar_webhook_adapter()

        # Mock save functions
        mock_save_funcs = {
            "save_subscription": AsyncMock(return_value={"id": f"local_sub_{user_id}"}),
            "update_subscription": AsyncMock(),
            "cancel_subscription": AsyncMock(),
            "save_invoice": AsyncMock(),
        }

        # Process webhook
        webhook_result = await adapter.process_event(webhook_event, mock_save_funcs)

        assert webhook_result["success"] is True
        assert webhook_result["processed_as"] == "subscription.created"
        mock_save_funcs["save_subscription"].assert_called_once()

        # Verify subscription data
        call_args = mock_save_funcs["save_subscription"].call_args
        saved_data = (
            call_args[0][0] if call_args[0] else call_args[1].get("subscription_data")
        )
        assert saved_data["user_id"] == user_id
        assert saved_data["status"] == "active"

        # ═══ Step 3: Simulate invoice.paid webhook ═══
        invoice_event = {
            "type": "invoice.paid",
            "created_at": datetime.now(UTC).isoformat(),
            "data": {
                "id": f"inv_polar_{user_id}",
                "subscription_id": f"sub_polar_{user_id}",
                "amount": 2999,
                "currency": "USD",
                "paid": True,
                "metadata": {"supabase_user_id": user_id},
            },
        }

        invoice_result = await adapter.process_event(invoice_event, mock_save_funcs)

        assert invoice_result["success"] is True
        assert invoice_result["processed_as"] == "invoice.paid"
        mock_save_funcs["save_invoice"].assert_called_once()

        # ═══ Step 4: Verify subscription updated ═══
        update_event = {
            "type": "subscription.updated",
            "created_at": datetime.now(UTC).isoformat(),
            "data": {
                "id": f"sub_polar_{user_id}",
                "status": "active",
                "current_period_start": datetime.now(UTC).isoformat(),
                "current_period_end": "2025-04-26T00:00:00Z",
                "metadata": {"supabase_user_id": user_id},
            },
        }

        update_result = await adapter.process_event(update_event, mock_save_funcs)

        assert update_result["success"] is True
        mock_save_funcs["update_subscription"].assert_called_once()

        print("✓ Complete Polar flow test passed!")

    @pytest.mark.asyncio
    async def test_webhook_signature_validation(self, webhook_adapter):
        """Test webhook signature validation."""
        secret = "test_secret_xyz"
        body = b'{"type": "subscription.created"}'

        # Valid signature
        valid_sig = self.create_valid_webhook_signature(body, secret)
        assert webhook_adapter.validate_signature(body, valid_sig) is True

        # Invalid signature
        invalid_sig = "invalid_signature_abc"
        assert webhook_adapter.validate_signature(body, invalid_sig) is False

    @pytest.mark.asyncio
    async def test_webhook_deduplication(self, webhook_adapter):
        """Test that duplicate webhook events are deduplicated."""
        event = {
            "type": "subscription.created",
            "data": {
                "id": "sub_123_dup",
                "status": "active",
                "metadata": {"supabase_user_id": "user_123"},
            },
        }

        processed_event_ids = set()

        async def mock_dedupe(event_id: str) -> bool:
            """Return True if already processed (deduplicate)."""
            if event_id in processed_event_ids:
                return True
            processed_event_ids.add(event_id)
            return False

        mock_save_funcs = {
            "save_subscription": AsyncMock(return_value={"id": "sub_local_123"}),
        }

        # First call - should process
        result1 = await webhook_adapter.process_event(
            event, mock_save_funcs, deduplicate_func=mock_dedupe
        )
        assert result1["success"] is True

        # Second call with same event ID - should dedup
        result2 = await webhook_adapter.process_event(
            event, mock_save_funcs, deduplicate_func=mock_dedupe
        )
        assert result2["processed_as"] == "dedup"

        # save_subscription should only be called once
        assert mock_save_funcs["save_subscription"].call_count == 1

        print("✓ Deduplication test passed!")

    @pytest.mark.asyncio
    async def test_unified_service_feature_flagging(self):
        """Test that unified service properly routes to Polar when enabled."""
        service = get_unified_billing_service()

        with patch(
            "backend.app.features.billing.unified_service.settings"
        ) as mock_settings:
            # Test Polar path
            mock_settings.USE_POLAR = True
            mock_settings.POLAR_API_KEY = "test_key_123"

            # Initialize and verify
            result = await service.initialize_on_startup(None)
            assert result["processor"] == "polar"
            assert result["configured"] is True

            # Test Stripe path
            mock_settings.USE_POLAR = False
            mock_settings.STRIPE_SECRET_KEY = "test_stripe_key"

            result = await service.initialize_on_startup(None)
            assert result["processor"] == "stripe"
            assert result["configured"] is True

        print("✓ Feature flagging test passed!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
