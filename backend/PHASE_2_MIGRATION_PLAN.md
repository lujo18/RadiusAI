# Phase 2: Consolidate backend/util/ → app/shared/

**Status**: 🔵 PLANNED  
**Scope**: Migrate utility functions and helpers from legacy location to feature-based architecture  
**Risk Level**: 🟢 LOW-MEDIUM  
**Estimated Impact**: 20-30 files affected (5-10 imports to update)  
**Build Verification**: At end

---

## 📋 Files to Migrate

### Category 1: Generate/LLM Utilities (3 files → app/shared/genai/)
These are used by content generation services

| Legacy File | Target Location | Current Usage | Migration Notes |
|------------|-----------------|----------------|-----------------|
| `backend/util/llm_output_sanitizer.py` | `app/shared/genai/llm_output_sanitizer.py` | Used by genai services | Direct move, no complex deps |
| `backend/util/system_prompt.py` | `app/shared/genai/system_prompt.py` | Used by genai services | Direct move |
| `backend/util/encode_state.py` | `app/shared/security/encode_state.py` | OAuth state encoding | Utilities helper |

### Category 2: Time Utilities (1 file → app/shared/time/)
Generic time helpers

| Legacy File | Target Location | Current Usage | Migration Notes |
|------------|-----------------|----------------|-----------------|
| `backend/util/time/util.py` | `app/shared/time/utils.py` | Time formatting, utilities | Self-contained |

### Category 3: Data Transformation (1 file → app/shared/data/)
Analytics/data processing

| Legacy File | Target Location | Current Usage | Migration Notes |
|------------|-----------------|----------------|-----------------|
| `backend/util/textToDataframe.py` | `app/shared/data/text_to_dataframe.py` | Analytics processing | May have deps on pandas |

### Category 4: OAuth State Utilities (1 file → app/shared/security/)
Already listed above: `encode_state.py` (see Category 1)

| Legacy File | Target Location | Current Usage | Migration Notes |
|------------|-----------------|----------------|-----------------|
| `backend/util/generate_state.py` | `app/shared/security/generate_state.py` | OAuth state generation | Pair with encode_state.py |

### Category 5: Stock Packs Utilities (2 files → app/features/stock_packs/utils/)

| Legacy File | Target Location | Current Usage | Migration Notes |
|------------|-----------------|----------------|-----------------|
| `backend/util/stockPacks/manifest.py` | `app/features/stock_packs/utils/manifest.py` | Stock pack manifest mgmt | Already partially in feature |
| `backend/util/stockPacks/model.py` | `app/features/stock_packs/schemas.py` | Stock pack models | Pydantic schemas |

---

## 🔍 Dependency Analysis

### Files Importing from backend/util/

**GREP Results**: 15 active imports found

#### High Priority (Must Update First)
1. **backend/services/genai/generate_slideshow.py** (lines 4, 9-10, 16)
   ```python
   from services.stock_packs.getPhotos import queryStockPackUrls
   from services.genai.prompts import SYSTEM_PROMPT
   from services.genai.gpt_oss_prompts import assemble_generation_prompt
   from services.unsplash.getPhotos import queryUnsplashUrls
   ```
   - Imports: `SYSTEM_PROMPT`, `assemble_generation_prompt`
   - Target: Will move to `app/shared/genai/system_prompt.py`

2. **backend/services/slides/slide_generation.py** (line 11)
   ```python
   from util.system_prompt import SYSTEM_PROMPT
   ```
   - Imports: `SYSTEM_PROMPT`
   - Target: Will move to `app/shared/genai/system_prompt.py`

3. **backend/services/pillow/renderSlides.py** (line 1: model import)
   ```python
   from models.slide import PostSlide, TextElement, ...
   ```
   - Note: This imports from `models`, not `util` (different migration)

#### Medium Priority (Workers, Integrations)
4. **backend/services/workers/automation/*** (multiple files)
   - Uses Supabase client, integrations
   - Status: Not directly importing from util/ currently
   - Action: Verify imports during test

#### Low Priority (Test Files)
5. **test_template_generation.py** (line 9)
   ```python
   from services.integrations.groq.util.GenerateTemplate import generate_template
   ```
   - Note: This is `services/integrations/groq/util`, not `backend/util/`
   - Action: Skip (different path)

---

## 🎯 Migration Order

### Step 1: Create Target Directory Structure
```bash
# Create shared architecture
mkdir -p backend/app/shared/genai
mkdir -p backend/app/shared/security
mkdir -p backend/app/shared/time
mkdir -p backend/app/shared/data
mkdir -p backend/app/features/stock_packs/utils (if not exists)

# Create __init__.py files
touch backend/app/shared/__init__.py
touch backend/app/shared/genai/__init__.py
touch backend/app/shared/security/__init__.py
touch backend/app/shared/time/__init__.py
touch backend/app/shared/data/__init__.py
```

### Step 2: Consolidate Files (Grouped by Target)

#### 2A: GenAI Utilities (3 files)
Move these files (NO CHANGES to internal code):
- `backend/util/llm_output_sanitizer.py` → `app/shared/genai/llm_output_sanitizer.py`
- `backend/util/system_prompt.py` → `app/shared/genai/system_prompt.py`
- `backend/util/prompts.py` (if exists, check genai/) → `app/shared/genai/prompts.py`

#### 2B: Security/OAuth Utilities (2 files)
Move these files:
- `backend/util/generate_state.py` → `app/shared/security/generate_state.py`
- `backend/util/decode_state.py` → `app/shared/security/decode_state.py`

#### 2C: Time Utilities (1 file)
Move this file:
- `backend/util/time/util.py` → `app/shared/time/utils.py`

#### 2D: Data Utilities (1 file)
Move this file:
- `backend/util/textToDataframe.py` → `app/shared/data/text_to_dataframe.py`

#### 2E: Stock Packs (2 files)
Move these files:
- `backend/util/stockPacks/manifest.py` → `app/features/stock_packs/utils/manifest.py`
- `backend/util/stockPacks/model.py` → `app/features/stock_packs/utils/model.py`

### Step 3: Create Wrapper Exports (Backwards Compat)
In `backend/util/__init__.py`, add re-exports for grace period:

```python
"""
⚠️ DEPRECATED: Util Package

Utilities have been migrated to feature-based architecture:
- genai utilities → app/shared/genai/
- security utilities → app/shared/security/
- time utilities → app/shared/time/
- data utilities → app/shared/data/
- stock packs → app/features/stock_packs/utils/

This __init__.py provides backwards compatibility during transition.
DO NOT USE FOR NEW CODE.
"""

# Re-export for backwards compatibility (DEPRECATED)
try:
    from app.shared.genai.llm_output_sanitizer import *
except ImportError:
    pass

try:
    from app.shared.genai.system_prompt import *
except ImportError:
    pass

try:
    from app.shared.security.generate_state import *
except ImportError:
    pass

try:
    from app.shared.security.decode_state import *
except ImportError:
    pass

try:
    from app.shared.time.utils import *
except ImportError:
    pass

try:
    from app.shared.data.text_to_dataframe import *
except ImportError:
    pass
```

### Step 4: Update All Active Imports

#### File 1: backend/services/genai/generate_slideshow.py
**Current**:
```python
from services.genai.prompts import SYSTEM_PROMPT
from services.genai.gpt_oss_prompts import assemble_generation_prompt
```

**Target**:
```python
from app.shared.genai.prompts import SYSTEM_PROMPT
from app.shared.genai.gpt_oss_prompts import assemble_generation_prompt
```

#### File 2: backend/services/slides/slide_generation.py
**Current**:
```python
from util.system_prompt import SYSTEM_PROMPT
```

**Target**:
```python
from app.shared.genai.system_prompt import SYSTEM_PROMPT
```

*(Continue for all 15 identified imports)*

### Step 5: Verification
1. Run `npm run build` in frontend (full frontend/backend stack test)
2. Verify all 23 routes compile
3. Check for import errors in logs
4. Manual test of genai/generation endpoints

---

## 📊 Import Update Summary

### All Imports to Update

| File | Line | Current Import | New Import | Status |
|------|------|---------|-----------|--------|
| genai/generate_slideshow.py | 9 | `from services.genai.prompts` | `from app.shared.genai.prompts` | ⏳ TODO |
| genai/generate_slideshow.py | 10 | `from services.genai.gpt_oss_prompts` | `from app.shared.genai.gpt_oss_prompts` | ⏳ TODO |
| slides/slide_generation.py | 11 | `from util.system_prompt` | `from app.shared.genai.system_prompt` | ⏳ TODO |
| *(more imports as discovered)* | | | | |

---

## 🚨 Risk Assessment

### Low Risk
- ✅ No complex inter-dependencies
- ✅ Utilities are self-contained
- ✅ Well-isolated functionality
- ✅ Backwards-compat wrappers available

### Medium Risk
- ⚠️ Need to verify all transitive imports
- ⚠️ Some imports may be indirect (through re-exports)
- ⚠️ Workers may have hidden dependencies

### Mitigation
1. Create wrapper re-exports in `backend/util/` for grace period
2. Search for ALL import patterns before moving files
3. Build verification after each file group
4. Keep git history for easy rollback

---

## ✅ Success Criteria

- [ ] All 9 files moved to app/shared/ or app/features/
- [ ] All 15+ imports updated to new paths
- [ ] `backend/util/` contains only deprecated wrappers
- [ ] Frontend build passes: 7.9s, 23/23 routes, 0 errors
- [ ] No import errors in backend logs
- [ ] Genai endpoints functional (test generation)
- [ ] No breaking changes to existing functionality

---

## 📅 Timeline

**Estimated Duration**: 30-45 minutes

1. Create directories: 2 min
2. Move files: 10 min
3. Update imports (15 files × 2 min): 30 min
4. Create wrappers: 3 min
5. Build verification: 10 min

---

## 🔄 Rollback Plan

If problems occur:
```bash
# Revert moves
git checkout HEAD -- backend/util/
git checkout HEAD -- backend/app/shared/
git checkout HEAD -- backend/app/features/

# Restore imports
git checkout HEAD -- backend/services/
```

---

## 📝 Files Affected Summary

**Total Files to Move**: 9
**Total Imports to Update**: 15+
**Total Directories to Create**: 5
**Estimated Lines Changed**: 50-100

**Success Metric**: ✅ ZERO build errors after consolidation

---

**Next Steps**: 
1. Review this plan
2. Confirm ready to execute
3. Execute migration in order (2A → 2B → 2C → 2D → 2E → verification)
4. Both steps: Create wrappers + update imports simultaneously per file group
