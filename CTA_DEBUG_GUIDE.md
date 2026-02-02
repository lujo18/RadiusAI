# CTA Data Flow Debugging Guide

## Complete Code Path Trace

### 1. **Frontend: CtaNode Selection** 
```
File: frontend/src/components/workflows/common/CtaNode.tsx
├─ User selects CTA from dropdown (fetched via useBrandCtas hook)
├─ Sets ctaId in workflow state
└─ Value flows to parent Workflow component
```

### 2. **Frontend: Generate Page**
```
File: frontend/src/app/(app)/brand/[brandId]/generate/page.tsx (line ~145)
├─ Receives selectedCta from Workflow
├─ On handleGenerate():
│  └─ ctaId: selectedCta || undefined
└─ Passes to useGeneratePostFromPrompt mutation
```

### 3. **Frontend: Mutation Hook**
```
File: frontend/src/lib/api/generation/hooks/useGeneratePost.ts (line ~32)
├─ Function: useGeneratePostFromPrompt()
├─ Params received:
│  ├─ ctaId?: string
│  └─ [other params: template, brandSettings, brandId, count]
└─ Calls: postGenerationService.generateFromTemplateAuto(..., params.ctaId)
```

### 4. **Frontend: Service Layer**
```
File: frontend/src/lib/api/generation/services/postGenerationService.ts (line ~27)
├─ Function: generateFromTemplateAuto()
├─ Signature: (template, brandSettings, brandId, count, ctaId?)
├─ Extracts ctaId from params
└─ Calls: backendGenerationClient.generatePostsFromPrompt({...ctaId})
```

### 5. **Frontend: API Client**
```
File: frontend/src/lib/api/generation/clients/backendGenerationClient.ts (line ~28)
├─ Function: generatePostsFromPrompt()
├─ Sends POST to ${API_BASE}/api/generate/post/auto
├─ Request body includes:
│  ├─ template
│  ├─ brand_settings  
│  ├─ brand_id
│  ├─ cta_id: payload.ctaId  ← **CTA SENT HERE**
│  └─ count
└─ Returns posts array
```

### 6. **Backend: FastAPI Endpoint**
```
File: backend/routers/generate.py (line ~34)
├─ Endpoint: POST /api/generate/post/auto
├─ Request model: GeneratePostAutoRequest
│  ├─ template: Template
│  ├─ brand_settings: BrandSettings
│  ├─ brand_id: str
│  ├─ count: int = 1
│  └─ cta_id: Optional[str] = None  ← **RECEIVED HERE**
├─ If request.cta_id:
│  ├─ cta = get_brand_cta(request.cta_id)  ← **FETCHES FROM DB**
│  ├─ Logs: [DEBUG] Fetching CTA with ID: {cta_id}
│  ├─ Logs: [DEBUG] CTA fetched: {cta}
│  └─ If not found: HTTPException 404
└─ Passes: generate_slideshows(..., cta=cta)
```

### 7. **Backend: Slide Generation Service**
```
File: backend/services/slides/slide_generation.py (line ~17)
├─ Function: generate_slideshows()
├─ Signature: (..., cta: dict = None)
├─ Receives CTA from endpoint
└─ Passes: generate_slideshow_auto(..., cta=cta)
```

### 8. **Backend: Slideshow Auto Generation**
```
File: backend/services/genai/generate_slideshow.py (line ~16)
├─ Function: generate_slideshow_auto()
├─ Signature: (..., cta: Optional[dict] = None)
├─ Receives CTA
├─ Logs: [DEBUG] CTA in generate_slideshow_auto: {cta}
├─ Calls: _generate_prompt(..., cta=cta)
├─ Logs: [DEBUG] Full prompt length: {len} characters
└─ Sends prompt to Groq API
```

### 9. **Backend: Prompt Builder**
```
File: backend/services/genai/generate_slideshow.py (line ~185)
├─ Function: _generate_prompt()
├─ Signature: (..., cta: Optional[dict] = None)
├─ If cta provided:
│  ├─ cta_text = cta.get('cta_text', '')
│  ├─ cta_url = cta.get('cta_url', '')
│  ├─ Logs: [INFO] Injecting CTA - Text: {text}, URL: {url}
│  ├─ Builds cta_section:
│  │  ```
│  │  *** PRIORITY CTA OVERRIDE ***
│  │  Final slide MUST include this exact CTA: "{cta_text}"
│  │  CTA URL: {cta_url}
│  │  Do NOT replace or modify this CTA text.
│  │  ```
│  └─ cta_section inserted into prompt template
└─ Returns: complete prompt with CTA section
```

### 10. **Backend: Groq API Call**
```
File: backend/services/genai/generate_slideshow.py (line ~56)
├─ Calls: groq.chat.completions.create()
├─ Model: meta-llama/llama-4-maverick-17b-128e-instruct
├─ Messages:
│  ├─ System: SYSTEM_PROMPT
│  └─ User: prompt (includes cta_section if provided)
├─ Response Format: JSON schema
└─ Returns: generated carousel with slides
```

---

## Debug Checklist

### ✅ Frontend Verification
- [ ] Open browser DevTools → Network tab
- [ ] Filter by "post/auto" requests
- [ ] Click "Generate" button
- [ ] Inspect Request Payload:
  ```json
  {
    "template": {...},
    "brand_settings": {...},
    "brand_id": "...",
    "cta_id": "..."    ← Should be populated if CTA selected
  }
  ```

### ✅ Backend Verification  
- [ ] Check terminal logs where backend is running:
  ```
  [DEBUG] Fetching CTA with ID: {cta_id}
  [DEBUG] CTA fetched: {...cta_text, cta_url...}
  [DEBUG] CTA in generate_slideshow_auto: {...}
  [DEBUG] Full prompt length: XXXX characters
  ```

### ✅ CTA Injection Verification
- [ ] Look for in logs:
  ```
  [INFO] Injecting CTA - Text: {...}, URL: {...}
  ```
- [ ] Check the final prompt sent to Groq includes:
  ```
  *** PRIORITY CTA OVERRIDE ***
  Final slide MUST include this exact CTA: "..."
  ```

### ✅ Groq Response Verification
- [ ] Generated carousel final slide should contain:
  - The exact CTA text from the database
  - The CTA URL (if provided)
  - Format: typically in the last slide's text elements

---

## Common Issues & Fixes

### Issue 1: CTA ID Not Sent
**Symptom**: `[DEBUG] Fetching CTA with ID:` doesn't appear in logs
**Check**:
1. CtaNode dropdown - is a CTA actually selected?
2. Browser DevTools - payload includes `cta_id`?
3. Fix: Make sure CtaNode has `onChange` handler to update parent state

### Issue 2: CTA Fetched But Not in Prompt
**Symptom**: Logs show CTA fetched, but not in final slide
**Check**:
1. Is `[INFO] Injecting CTA` appearing in logs?
2. Is prompt length reasonable (should be 2000+ characters)?
3. Fix: Check if prompt is being truncated before sending to Groq

### Issue 3: CTA Text Malformed
**Symptom**: CTA appears but with formatting issues
**Check**:
1. Database value has special characters?
2. Check: `cta.get('cta_text', '')` for actual value
3. Fix: Sanitize special chars in prompt builder

### Issue 4: Multiple CTA Sections
**Symptom**: CTA appears twice in prompt
**Check**:
1. Is template also containing CTA instructions?
2. Fix: Make priority override clear in prompt

---

## Quick Debugging Test

Run this in backend terminal to test end-to-end:

```bash
# 1. Check CTA exists in database
curl -X GET "http://localhost:8000/api/brands/{brand_id}/ctas" \
  -H "Authorization: Bearer {token}"

# 2. Manually call generate with CTA ID
curl -X POST "http://localhost:8000/api/generate/post/auto" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "template": {...},
    "brand_settings": {...},
    "brand_id": "...",
    "cta_id": "your_cta_id",
    "count": 1
  }'

# 3. Check logs for:
# [DEBUG] Fetching CTA with ID: ...
# [DEBUG] CTA fetched: {...}
# [INFO] Injecting CTA - Text: ..., URL: ...
```

---

## Log Locations

| Component | Log Output |
|-----------|-----------|
| Frontend API Client | Browser Console → Network tab |
| Backend Endpoint | Terminal where `uvicorn` is running |
| CTA Fetching | Terminal → `[DEBUG] Fetching CTA` |
| Prompt Building | Terminal → `[INFO] Injecting CTA` |
| Full Prompt | Terminal → `[DEBUG] Full prompt length` |
| Groq Response | Terminal → `Gemini response 1:` (JSON) |

---

## Expected Output Format

When CTA is properly integrated, Groq response should have:
```json
{
  "slides": [
    {...},
    {...},
    {
      "slide_number": 7,
      "layout_type": "cta",
      "text_elements": {
        "text-123": "Subscribe to get exclusive updates"
      }
    }
  ],
  "caption": "...",
  "hashtags": [...],
  "background_query": "..."
}
```

The final slide should **always** contain the exact CTA text provided.

