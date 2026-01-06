# ViralStack AI Coding Instructions

## Project Overview
Radius (formerly ViralStack) is an AI-powered carousel content automation platform for social media. It uses Gemini 2.0 to generate multi-slide Instagram/TikTok carousels based on user-defined templates with A/B testing capabilities.

**Architecture**: Monorepo with FastAPI backend (Python) + Next.js 14 frontend (TypeScript)

## Database & Auth
- **Primary DB**: Supabase (PostgreSQL) with Row Level Security
- **Legacy**: Firestore (being phased out, see [SUPABASE_MIGRATION.md](../SUPABASE_MIGRATION.md))
- **Auth**: Supabase Auth with JWT tokens, Stripe integration for subscriptions
- **Data**: Templates, Posts, Analytics, VariantSets - see [TEMPLATE_SYSTEM_ARCHITECTURE.md](../TEMPLATE_SYSTEM_ARCHITECTURE.md)

## Design System & Styling

### Visual Identity (Radius "Obsidian & Pulse")
- **Brand Name**: Radius
- **Color Palette**:
   - Primary Background: `obsidian` (#0B0B0C) — Deep, modern, professional
   - Primary Accent: `kinetic-mint` (#10B981) — Growth, momentum, vitality
   - Secondary Accent: `electric-violet` (#8B5CF6) — Intelligence, high-end AI power
   - Text/Surface: `ghost-white` (#F8FAFC) — High readability, crispness
- **Typography**:
   - Headlines: Plus Jakarta Sans (Bold, geometric, modern, expensive look)
   - Body: Inter (sans-serif, gold standard for SaaS readability)

### UI Philosophy: "The Minimalist Canvas"
- Semi-transparent glassmorphism backgrounds with subtle blurs
- Smooth, spring-based animations (not just flashing on screen)
- High contrast, premium feel (no SaaS blue)

### UI Component Standards
**CRITICAL**: ALL new UI components must follow these patterns from [app/page.tsx](frontend/src/app/page.tsx):

1. **Background Colors**:
   - Main pages: `bg-obsidian`
   - Sections: Alternate between `bg-obsidian` and `bg-background`
   - Cards: `glass-card` class (glassmorphism with `bg-white/5 backdrop-blur-md border border-white/10`)
   - Inputs: `bg-obsidian border border-ghost-white/10` with `focus:border-kinetic-mint focus:ring-2 focus:ring-kinetic-mint/20`

2. **Text Colors**:
   - Headings: `text-ghost-white`
   - Body text: `text-ghost-white/80`
   - Links: `text-kinetic-mint hover:text-kinetic-mint/80`
   - Muted text: `text-ghost-white/50`

3. **Buttons**:
   - Primary: `btn-primary` or `bg-kinetic-mint hover:bg-kinetic-mint/80 text-obsidian shadow-lg hover:shadow-kinetic-mint/50`
   - Secondary: `btn-secondary` or `bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md`
   - Ghost: `btn-ghost` or `bg-transparent hover:bg-white/5 text-ghost-white/80 hover:text-ghost-white`

4. **Layout Patterns**:
   - Max width containers: `max-w-6xl mx-auto` or `max-w-7xl mx-auto`
   - Padding: `px-6 py-12` or `px-8 py-20` for sections
   - Grid layouts: `grid md:grid-cols-2 lg:grid-cols-3 gap-8`
   - Spacing: Use `space-y-4`, `space-y-8`, `gap-4`, `gap-8` consistently

5. **Split-Screen Auth Pages**:
   - Left side: Form content with `bg-obsidian` or dark background
   - Right side: Gradient illustration `bg-gradient-to-br from-kinetic-mint via-electric-violet to-ghost-white`
   - Hidden on mobile: `hidden lg:flex` for right side
   - White text with dark inputs throughout

6. **Glassmorphism Effects**:
   - Use `glass-card` class for cards: adds backdrop blur, subtle border, and shadow
   - Hover states: `hover:bg-white/10 hover:border-white/20 transition-all duration-300`
   - Forms: Obsidian inputs (`bg-obsidian`) with subtle borders

7. **Animations**:
   - Available: `animate-pulse`, `animate-bounce`, `animate-spin-slow`, `animate-fade-in`
   - Use sparingly on decorative elements
   - Transitions: `transition-all duration-300` for smooth hover effects

### When Creating New Pages/Components:
1. Start with `bg-dark-600` or `bg-dark-500` background
2. Use `text-white` for headings, `text-gray-400` for body
3. Apply `glass-card` or `dark-card` classes for containers
4. Use `btn-primary`, `btn-secondary`, `btn-ghost` for buttons
5. Match the aesthetic of [app/page.tsx](frontend/src/app/page.tsx) hero section
6. Never use pure white backgrounds - always dark theme

## Critical Development Workflows

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

**Environment**: `.env` must have `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

**Environment**: `.env.local` needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`

## Project-Specific Conventions

### State Management (Frontend)
- **Zustand** for global UI state (`authStore`, `dashboardStore`, `styleGuideStore`) - see [ZUSTAND_GUIDE.md](frontend/ZUSTAND_GUIDE.md)
- **TanStack Query** for server state (API calls, caching, mutations) - see [TANSTACK_QUERY_GUIDE.md](frontend/TANSTACK_QUERY_GUIDE.md)
- Never use React Context for data fetching - always use TanStack Query hooks

### Type Safety
- **Shared models**: Backend Pydantic models in `backend/models/` must mirror frontend TypeScript types in `frontend/src/types/`
- **Key types**: `Template`, `Post`, `Analytics`, `StyleConfig`, `SlideDesign` - see [backend/models/template.py](backend/models/template.py) and [frontend/src/types/template.ts](frontend/src/types/template.ts)

### API Patterns
- **Backend**: FastAPI routers in `backend/routers/` with JWT auth via `Depends(get_current_user)`
- **Frontend**: Axios client in `frontend/src/lib/api.ts` with interceptors for auth tokens
- **Example**: [backend/routers/templates.py](backend/routers/templates.py) shows CRUD + performance analytics pattern

### AI Generation
- **Core service**: `backend/ai/gemini_service.py` - see [backend/ai/README.md](backend/ai/README.md)
- **Functions**: `generate_content_with_gemini()`, `generate_week_content()`, `generate_variant_set_content()`
- **Prompts**: Auto-generated from `Template.styleConfig` (JSONB) → structured prompt
- **Validation**: Checks slide count, forbidden words, emoji rules per template

### Rendering Engine
- **Canvas**: React Konva for slide preview/editing (`frontend/src/lib/konva/`)
- **Export**: `skia-canvas` for server-side image generation (backend worker planned)
- **Pattern**: `SlideDesign` objects define visual elements → Konva shapes → PNG export

### Code Quality Rules
- **Functions**: Keep under ~50 lines, cyclomatic complexity ≤10
- **File links**: Always use markdown links without backticks: `[file.ts](path/file.ts)` or `[file.ts](path/file.ts#L10)`
- **Imports**: Absolute paths with `@/` in frontend, relative in backend

## Integration Points

### Supabase Service
- **CRUD wrapper**: `backend/services/supabase_service.py` handles all DB operations
- **Storage**: Supabase Storage buckets for slide images (`slide_images/`)
- **RLS**: Row Level Security enforced - always filter by `user_id`

### Gemini API
- **Model**: `gemini-2.0-flash-exp` for carousel generation
- **Input**: Template `styleConfig` + topic string
- **Output**: JSON array of slides with text, structure type, optional image prompts
- **Rate limits**: Track token usage in [backend/ai/TOKENUSAGE.MD](backend/ai/TOKENUSAGE.MD)

### Stripe Payments
- **Setup**: See [STRIPE_SETUP.md](STRIPE_SETUP.md)
- **Plans**: Pro ($29/mo) and Agency ($99/mo) - Hard paywall, no free tier
- **Dashboard Access**: Requires active Stripe subscription (subscription_status = 'active')
- **Webhook**: `frontend/src/app/api/stripe/webhooks/route.ts` updates Supabase

## Testing & Debugging
- **Backend errors**: Check Supabase connection first (`get_supabase()` in `main.py`)
- **Frontend auth**: Inspect localStorage for `sb-*-auth-token` (Supabase session)
- **API calls**: Use TanStack Query DevTools (enabled in dev mode)
- **DB queries**: Supabase Dashboard SQL Editor for manual queries

## Key Documentation Files
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Feature overview
- [TEMPLATE_SYSTEM_ARCHITECTURE.md](TEMPLATE_SYSTEM_ARCHITECTURE.md) - Data models
- [QUICK_START.md](QUICK_START.md) - Environment setup
- [Editor+Renderer Final.md](Editor+Renderer%20Final.md) - Konva rendering guide

## Common Tasks

**Add new template field**:
1. Update `backend/models/template.py` Pydantic model
2. Mirror in `frontend/src/types/template.ts`
3. Update Supabase schema: `ALTER TABLE templates ADD COLUMN ...`
4. Update form in `frontend/src/components/TemplateCreator/`

**Add new API endpoint**:
1. Create route in `backend/routers/{resource}.py`
2. Add service method in `backend/services/supabase_service.py`
3. Create TanStack Query hook in `frontend/src/lib/api/hooks/`
4. Use hook in component with proper error handling

**Deploy**:
- Backend: Google Cloud Run (see [TODO.md](TODO.md#Production))
- Frontend: Vercel (auto-deploy from main branch)
- Set `ENV=production` in cloud environment variables


## Nonnegotiables after each edit

- Always run `cd .\frontend\; npm run build` after every change
- Fix all errors if there are any
- Repeat until you get no errors returned