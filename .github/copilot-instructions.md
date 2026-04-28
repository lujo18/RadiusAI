# Radius AI — Copilot Instructions

## Project
AI-powered Instagram/TikTok carousel automation. Monorepo: FastAPI (Python) + Next.js 14 (TypeScript).

## Stack
| Layer | Tech |
|---|---|
| DB / Auth | Supabase (PostgreSQL + RLS + Auth) |
| Payments | Polar — Pro ($29/mo), Agency ($99/mo). Hard paywall, no free tier |
| Frontend state | Zustand (UI) + TanStack Query (server) |
| AI | Gemma 4 via openrouter via `backend/app/lib/ai_client.py` → `AIClient.callAi()` |
| Canvas | React Konva (preview) + skia-canvas (export) |
| Legacy | Firestore — being phased out, see [SUPABASE_MIGRATION.md](../SUPABASE_MIGRATION.md) |

## Env vars
**Backend** `.env`: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
**Frontend** `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`

---

## Architecture Rules

### Frontend API — always use layered structure
```
clients/   → HTTP transport (backendClient)
services/  → Business logic + Zod validation
surface/   → Stable UI-facing exports
hooks/     → TanStack Query (caching, optimistic updates)
```
- Never bypass layers. Always add `service` + `surface` + `hook` for new endpoints.
- Use dynamic `import()` in `client.ts` to avoid circular deps.
- Validate at `services/` boundary using schemas in `frontend/src/lib/validation/`.
- Update repos in `frontend/src/lib/supabase/repos/` when direct DB access is needed.

### State
- Zustand: `authStore`, `dashboardStore`, `styleGuideStore`
- TanStack Query: all API/server state
- **Never** use React Context for data fetching

### Type Safety
- Backend Pydantic models (`backend/models/`) must mirror frontend TS types (`frontend/src/types/`)
- Key types: `Template`, `Post`, `Analytics`, `StyleConfig`, `SlideDesign`

### Supabase
- All DB ops via `backend/services/supabase_service.py`
- Always filter by `user_id` (RLS enforced)
- Storage bucket: `slide_images/`

### UI / Styling
- Use Shadcn + Animate-UI before creating new components
- Colors: standard shadcn tokens (`background`, `foreground`, `primary`, etc.)
- Dark theme only — never pure white backgrounds
- Match aesthetic of [app/page.tsx](frontend/src/app/page.tsx)

---

## Common Task Checklists

**New template field**
1. `backend/models/template.py` — update Pydantic model
2. `frontend/src/types/template.ts` — mirror type
3. Supabase: `ALTER TABLE templates ADD COLUMN ...`
4. `frontend/src/components/TemplateCreator/` — update form

**New API endpoint**
1. `backend/routers/{resource}.py` — add route with `Depends(get_current_user)`
2. `backend/services/` — add service method
3. `frontend/src/lib/api/services/` + `surface/` — add service + surface
4. `frontend/src/lib/supabase/repos/` — add repo if DB access needed
5. `frontend/src/lib/api/hooks/` — add TanStack Query hook
6. `frontend/src/lib/api/client.ts` — delegate via dynamic import
7. Add Zod validation + unit tests for orchestration logic

---

## Coding Standards
See [CODING_STANDARDS.md](.github/instructions/CODING_STANDARDS.md) — enforced on every edit.

---

## Nonnegotiables
- Run `cd .\frontend\; npm run build` after every change
- Fix all errors before stopping
- Repeat until zero errors
- File links: markdown only, no backticks — `[file.ts](path/file.ts)`
- Imports: `@/` absolute in frontend, relative in backend