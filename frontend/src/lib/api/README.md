Purpose
-------
This folder contains the frontend API layer used by UI code: a small collection of clients, services, surface APIs, and hooks that the app uses to interact with Supabase and backend endpoints.

Structure
---------
- `clients/` — thin HTTP clients (e.g. backendClient) for external/backend requests.
- `services/` — orchestration and business logic that combine repositories and clients.
- `surface/` — UI-facing API surface that the rest of the app imports (safe, small surface functions).
- `hooks/` — React Query hooks that call the surface APIs.

How to implement a new feature
------------------------------
1. Add repository methods in `src/lib/supabase/repos` if you need DB access.
2. Add a `service` in `services/` to encapsulate orchestration and validation (use Zod where appropriate).
3. Expose the minimal, UI-friendly functions in `surface/` (these should call the service methods).
4. Add React Query hooks in `hooks/` to call the `surface` functions and handle cache invalidation.
5. Update `src/lib/api/client.ts` to delegate (prefer dynamic import to avoid circular deps) or import the surface directly if safe.
6. Run the frontend build and tests.

Validation & Tests
------------------
- Validate inputs at service boundaries using Zod schemas located in `src/lib/validation`.
- Keep services small and side-effect free when possible (return values, throw on errors).

Nonnegotiable
------------
- After every code change, run:

```bash
cd frontend
npm run build
```

This repository enforces the build step as part of the change process.
