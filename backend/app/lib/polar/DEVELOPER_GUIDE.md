## Polar Integration — Developer Guide

Purpose: provide a concise overview of the Polar integration and its working parts to help future development and maintenance.

Status: Production-ready (feature-flagged via `USE_POLAR`).

--

1) Quick map

- Package: [backend/app/lib/polar](backend/app/lib/polar)
- Key modules:
  - `client.py` — Polar SDK wrapper and client factory
  - `errors.py` — Polar-specific exception types
  - `checkout.py` — create checkout links / sessions
  - `products/repository.py` — sync & map Polar products/prices to local plans
  - `webhooks/adapter.py` — signature validation, event parsing, handlers
  - `reconciliation.py` — dual-write helpers, reconciliation batch, retry logic
  - `billing_service.py` — Polar-specific billing helpers (feature-flagged)

2) High-level flows

- Checkout flow:
  1. Caller → `UnifiedBillingService.create_checkout_session()` (feature-flagged).
  2. If `USE_POLAR=true` -> `checkout.create_checkout_link()` calls Polar SDK.
  3. User completes Polar checkout → Polar sends webhook → `webhooks/adapter.process_event()`.
  4. Adapter validates signature, normalizes event, calls `unified_service.save_subscription_from_polar()`.

- Webhook handling:
  - HMAC-SHA256 verification against `POLAR_WEBHOOK_SECRET` (adapter).
  - Idempotency/deduplication: adapter accepts a dedupe callback and records processed event ids.
  - Handlers call repository/save functions to persist subscription/invoice state and polar_* metadata.

- Usage / Benefits (Dual-write + Reconciliation):
  - Actions that consume benefits record a local usage audit entry immediately.
  - A best-effort write to Polar benefits API is attempted; failures are queued for retry.
  - Daily scheduled reconciliation (`polar_tasks`) compares Polar state vs local audit, flags drift.

3) App integration points

- Entry point: `backend/app/features/billing/unified_service.py` — the single API surface used by callers.
- HTTP: `backend/app/features/billing/router.py` registers `POST /billing/webhook/polar` and uses the adapter.
- Admin: `backend/app/features/billing/admin_router.py` exposes manual sync/reconcile endpoints.
- Scheduler: `backend/app/worker/polar_tasks.py` registers APScheduler jobs at startup (`events.py`).
- CLI: `backend/app/cli/sync_products.py` to populate local plans from Polar.

4) Configuration

- Env vars required (example):
  - `USE_POLAR` (true/false)
  - `POLAR_API_KEY`
  - `POLAR_WEBHOOK_SECRET`
  - `POLAR_MIGRATION_MODE` (gradual|immediate)

5) Tests

- Unit tests: `backend/tests/test_polar_integration.py` (client, checkout, products, adapter, reconciliation)
- E2E: `backend/tests/test_polar_e2e.py` (checkout → webhook → subscription lifecycle)

6) Local dev & troubleshooting

- Useful commands:
  - Run unit tests: `pytest backend/tests/test_polar_integration.py -v`
  - Run e2e tests: `pytest backend/tests/test_polar_e2e.py -v -s`
  - Sync products (dry-run): `python backend/app/cli/sync_products.py --env=development --dry-run`

- Common checks when debugging:
  - Ensure `POLAR_API_KEY` and `POLAR_WEBHOOK_SECRET` are set.
  - Confirm raw request body is passed to the adapter for signature validation (do not pre-parse).
  - Inspect `usage_audit` for failed dual-writes.
  - Manually trigger reconcile via admin endpoint: `POST /api/admin/polar/reconcile`.

7) Recommended dev tasks / next small improvements

- Wire database repository calls in `unified_service` TODOs to concrete `subscription_repo` / `invoice_repo` functions.
- Add metrics export (Prometheus/DataDog) for `polar.*` counters in adapter, reconciliation, and billing service.
- Implement a robust feature-flag service instead of env-var toggles for runtime toggling.
- Add an admin UI page to surface `reconciliation` drift and retry actions.

8) File-by-file quick reference

- `client.py` — `get_polar_client()` validates keys and returns an authenticated SDK client.
- `errors.py` — `PolarError`, `PolarConfigurationError`, `PolarAPIError`.
- `checkout.py` — `create_checkout_link(user_id, price_id, success_url, cancel_url)` → normalized dict `{id, url}`.
- `products/repository.py` — `sync_products()` and `map_polar_to_billing_plan()`.
- `webhooks/adapter.py` — `PolarWebhookAdapter`:
  - `validate_signature(raw_body, signature_header)`
  - `parse_event(payload)`
  - `process_event(raw_body, signature_header, save_funcs..., dedupe_func=None)`
- `reconciliation.py` — `PolarReconciliationService`:
  - `log_usage_event_dual_write()`
  - `reconcile_daily_batch()`
  - `sync_local_to_polar_retry()`
- `billing_service.py` — convenience adapters to expose Polar helpers when `USE_POLAR` enabled.

9) Contacts & references

- Polar API docs: https://docs.polar.sh/api
- Polar SDK: https://github.com/polarsource/python-sdk

--

If you want, I can also create a short checklist PR template for staging → production that runs the `verify_startup.py` script and the product sync CLI as part of deployment steps.
