# Polar Migration — Complete Inventory & Stripe Usage

Generated: 2026-04-03

Purpose: Consolidated inventory of implemented Polar features, where Polar is wired in the codebase, and a full list of remaining Stripe usages (backend + frontend) to patch. Do NOT change code here — this is a reference for migration work.

---

## Summary

Polar is implemented as the feature-flagged, primary billing provider. Core Polar functionality (checkout, products, subscriptions, metering, webhooks, reconciliation) lives under `backend/app/lib/polar/` and is exposed via the unified billing surface `backend/app/features/billing/unified_service.py`. The system persists `polar_customer_id` on the `teams` table and provides admin endpoints and scheduled reconciliation tasks. However, a number of legacy Stripe code paths, env vars, types, and front-end UI pieces remain and must be removed or migrated when finalizing the switch.

---

## Polar — Implemented features (core files)

- Core SDK wrapper: [backend/app/lib/polar/client.py](backend/app/lib/polar/client.py)
- Checkout helper: [backend/app/lib/polar/checkout/checkout.py](backend/app/lib/polar/checkout/checkout.py)
- Checkout router: [backend/app/lib/polar/checkout/router.py](backend/app/lib/polar/checkout/router.py)
- Products repository & sync: [backend/app/lib/polar/products/repository.py](backend/app/lib/polar/products/repository.py)
- Subscriptions: [backend/app/lib/polar/subscription/service.py](backend/app/lib/polar/subscription/service.py), [backend/app/lib/polar/subscription/router.py](backend/app/lib/polar/subscription/router.py), [backend/app/lib/polar/subscription/model.py](backend/app/lib/polar/subscription/model.py)
- Metering / usage: [backend/app/lib/polar/meter/service.py](backend/app/lib/polar/meter/service.py), [backend/app/lib/polar/meter/router.py](backend/app/lib/polar/meter/router.py), [backend/app/lib/polar/meter/surface.py](backend/app/lib/polar/meter/surface.py)
- Webhook adapter & router: [backend/app/lib/polar/webhooks/adapter.py](backend/app/lib/polar/webhooks/adapter.py), [backend/app/lib/polar/webhooks/router.py](backend/app/lib/polar/webhooks/router.py)
- Reconciliation service: [backend/app/lib/polar/reconciliation.py](backend/app/lib/polar/reconciliation.py)
- Polar billing helpers (feature-flagged): [backend/app/lib/polar/billing_service.py](backend/app/lib/polar/billing_service.py)
- Router aggregator: [backend/app/lib/polar/router.py](backend/app/lib/polar/router.py)
- Tests (Polar): [backend/tests/test_polar_integration.py](backend/tests/test_polar_integration.py), [backend/tests/test_polar_e2e.py](backend/tests/test_polar_e2e.py)
- Docs: [docs/polar-migration.md](docs/polar-migration.md)


## Polar — Productization & infra

- Unified billing entry point: [backend/app/features/billing/unified_service.py](backend/app/features/billing/unified_service.py)
- Billing HTTP endpoints (checkout, webhooks): [backend/app/features/billing/router.py](backend/app/features/billing/router.py)
- Admin endpoints for Polar (sync/reconcile/toggle): [backend/app/features/billing/admin_router.py](backend/app/features/billing/admin_router.py)
- API router includes Polar routes: [backend/app/api/router.py](backend/app/api/router.py)
- Persist Polar customer id on Team: [backend/app/features/team/models.py](backend/app/features/team/models.py)
- DB migration: [supabase/migrations/0001_add_polar_customer_id.sql](supabase/migrations/0001_add_polar_customer_id.sql)
- Backfill helper: [scripts/backfill_polar_customer_id.py](scripts/backfill_polar_customer_id.py)
- Scheduled tasks & workers (reconciliation, health checks): [backend/app/worker/polar_tasks.py](backend/app/worker/polar_tasks.py) and task registration in [backend/app/core/events.py](backend/app/core/events.py)


---

## Where Polar is called / wired (call-sites)

- Unified entry point: `UnifiedBillingService` — [backend/app/features/billing/unified_service.py](backend/app/features/billing/unified_service.py) (routes to Polar when `USE_POLAR=True`, persists `polar_customer_id` to team rows).
- Checkout creation: `create_checkout_link()` imported/used in [backend/app/features/billing/router.py](backend/app/features/billing/router.py).
- Polar webhook receiver: POST `/billing/webhook/polar` in [backend/app/features/billing/router.py](backend/app/features/billing/router.py) — validates `X-Polar-Signature` and dispatches to the billing service handlers (`save_subscription_from_polar`, `update_subscription_from_polar`, `cancel_subscription_from_polar`, `save_invoice_from_polar`).
- Admin tools: product sync, reconciliation and feature flag toggle in [backend/app/features/billing/admin_router.py](backend/app/features/billing/admin_router.py).
- Reconciliation & dual-write: invoked from [backend/app/lib/polar/billing_service.py](backend/app/lib/polar/billing_service.py) and [backend/app/lib/polar/reconciliation.py](backend/app/lib/polar/reconciliation.py).
- Team backfill: [scripts/backfill_polar_customer_id.py](scripts/backfill_polar_customer_id.py) (helper script to placeholder backfill or to reconcile real Polar IDs).


---

## Stripe — Inventory (places still using Stripe or referencing Stripe)

Note: this list was assembled from repository search results. Treat each listed file as a migration target — update to route through the Unified Billing surface (Polar) or remove when safe.

### Backend

- [backend/app/features/billing/router.py](backend/app/features/billing/router.py) — Legacy Stripe checkout endpoints, Stripe webhook handler (`stripe_webhook`), and portal/checkout fallbacks. (Marked sections: `# ----- STRIPE WEBHOOKS -----`.)
- [backend/app/lib/polar/billing_service.py](backend/app/lib/polar/billing_service.py) — Contains explicit fallback and `provider: "stripe"` paths when `USE_POLAR` is false; TODOs that reference delegating to Stripe.
- [backend/app/features/billing/unified_service.py](backend/app/features/billing/unified_service.py) — Implements both Polar and Stripe modes; checks `settings.STRIPE_SECRET_KEY` in Stripe path and contains Stripe-mode TODOs.
- [backend/app/features/billing/admin_router.py](backend/app/features/billing/admin_router.py) — Admin API surface reports `processor: 'polar' | 'stripe'` and toggles; used to rollback to Stripe if needed.
- [backend/app/api/router.py](backend/app/api/router.py) — Billing routes are centrally wired (billing router contains Stripe endpoints in fallback paths).
- [backend/requirements.txt](backend/requirements.txt) — `stripe==5.0.0` present as a backend dependency.
- [backend/BACKEND_FILE_INVENTORY.md](backend/BACKEND_FILE_INVENTORY.md) — Inventory lists legacy Stripe components and migration state.
- [backend/backenderrors.txt](backend/backenderrors.txt) — Lint/test error logs referencing Stripe-related backend modules (useful to inspect test failures while migrating).
- Stripe integration modules (Supabase-backed repos):
  - [backend/services/integrations/supabase/stripe/plans_repository.py](backend/services/integrations/supabase/stripe/plans_repository.py)
  - [backend/services/integrations/supabase/stripe/products_repository.py](backend/services/integrations/supabase/stripe/products_repository.py)
- Usage/analytics code referencing Stripe: [backend/services/usage/service.py](backend/services/usage/service.py) imports `stripe` in places.

Recommended backend remediation notes (per file):
- Replace direct Stripe SDK calls with UnifiedBillingService calls where appropriate.
- Move product mapping (env-driven product IDs) into Polar products sync or unified surface.
- Remove `stripe` from `requirements.txt` only after all imports and run-time references are removed and tests pass.


### Frontend

- [frontend/.env.local](frontend/.env.local) — Contains `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_STRIPE_PRODUCT_*` env vars. These must be migrated (map product ids → Polar product ids or remove if Polar manages products).
- [frontend/package.json](frontend/package.json) — Contains `stripe` script (`stripe listen --forward-to ...`) and dependencies `@stripe/stripe-js` and `stripe` in `package.json` / `package-lock.json`.
- Deprecated Stripe UI & utils: [frontend/src/features/stripe/](frontend/src/features/stripe/) — UI components and utilities flagged as deprecated in comments; replace with provider-agnostic billing components under `features/billing/`.
- Subscription UI/actions/hooks referencing Stripe:
  - [frontend/src/features/subscription/actions.ts](frontend/src/features/subscription/actions.ts) — Maps plan keys to Stripe product IDs via env vars and opens Stripe Customer Portal.
  - [frontend/src/features/subscription/hooks.ts](frontend/src/features/subscription/hooks.ts) — Imports `StripeSubscription` types.
- Router/middleware handling Stripe session redirects: [frontend/src/middleware.ts](frontend/src/middleware.ts) — Allows Stripe success redirects (checks `session_id`). Adjust logic to accept Polar's session flow or route through unified success flow.
- Supabase-generated Stripe types: [frontend/src/types/stripe.ts](frontend/src/types/stripe.ts) and DB types referencing `stripe_customer_id` / `stripe_subscription_id` in [frontend/src/types/database.ts](frontend/src/types/database.ts).
- Other mentions in docs & README: [frontend/README.md](frontend/README.md) and [.github/copilot-instructions.md](.github/copilot-instructions.md) include Stripe setup instructions and references.

Frontend remediation notes:
- Replace direct usage of `@stripe/stripe-js` flows with calls to the unified API endpoint that returns a Polar checkout link.
- Move all product-id mapping out of front-end env vars into server-side Polar product sync or a stable mapping endpoint.
- Remove deprecated `features/stripe` components and adjust subscription hooks/components to use provider-agnostic `features/billing` surfaces.
- Remove `@stripe/stripe-js` and `stripe` packages from `package.json` after migrating usages and verifying builds/tests.


---

## Quick remediation checklist (suggested order)

1. Verify [docs/polar-migration.md](docs/polar-migration.md) and this inventory; pick a branch for the final removal.
2. Turn `USE_POLAR=true` in staging and confirm Polar flows end-to-end (checkout, webhook, reconcile).
3. Migrate all frontend product-id usage from env vars to server-driven mapping (Polar product sync + endpoints).
4. Replace all direct Stripe SDK calls in backend with UnifiedBillingService calls or PolarBillingService paths.
5. Remove or adapt deprecated UI under `frontend/src/features/stripe/` to provider-agnostic components.
6. Remove `stripe` deps: backend `requirements.txt` and frontend `package.json` only after tests and build succeed.
7. Run full backend tests, frontend build, and E2E with Polar staging credentials.
8. Delete legacy Stripe endpoints and webhooks once traffic and cancellations are verified and historical data handling is planned.


---

## Notes & pointers

- The authoritative Polar runbook and operational commands are in [docs/polar-migration.md](docs/polar-migration.md). Use this new inventory as a tactical checklist focused on code locations to change.
- If you want, I can:
  - produce a checklist PR that updates comments and TODOs in the files above,
  - or generate a follow-up action plan splitting work into PR-sized tasks (frontend vs backend vs infra).


---

End of inventory.
