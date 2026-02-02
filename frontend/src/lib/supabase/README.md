Purpose
-------
Top-level `supabase/` helpers and repositories for typed DB access. This layer provides the configured Supabase client and the `repos/` folder.

When to change
--------------
- Add typed repositories for new tables under `repos/`.
- Keep `client.ts` as the single Supabase client instance.

Notes
-----
- Prefer explicit, literal table names and typed Database definitions (`/src/types/database.ts`).
