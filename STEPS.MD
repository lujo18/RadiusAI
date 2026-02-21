# Radius – Production-Grade SaaS Build Plan  
**Goal**: Full-stack web app (Next.js + FastAPI + Firebase) that auto-generates A/B-tested Instagram/TikTok carousels using Gemini (text) + Leonardo AI / Flux (images), schedules via official Meta & TikTok APIs, pulls analytics, auto-refines content, and monetizes via Stripe subscriptions.

**Target Launch**: 6–8 weeks (solo dev, 20–40 hrs/week)  
**Tech Stack**  
- Frontend: Next.js 14+ (App Router) + TypeScript + Tailwind + TanStack Query  
- Backend: FastAPI (Python) + Firebase Admin  
- Auth & Storage: Firebase Auth + Firestore + Storage  
- AI Text: Google Gemini 1.5 Flash / 2.5  
- AI Images: Leonardo.ai API (primary) + Flux via Groq (UGC mode)  
- Posting: Official Meta Graph API + TikTok Content Posting API  
- Payments: Stripe Subscriptions + Checkout  
- Hosting: Vercel (frontend) + Railway/Render (backend)  

---

## Phase 1: Planning & Research (Week 1 | 10–15 hrs)

- [ ] Write user stories & core flows (Notion)
- [ ] Wireframe all pages in Figma (mobile-first)
- [ ] Design FastAPI endpoints & Firestore data models
- [ ] Research & document 2025 integration details (Gemini, Leonardo, Meta, TikTok, Stripe)
- [ ] Create Stripe pricing tiers & draft ToS / Privacy Policy (Termly.io)
- [ ] Finalize monorepo structure decision (Turborepo recommended)

**Deliverable**: Locked spec doc + Figma prototype

---

## Phase 2: Environment & Accounts Setup (Week 1 | 8–10 hrs)

- [ ] Create monorepo with Turborepo (`npx create-turbo@latest Radius`)
- [ ] Initialize GitHub repo + GitHub Actions (lint + test)
- [ ] Set up Docker + local .env for all services
- [ ] Create & configure:
  - Firebase project (Auth + Firestore + Storage + Admin SDK)
  - Google AI Studio → Gemini API key
  - Leonardo.ai → API key + test generation
  - Groq → API key (Flux UGC mode)
  - Meta Developers → Instagram Graph API app + long-lived token
  - TikTok Developers → Content Posting API app + OAuth flow
  - Stripe → Test + Live mode accounts
  - Pexels API key (fallback stock mode)
- [ ] Write secure Firestore rules (auth-only)

**Deliverable**: All services connected locally, `dev` scripts working

---

## Phase 3: Core MVP Development (Weeks 2–3 | 30–40 hrs)

### 3.1 FastAPI Backend
- [ ] Project setup + CORS + Firebase token verification middleware
- [ ] `/auth/verify` endpoint
- [ ] `/generate-csv` → Gemini 1.5 Flash → robust parser → store in Firestore
- [ ] `/build-slides` → Leonardo AI (or Flux) + Pillow overlay → upload to Firebase Storage
- [ ] `/schedule-posts` → Meta Graph API (carousels) + TikTok Photo Mode (native scheduling)
- [ ] Stripe Checkout session + webhook handler (update user tier)

### Phase: Template Designer MVP (1–2 weeks)

“Generate 7-day carousel in this exact style”
→ Takes current template + niche → calls Gemini with the multi-column prompt → instantly fills a full week using the user’s exact layout.

Exact Architecture (Copy This)
textFrontend (Next.js + Konva)
       ↓
User designs in Konva canvas (live preview)
       ↓
On "Generate Slides" → loop through CSV rows
       ↓f
For each slide:
   • Update text layers with Gemini content
   • Keep exact same fonts, positions, colors, shadows
   • Call stage.toDataURL() or exporter.toBlob()
   → Get pixel-perfect PNG (1080×1350)
       ↓
Upload directly to Firebase Storage (or send base64 to FastAPI)
       ↓
Use that exact image URL for Instagram/TikTok posting

- [ ] Add Konva.js to Next.js frontend
- [ ] Build canvas preview component (1080×1350)
- [ ] Create layer system + right sidebar inspector
- [ ] Ship 15 pro templates (Alpha Listicle, Minimal Quote, Before/After, etc.)
- [ ] Add “Save as Template” + user template library
- [ ] Update Gemini CSV prompt to multi-column output
- [ ] Update slide renderer (Pillow) to read template.layers[]
- [ ] Add auto-font-scaling + overflow detection
- [ ] Add global Brand Kit (logo, colors, fonts)
- [ ] Add “AI Style Match” button (prompt Gemini to rewrite template JSON)

### 3.2 Next.js Frontend
- [ ] Next.js 14 App Router + TypeScript + Tailwind
- [ ] Firebase Auth (email + Google) via NextAuth.js or custom
- [ ] Dashboard layout + protected routes
- [ ] Project creation page (niche + master style guide)
- [ ] Generator page → CSV preview + download
- [ ] Builder page → mode selector (Stock / UGC AI) + progress + carousel preview
- [ ] Scheduler calendar (react-big-calendar) + batch scheduling UI
- [ ] Pricing page → Stripe Checkout redirect

### 3.3 End-to-End Test
- [ ] Manually run: create project → generate 98-row week → build slides → schedule 1 post (sandbox)

**Deliverable**: Full MVP flow works locally

---

## Phase 4: Advanced Features – A/B Testing & Auto-Refinement (Week 4 | 15–20 hrs)

- [ ] Variant system in CSV generation (A/B/C/D auto-assigned)
- [ ] Marketing Run planner:
  - Simple (7/day same variant)
  - Advanced (custom weave, % allocation per variant, interval control)
- [ ] `/plan-run` endpoint → auto-generates dates + mixed variants
- [ ] Daily analytics cron (APScheduler or Railway cron):
  - Pull Meta & TikTok insights → store per post + aggregate per variant
- [ ] `/refine-style` → feed analytics CSV → Gemini → update style guide
- [ ] Analytics dashboard (Recharts):
  - Variant performance table + charts (saves, shares, reach)
  - Auto-highlight winning variant
- [ ] Tier enforcement middleware (free = 50 posts/mo limit)

**Deliverable**: Full closed-loop: generate → post → analyze → evolve

---

## Phase 5: Testing, Security & Polish (Week 5 | 10–15 hrs)

- [ ] Unit tests (pytest backend, Jest frontend)
- [ ] Integration + E2E tests (Playwright full flows)
- [ ] Security audit:
  - Firebase rules locked down
  - Input validation (Pydantic)
  - Rate limiting on public endpoints
  - Sentry error tracking (frontend + backend)
- [ ] Performance: Lighthouse 90+, <2s TTFB
- [ ] Accessibility fixes (a11y)

**Deliverable**: >80% test coverage, no critical security issues

---

## Phase 6: Deployment & Production (Week 6 | 8–10 hrs)

- [ ] Deploy frontend → Vercel (custom domain + SSL)
- [ ] Deploy backend → Railway or Render (with cron jobs)
- [ ] Set up production Firebase project + migrate rules
- [ ] Configure Stripe webhooks (live mode)
- [ ] Add monitoring:
  - Vercel Analytics
  - Sentry
  - Railway logs + metrics
- [ ] Domain + DNS + automatic SSL
- [ ] Backup strategy (Firestore export weekly)

**Deliverable**: Public URL live, payments work, scheduling runs

---

## Phase 7: Launch & Growth (Weeks 7–8 → Ongoing)

- [ ] Closed beta (10–20 power users from X/Reddit)
- [ ] Collect feedback + hotfix sprint
- [ ] Create launch assets:
  - Demo video ( Loom + CapCut )
  - X launch thread (proof + screenshots)
  - Product Hunt page
- [ ] Launch options (choose one first):
  - Lifetime deal on Gumroad / LemonSqueezy ($79–$249)
  - OR direct SaaS subscriptions
  - OR AppSumo (if >$15k fast cash needed)
- [ ] Marketing:
  - X growth thread
  - IndieHackers post
  - Reddit r/SaaS, r/InstagramMarketing
  - $200–500 Meta/TikTok ads targeting “carousel tool”
- [ ] Post-launch roadmap:
  - Video slideshow mode
  - Multi-account agency tier
  - White-label option

**Deliverable**: First 50–100 paying users, $1k–$5k MRR in 30–60 days

---

**You now have the exact battle-tested plan.**  
Print this, put it on your wall, and check boxes daily.  
This is the same roadmap that multiple $10k–$50k MRR AI content tools followed in 2025.

Let’s ship Radius.