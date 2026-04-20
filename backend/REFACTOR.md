You are a senior Python engineer performing a backend refactor.
Your task is to restructure this FastAPI project from a flat layout
into a feature-folder architecture.

Do NOT delete any original file until Phase 8. Work in phases exactly
as described. After each phase, state what you completed and what is next.

════════════════════════════════════════════════
TARGET STRUCTURE
════════════════════════════════════════════════

app/
├── main.py
├── api/
│   └── router.py
├── core/
│   ├── config.py
│   ├── database.py
│   ├── security.py
│   └── exceptions.py
├── shared/
│   ├── base_repository.py
│   ├── dependencies.py
│   └── utils.py
└── features/
    ├── <feature_name>/
    │   ├── __init__.py
    │   ├── router.py       ← HTTP only. No logic.
    │   ├── service.py      ← Business logic only. No raw SQL.
    │   ├── repository.py   ← DB queries only. No business logic.
    │   ├── schemas.py      ← Pydantic request/response models.
    │   └── models.py       ← SQLAlchemy ORM model.
    └── ... (one folder per domain)


════════════════════════════════════════════════
PHASE 1 — DISCOVERY (read-only)
════════════════════════════════════════════════

1. List every .py file in the project recursively.
2. For each file, read it fully and produce a structured summary:
   - File path
   - What it currently does (1–2 sentences)
   - List every function/class defined in it
   - List every import it has
3. Identify all SQLAlchemy models (classes inheriting Base or db.Model).
4. Identify all Pydantic schemas (classes inheriting BaseModel).
5. Identify all route handlers (@router.get, @app.post, etc.).
6. Identify all service/helper functions (everything that isn't a model,
   schema, or route).
7. Identify shared utilities used by more than one domain.

Output a clean inventory table before proceeding.


════════════════════════════════════════════════
PHASE 2 — DOMAIN MAPPING
════════════════════════════════════════════════

Using the inventory from Phase 1, assign every function, class,
and route to a feature domain.

Rules:
- A domain = one business concept (users, billing, organizations,
  notifications, etc.)
- If a function is used by 2+ domains → it belongs in shared/
- If a function is pure infrastructure (DB session, JWT, config) → core/
- Do NOT invent new domains. Work with what exists.

Produce a mapping table:

  | Symbol         | Current file   | Target feature | Target file         |
  |----------------|----------------|----------------|---------------------|
  | User (model)   | models.py      | users          | features/users/models.py |
  | create_user()  | service.py     | users          | features/users/service.py |
  | ...            | ...            | ...            | ...                 |

Flag any symbol you are uncertain about with [NEEDS REVIEW] and ask
before proceeding.


════════════════════════════════════════════════
PHASE 3 — SCAFFOLD
════════════════════════════════════════════════

Create the full directory and file structure. Every file should be
created empty (just a module docstring) at this stage. Do not move
any logic yet.

For each feature discovered in Phase 2, create:
  app/features/<name>/__init__.py
  app/features/<name>/models.py
  app/features/<name>/schemas.py
  app/features/<name>/repository.py
  app/features/<name>/service.py
  app/features/<name>/router.py

Also create if not existing:
  app/core/config.py
  app/core/database.py
  app/core/security.py
  app/core/exceptions.py
  app/shared/base_repository.py
  app/shared/dependencies.py
  app/shared/utils.py
  app/api/router.py

Confirm the full tree with `find app/ -type f -name "*.py"` after creation.


════════════════════════════════════════════════
PHASE 4 — MIGRATE MODELS
════════════════════════════════════════════════

Move SQLAlchemy ORM models first. They have the fewest dependencies.

For each model:
1. Copy the class into its target features/<name>/models.py
2. Ensure it imports Base from app.core.database
3. Do not change column definitions or relationships
4. Add a re-export in features/<name>/__init__.py:
   from app.features.<name>.models import <ModelName>

After all models are moved, verify no model still imports from the
old flat file. List any that do.


════════════════════════════════════════════════
PHASE 5 — MIGRATE SCHEMAS
════════════════════════════════════════════════

Move all Pydantic schemas to their feature's schemas.py.

For each schema:
1. Copy the class into features/<name>/schemas.py
2. Group them with section comments:
   # ── Inbound (requests) ──────────────────────
   # ── Outbound (responses) ────────────────────
3. Ensure model_config = {"from_attributes": True} on all response schemas
4. Fix any imports that referenced the old location

Watch for circular imports: schemas must not import from service.py
or repository.py. They may only import from models.py for type hints.

After migration, confirm: `python -c "from app.features.<name>.schemas
import *"` raises no errors for each feature.


════════════════════════════════════════════════
PHASE 6 — MIGRATE REPOSITORIES AND SERVICES
════════════════════════════════════════════════

This is the most complex phase. Do one feature at a time.

── Repositories ──

1. Create a BaseRepository in app/shared/base_repository.py with
   generic get_by_id, get_all, create, delete methods.
2. For each feature, create a repository class that extends BaseRepository.
3. Move all raw DB queries (session.query, select(), etc.) into the repo.
4. The repo class must:
   - Accept an AsyncSession in __init__
   - Contain ONLY query logic — no if/else business rules
   - Be named <Feature>Repository

── Services ──

5. Move all business logic functions into features/<name>/service.py
6. Organize with section comments:
   # ════ CREATE ════
   # ════ READ ════
   # ════ UPDATE ════
   # ════ DELETE ════
   # ════ Private helpers ════  (prefix with _)
7. Each service function must:
   - Accept db: AsyncSession as first argument
   - Call the repository for all DB access
   - Never use raw SQL or session directly
   - Raise typed exceptions from core/exceptions.py (not HTTPException)
8. Helper functions used only by one service function go at the
   bottom prefixed with _
9. Helper functions used by multiple features go into shared/utils.py

After each feature, run:
  python -c "from app.features.<name>.service import *"
and confirm no import errors.


════════════════════════════════════════════════
PHASE 7 — WIRE ROUTERS
════════════════════════════════════════════════

1. For each feature, populate features/<name>/router.py:
   - Create an APIRouter()
   - Add route handlers that are PAPER-THIN:
     * Validate input via Pydantic schemas
     * Call one service function
     * Return the result
   - Route handlers must contain zero business logic
   - Inject dependencies via Depends() only

2. Populate app/api/router.py:
   - Import every feature router
   - Register with prefix and tags:
     api_router.include_router(users_router, prefix="/v1/users", tags=["users"])

3. Update app/main.py:
   - Use app.include_router(api_router, prefix="/api")
   - Register exception handlers from core/exceptions.py

4. Update app/shared/dependencies.py:
   - Move get_current_user and any shared Depends functions here

5. Final import check — run:
     python -m app.main
   and confirm the app starts with no ImportError or circular import.


════════════════════════════════════════════════
PHASE 8 — VERIFY AND CLEANUP
════════════════════════════════════════════════

Only run this phase after Phase 7 passes cleanly.

1. Run the full test suite. Fix any broken imports in tests.
   Tests should only need to update import paths, not test logic.

2. Search the entire codebase for any remaining imports from old
   flat files (models.py, service.py, schemas.py at root level):
     grep -r "from models import\|from service import\|from schemas import" .

3. For each old file still referenced, trace why and fix it.

4. Once grep returns zero results, delete the old flat files.

5. Run `python -m pytest` one final time. All tests must pass.

6. Run `python -m app.main` and confirm clean startup.

7. Produce a final summary:
   - Files deleted
   - Files created
   - Features identified
   - Any [NEEDS REVIEW] items that require human decision


════════════════════════════════════════════════
HARD RULES — NEVER VIOLATE THESE
════════════════════════════════════════════════

- router.py never imports from repository.py directly
- service.py never raises HTTPException — use AppError subclasses
- repository.py never contains if/else business logic
- schemas.py never imports from service.py or repository.py
- No function should be duplicated across features — shared → shared/utils.py
- Every new file must have a module-level docstring explaining its role
- All async functions must use await — never mix sync/async DB calls
- Do not refactor logic while moving it. Move first. Refactor after.


════════════════════════════════════════════════
IF YOU GET STUCK
════════════════════════════════════════════════

- Circular import → the lower layer is importing from the upper layer.
  Dependency direction must always be: router → service → repository → model
- "Should this go in service or repository?" → if it touches the DB, repo.
  If it makes a decision about data, service.
- "Is this shared or feature-specific?" → if only one feature uses it today,
  put it in the feature. Move to shared when a second feature needs it.
- Ambiguous domain for a function → flag it with [NEEDS REVIEW] and ask.

Begin with Phase 1. Do not proceed to Phase 2 until the inventory
table is complete and confirmed.