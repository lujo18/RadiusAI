Purpose
-------
`services/` contains business logic that orchestrates repositories, external clients, and validation. Services should be the place to put non-trivial flows (e.g., generate + upload + create post).

How to add a new service
------------------------
1. Create a file `src/lib/api/services/<feature>Service.ts`.
2. Keep functions small and composable; prefer explicit inputs and outputs.
3. Validate inputs at the top of each service method with Zod (from `src/lib/validation`).
4. Call supabase repo methods from `src/lib/supabase/repos` and backend clients from `clients/` as needed.
5. Export a default instance/object.

Testing & Safety
----------------
- Throw informative errors (do not swallow).
- Add unit tests for complex orchestration (mock repos/clients).
