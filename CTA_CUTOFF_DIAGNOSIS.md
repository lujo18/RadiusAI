# CTA Data Flow - Potential Cut-off Points

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CtaNode.tsx              Generate Page              Mutation Hook   │
│  ┌──────────────┐        ┌──────────────┐        ┌───────────────┐  │
│  │ CTA Dropdown │        │ handleGenerate│        │  useGeneratePostFromPrompt │
│  │  selection   │──────→ │  (line 75)   │──────→ │               │  │
│  │  onChange    │        │              │        │ ctaId passed  │  │
│  └──────┬───────┘        └──────┬───────┘        └──────┬────────┘  │
│         │                       │                        │           │
│         ↓                       ↓                        ↓           │
│    setSelectedCta      ctaId: selectedCta         ctaId param      │
│                        || undefined (L141)                         │
│                                                                      │
└─────────────────────┬──────────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  postGenerationService.ts     backendGenerationClient.ts           │
│  ┌──────────────────────┐    ┌───────────────────────────┐        │
│  │ generateFromTemplate │    │ generatePostsFromPrompt   │        │
│  │ Auto(...)            │───→│                           │        │
│  │                      │    │ POST /api/generate/post/auto      │
│  │ ctaId extracted      │    │                           │        │
│  │ passed to client     │    │ Request body:             │        │
│  │                      │    │  {                        │        │
│  └──────────────────────┘    │    cta_id: ctaId         │        │
│                              │    ... other fields       │        │
│                              │  }                        │        │
│                              │                           │        │
│                              │ [DEBUG logging added]     │        │
│                              └──────────┬────────────────┘        │
│                                         │                         │
└─────────────────────┬────────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  generate.py Endpoint         brand_cta.py             Services    │
│  ┌──────────────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │ POST /api/generate   │  │get_brand_cta │  │ generate_slideshows│ │
│  │ /post/auto           │─→│              │─→│                    │ │
│  │                      │  │ Fetch from   │  │ slide_generation.py│ │
│  │ Request model:       │  │ Supabase DB  │  │                    │ │
│  │  - cta_id            │  │              │  │ Pass cta param     │ │
│  │                      │  │ [DEBUG log]  │  │                    │ │
│  │ If cta_id provided:  │  │              │  └──────────┬─────────┘ │
│  │  cta = get_brand_cta │  │ Returns:     │             │            │
│  │                      │  │  {           │             ↓            │
│  │ [DEBUG logging]      │  │   cta_text   │  ┌──────────────────────┐
│  │                      │  │   cta_url    │  │ generate_slideshow_  │
│  │ Pass to generate_    │  │   ...        │  │ auto()               │
│  │ slideshows()         │  │  }           │  │                      │
│  └──────────────────────┘  └──────────────┘  │ Receives cta param   │
│                                               │                      │
│                                               │ Calls _generate_     │
│                                               │ prompt(cta=cta)      │
│                                               │                      │
│                                               │ [DEBUG logging]      │
│                                               │                      │
│                                               └──────────┬───────────┘
│                                                          │
│                                                          ↓
│                                               ┌──────────────────────┐
│                                               │ _generate_prompt()   │
│                                               │                      │
│                                               │ IF cta provided:     │
│                                               │   Extract:           │
│                                               │   - cta_text         │
│                                               │   - cta_url          │
│                                               │                      │
│                                               │ Build cta_section:   │
│                                               │ """                  │
│                                               │ *** PRIORITY CTA ... │
│                                               │ Final slide MUST...  │
│                                               │ """                  │
│                                               │                      │
│                                               │ Inject into prompt:  │
│                                               │ {template}{cta_...}  │
│                                               │                      │
│                                               │ [INFO logging]       │
│                                               │                      │
│                                               │ Return full prompt   │
│                                               └──────────┬───────────┘
│                                                          │
│                                                          ↓
│                                               ┌──────────────────────┐
│                                               │ Groq API Call        │
│                                               │                      │
│                                               │ groq.chat.           │
│                                               │ completions.create() │
│                                               │                      │
│                                               │ Model:               │
│                                               │ meta-llama/...       │
│                                               │                      │
│                                               │ Messages:            │
│                                               │ - system: prompt     │
│                                               │ - user: full prompt  │
│                                               │   (with cta_section) │
│                                               └──────────┬───────────┘
│                                                          │
│                                                          ↓
│                                               ┌──────────────────────┐
│                                               │ Groq Response        │
│                                               │                      │
│                                               │ Expected:            │
│                                               │ {                    │
│                                               │   "slides": [{...}], │
│                                               │   "caption": "...",  │
│                                               │   "hashtags": [...]  │
│                                               │ }                    │
│                                               │                      │
│                                               │ FINAL SLIDE should   │
│                                               │ contain exact CTA    │
│                                               │ text from database   │
│                                               │                      │
│                                               │ [Parsed to           │
│                                               │  PostContent]        │
│                                               └──────────┬───────────┘
│                                                          │
└──────────────────────────────────────────────────────────┼──────────┘
                                                           │
                                                           ↓
                                                  ┌─────────────────┐
                                                  │ Response to     │
                                                  │ Frontend        │
                                                  │                 │
                                                  │ Return Posts    │
                                                  │ with CTA in     │
                                                  │ final slide     │
                                                  └─────────────────┘
```

---

## Potential Cut-off Points Analysis

### 🔴 **POINT 1: Frontend - CTA Selection Not Updating State**

**Location**: `CtaNode.tsx` → `setSelectedCta`

**Symptoms**:
- CTA dropdown appears to select, but `selectedCta` remains null
- Console log shows ctaId as null/undefined

**Causes**:
1. CtaNode `onCtaSelect` callback not wired correctly
2. Workflow component not passing callback to CtaNode
3. Generate page not updating state when parent calls callback

**Check**:
```javascript
// In browser console:
console.log('selectedCta state:', selectedCta);
// Should show UUID if CTA selected
```

**Fix**:
- Verify CtaNode receives `onCtaSelect` prop
- Verify Workflow passes callback: `onCtaSelect={setSelectedCta}`
- Check React DevTools state inspector

---

### 🟡 **POINT 2: Frontend - Generation Handler Missing CTA**

**Location**: `generate/page.tsx` line 141

**Symptoms**:
- CTA is selected in UI, but mutation doesn't receive it
- Console log shows ctaId as undefined

**Causes**:
1. `selectedCta` state not being read correctly
2. `ctaId: selectedCta || undefined` evaluates to undefined
3. State not synced between CtaNode and handleGenerate

**Check**:
```javascript
// Debug in generate page
console.log('selectedCta in handleGenerate:', selectedCta);
// Should match the selected CTA ID
```

**Fix**:
- Ensure `selectedCta` state is properly scoped
- Check if Workflow is managing its own state vs parent state
- Verify CtaNode callback updates parent, not local state

---

### 🔴 **POINT 3: API Client - CTA Not in Request Body**

**Location**: `backendGenerationClient.ts` line 43

**Symptoms**:
- ctaId received by frontend, but not in POST body
- Network tab shows payload without `cta_id` field

**Causes**:
1. ctaId filtered out before sending
2. Request body builder not including ctaId
3. Axios transformation removing field

**Check**:
```javascript
// Browser DevTools → Network tab
// Find POST to /api/generate/post/auto
// View Request payload
// Should contain: "cta_id": "..."
```

**Fix**:
- Verify request object construction includes ctaId
- Check no middleware is stripping the field
- Ensure axios headers/interceptors not filtering payload

---

### 🟡 **POINT 4: Backend - CTA ID Not in Request Model**

**Location**: `generate.py` line ~24

**Symptoms**:
- Backend logs show: `Request {'template': ..., 'brand_id': ...}`
- No `cta_id` in printed request

**Causes**:
1. Request body not matching Pydantic model
2. Field name mismatch (cta_id vs ctaId)
3. Model definition missing Optional field

**Check**:
```python
# Check model definition
class GeneratePostAutoRequest(BaseModel):
    cta_id: Optional[str] = None  # Should be there
```

**Fix**:
- Verify `GeneratePostAutoRequest` includes `cta_id` field
- Field must be `Optional[str] = None` (not required)

---

### 🔴 **POINT 5: Backend - CTA Not Fetched from Database**

**Location**: `generate.py` line ~43

**Symptoms**:
- Debug log: `[DEBUG] Fetching CTA with ID:` doesn't appear
- request.cta_id is None or not being checked

**Causes**:
1. Request parsing failed - cta_id not extracted
2. Condition `if request.cta_id:` evaluates to False
3. get_brand_cta function doesn't exist/is broken

**Check**:
```python
# Add this line in endpoint:
print(f"[DEBUG] request.cta_id = {request.cta_id}")
```

**Fix**:
- Ensure request is parsed correctly
- Verify `if request.cta_id:` is checking correct field
- Ensure `get_brand_cta` function exists and imports work

---

### 🟡 **POINT 6: Backend - CTA Not Passed to Service**

**Location**: `generate.py` line ~54

**Symptoms**:
- CTA fetched successfully (logs show it)
- But service doesn't receive it
- `cta` parameter not in function call

**Causes**:
1. `cta` variable not accessible in scope
2. CTA dict is None even though query succeeded
3. Function call missing `cta=cta` parameter

**Check**:
```python
# Verify parameter passing
posts = generate_slideshows(
    ...,
    cta=cta  # Must be here
)
```

**Fix**:
- Ensure `cta = get_brand_cta(...)` assigns to correct variable
- Verify `generate_slideshows` call includes `cta=cta`
- Check indentation - might be inside wrong if block

---

### 🔴 **POINT 7: Service - CTA Not Passed to Prompt Generator**

**Location**: `slide_generation.py` line ~37

**Symptoms**:
- CTA dict exists but isn't passed downstream
- `generate_slideshow_auto` call missing `cta` parameter

**Causes**:
1. Function signature doesn't accept `cta` parameter
2. Parameter passed but not included in call
3. Wrong parameter name (e.g., `cts` vs `cta`)

**Check**:
```python
# Verify call includes cta
post_content_list = generate_slideshow_auto(
    slideshowGoals=prompt,
    brandSettings=brand_settings,
    count=count,
    cta=cta  # Must be here
)
```

**Fix**:
- Update function signature to include `cta: dict = None`
- Include `cta=cta` in downstream call

---

### 🟡 **POINT 8: Prompt Generator - CTA Not Passed to Prompt Builder**

**Location**: `generate_slideshow.py` line ~31

**Symptoms**:
- Debug log: `[DEBUG] CTA in generate_slideshow_auto:` shows None
- CTA exists in service but not in auto function

**Causes**:
1. `cta` not in function signature
2. Called as positional arg but expecting keyword
3. Service not passing it at all

**Check**:
```python
def generate_slideshow_auto(
    ...,
    cta: Optional[dict] = None  # Must be here
):
```

**Fix**:
- Add `cta: Optional[dict] = None` to function signature
- Ensure service calls with `cta=cta` (keyword argument)

---

### 🔴 **POINT 9: Prompt Builder - CTA Not Injected**

**Location**: `generate_slideshow.py` line ~193

**Symptoms**:
- Debug logs show CTA exists
- But `[INFO] Injecting CTA` log doesn't appear
- Prompt doesn't contain CTA section

**Causes**:
1. `if cta:` condition fails even though cta exists
2. CTA dict is empty (all fields None/empty)
3. cta_section not being built
4. cta_section not injected into prompt

**Check**:
```python
# Verify condition
if cta:
    print(f"[DEBUG] CTA found: {cta}")
    # Build cta_section
    
# Check returned prompt includes cta_section
return f"""...{cta_section}..."""
```

**Fix**:
- Verify `if cta:` is True (not just checking it's not None)
- Ensure cta_section is built correctly
- Verify cta_section is in return statement: `{cta_section}`

---

### 🟡 **POINT 10: Prompt - CTA Gets Cut Off**

**Location**: `generate_slideshow.py` line ~31 (prompt length check)

**Symptoms**:
- CTA injected into prompt
- But Groq response doesn't follow CTA instruction
- Final slide missing CTA text

**Causes**:
1. Prompt is too long, CTA section truncated by Groq
2. CTA instructions placed near token limit
3. max_completion_tokens too small

**Check**:
```python
# Monitor this debug log
print(f"[DEBUG] Full prompt length: {len(prompt)} characters")
# If > 8000 chars, might be truncated
```

**Fix**:
- Shorter CTA section text
- Move CTA higher in prompt (near beginning)
- Increase max_completion_tokens in Groq call
- Reduce other prompt sections

---

### 🔴 **POINT 11: Groq - Ignores CTA Override**

**Location**: `generate_slideshow.py` (Groq response)

**Symptoms**:
- Prompt has CTA override instructions
- Groq response includes different CTA or no CTA
- Final slide doesn't match specified CTA

**Causes**:
1. CTA instruction not clear enough
2. Groq model doesn't understand "PRIORITY"
3. Template CTA conflicts with override
4. Groq has contradictory instructions

**Check**:
```python
# Look at final slide in response
print(f"Final slide content: {generated_data[-1]}")
# Should contain exact cta_text value
```

**Fix**:
- Use stronger language: "MUST", "FINAL", "DO NOT MODIFY"
- Put CTA instruction at top of prompt
- Remove template CTA if conflicting
- Use exact quotes: `"{cta_text}"`

---

## Debug Checklist

Use this systematic checklist to isolate where CTA is getting cut off:

```
Frontend Selection:
[ ] CtaNode dropdown shows CTA options
[ ] Can select a CTA
[ ] selectedCta state updates (console log)
[ ] [DEBUG] Generate mutation params shows ctaId

API Request:
[ ] [DEBUG] API Client sending request shows ctaId
[ ] Network tab shows cta_id in POST body
[ ] No 401/403 auth errors

Backend Receipt:
[ ] [DEBUG] Fetching CTA with ID: appears in logs
[ ] [DEBUG] CTA fetched: shows full dict
[ ] No 404 "CTA not found" errors

Backend Processing:
[ ] [DEBUG] CTA in generate_slideshow_auto: shows dict
[ ] [DEBUG] Full prompt length: shows reasonable size (2000+)
[ ] [INFO] Injecting CTA: appears in logs

Groq Generation:
[ ] prompt contains "*** PRIORITY CTA OVERRIDE ***"
[ ] "Final slide MUST include this exact CTA"
[ ] "Do NOT replace or modify this CTA text"
[ ] Gemini response 2: final slide contains cta_text

Result:
[ ] Generated post's final slide has selected CTA
[ ] Exact text matches database cta_text field
[ ] CTA URL is present (if provided)
```

---

## Quick Fix Priority

| Priority | Issue | Fix Time |
|----------|-------|----------|
| 🔴 CRITICAL | CTA selection not updating state | 5 min |
| 🔴 CRITICAL | CTA not in request body | 5 min |
| 🔴 CRITICAL | CTA not fetched from DB | 10 min |
| 🔴 CRITICAL | CTA not in prompt | 5 min |
| 🟡 MEDIUM | CTA prompt too long | 10 min |
| 🟡 MEDIUM | CTA format unclear to Groq | 15 min |

Check critical items first - they completely block the feature.

