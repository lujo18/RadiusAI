# CTA Data Flow Path - Detailed Trace

## Summary
The CTA should flow through the following path from CtaNode selection to Groq prompt injection. I've added debug logging at each step to help identify where it might be getting cut off.

---

## Step-by-Step Data Flow with Debug Points

### **STEP 1: User Selects CTA in CtaNode**
```
File: frontend/src/components/workflows/common/CtaNode.tsx
Location: Dropdown onChange handler
What happens:
  └─ onCtaSelect(cta.id)  ← Calls parent's onCtaSelect callback
```

### **STEP 2: Generate Page State Updated**
```
File: frontend/src/app/(app)/brand/[brandId]/generate/page.tsx
Location: Line ~195
State: setSelectedCta(ctaId)

Verification:
  └─ Check: selectedCta state should have the UUID
```

### **STEP 3: Workflow Props Passed**
```
File: frontend/src/app/(app)/brand/[brandId]/generate/page.tsx
Location: Line ~198-200
Code:
  <Workflow
    selectedCtaId={selectedCta}
    onCtaSelect={setSelectedCta}
    handleGenerate={handleGenerate}
  />

Verification:
  └─ selectedCtaId should equal selectedCta state value
```

### **STEP 4: User Clicks Generate Button**
```
File: frontend/src/app/(app)/brand/[brandId]/generate/page.tsx
Location: handleGenerate() function (line ~75)

What happens:
  1. Checks selectedTemplate is set
  2. Creates request ID in queue
  3. Fetches rawTemplate and brand
  4. Builds mutation params:

    ┌─ generateMutation.mutateAsync({
    │    template,
    │    brandSettings,
    │    brandId: selectedProfile,
    │    ctaId: selectedCta || undefined,  ← LINE 141
    │    count: 1,
    └─ })

Debug Logging Added:
  └─ console.log('[DEBUG] Generate mutation params:', { templateId, ctaId, brandId })
```

### **STEP 5: Mutation Hook Processing**
```
File: frontend/src/lib/api/generation/hooks/useGeneratePost.ts
Location: useGeneratePostFromPrompt() function (line ~28-48)

What happens:
  1. Receives params object with ctaId field
  2. Calls service function:
    
    └─ postGenerationService.generateFromTemplateAuto(
         params.template,
         params.brandSettings,
         params.brandId,
         params.count,
         params.ctaId  ← PASSED HERE
       )
```

### **STEP 6: Service Layer Processing**
```
File: frontend/src/lib/api/generation/services/postGenerationService.ts
Location: generateFromTemplateAuto() function (line ~27-41)

What happens:
  1. Extracts ctaId from params
  2. Calls API client with full payload:

    └─ backendGenerationClient.generatePostsFromPrompt({
         template: params.template,
         brandSettings: params.brandSettings,
         brandId: params.brandId,
         count: params.count,
         ctaId: params.ctaId  ← PASSED HERE
       })
```

### **STEP 7: API Client Request**
```
File: frontend/src/lib/api/generation/clients/backendGenerationClient.ts
Location: generatePostsFromPrompt() function (line ~28-52)

What happens:
  1. Extracts session token
  2. Builds request body:
    
    {
      template: payload.template,
      brand_settings: payload.brandSettings,
      brand_id: payload.brandId,
      cta_id: payload.ctaId,  ← SENT TO BACKEND
      count: payload.count,
    }
  
  3. Sends POST to: /api/generate/post/auto

Debug Logging Added:
  ├─ console.log('[DEBUG] API Client sending request:', { ctaId, brandId })
  └─ console.log('[DEBUG] API Client response received')
```

### **STEP 8: Backend Endpoint Receives Request**
```
File: backend/routers/generate.py
Location: generate_post_content_from_prompt() endpoint (line ~34)

Request Model (GeneratePostAutoRequest):
  {
    template: Template,
    brand_settings: BrandSettings,
    brand_id: str,
    cta_id: Optional[str] = None,  ← RECEIVED HERE
    count: int = 1
  }

What happens:
  if request.cta_id:
      cta = get_brand_cta(request.cta_id)  ← FETCH FROM DB

Debug Logging Added:
  ├─ print(f"[DEBUG] Fetching CTA with ID: {request.cta_id}")
  ├─ print(f"[DEBUG] CTA fetched: {cta}")
  └─ Continues if found, 404 if not found
```

### **STEP 9: CTA Passed to Slide Generation**
```
File: backend/routers/generate.py
Location: Line ~54-59

What happens:
  posts = generate_slideshows(
      user_id=user_id,
      brand_id=request.brand_id,
      template=request.template,
      brand_settings=request.brand_settings,
      count=request.count,
      cta=cta  ← PASSED HERE (dict or None)
  )
```

### **STEP 10: Slide Generation Service Receives CTA**
```
File: backend/services/slides/slide_generation.py
Location: generate_slideshows() function (line ~17)

Function signature:
  def generate_slideshows(
    ...,
    cta: dict = None  ← RECEIVES HERE
  )

What happens:
  post_content_list = generate_slideshow_auto(
      slideshowGoals=prompt,
      brandSettings=brand_settings,
      count=count,
      cta=cta  ← PASSED HERE
  )
```

### **STEP 11: Slideshow Auto Generation Receives CTA**
```
File: backend/services/genai/generate_slideshow.py
Location: generate_slideshow_auto() function (line ~16)

Function signature:
  def generate_slideshow_auto(
    slideshowGoals: str,
    brandSettings: BrandSettings,
    count: int = 1,
    cta: Optional[dict] = None  ← RECEIVES HERE
  )

What happens:
  prompt = _generate_prompt(
      layout_options,
      slideshowGoals,
      brandSettings,
      count,
      template_structure=None,
      cta=cta  ← PASSED HERE
  )

Debug Logging Added:
  ├─ print(f"[DEBUG] CTA in generate_slideshow_auto: {cta}")
  └─ print(f"[DEBUG] Full prompt length: {len(prompt)} characters")
```

### **STEP 12: Prompt Builder Injects CTA**
```
File: backend/services/genai/generate_slideshow.py
Location: _generate_prompt() function (line ~185)

Function signature:
  def _generate_prompt(
    ...,
    cta: Optional[dict] = None  ← RECEIVES HERE
  )

What happens:
  1. Checks if cta is provided:
  
    if cta:
        cta_text = cta.get('cta_text', '')
        cta_url = cta.get('cta_url', '')
        
        logger.info(f"Injecting CTA - Text: {cta_text}, URL: {cta_url}")
        
        cta_section = f"""
*** PRIORITY CTA OVERRIDE ***
Final slide MUST include this exact CTA: "{cta_text}"
CTA URL: {cta_url if cta_url else 'N/A'}
Do NOT replace or modify this CTA text."""

  2. Injects into prompt template:
  
    return f""" 
SLIDESHOW STRUCTURE:
{slideshowGoals}

{template_section}{cta_section}  ← CTA INJECTED HERE

BRAND VOICE:
...rest of prompt...
"""

Debug Logging Added:
  └─ logger.info(f"Injecting CTA - Text: {cta_text}, URL: {cta_url}")
```

### **STEP 13: Prompt Sent to Groq**
```
File: backend/services/genai/generate_slideshow.py
Location: groq.chat.completions.create() call (line ~56)

What happens:
  response = groq.chat.completions.create(
      model="meta-llama/llama-4-maverick-17b-128e-instruct",
      messages=[
          {
              "role": "system",
              "content": SYSTEM_PROMPT
          },
          {
              "role": "user",
              "content": prompt  ← CONTAINS CTA SECTION
          },
      ],
      ...
  )

The prompt now contains:
  *** PRIORITY CTA OVERRIDE ***
  Final slide MUST include this exact CTA: "..."
  CTA URL: ...
  Do NOT replace or modify this CTA text.
```

### **STEP 14: Groq Generates Response**
```
File: backend/services/genai/generate_slideshow.py
Location: Response parsing (line ~129)

What happens:
  response_text = response.choices[0].message.content
  generated_data = json.loads(response_text)
  
  Expected structure:
  {
    "slides": [
      {...},
      {...},
      {
        "slide_number": 7,
        "layout_type": "cta",
        "text_elements": {
          "text-123": "Subscribe to get exclusive updates"  ← CTA TEXT
        }
      }
    ],
    "caption": "...",
    "hashtags": [...],
    "background_query": "..."
  }

Debug Logging:
  └─ print("Gemini response 2:", generated_data)
```

---

## Debugging Instructions

### Check Frontend Console (Browser DevTools)
```
Open DevTools → Console tab
Generate a post
Look for:
  [DEBUG] Generate mutation params: { templateId, ctaId, brandId }
  [DEBUG] API Client sending request: { ctaId, brandId }
  [DEBUG] API Client response received

If ctaId is null/undefined:
  → Problem is in CtaNode selection or state management
```

### Check Backend Terminal
```
Where uvicorn is running
Generate a post
Look for in order:
  1. [DEBUG] Fetching CTA with ID: {id}
  2. [DEBUG] CTA fetched: {dict with cta_text, cta_url}
  3. [DEBUG] CTA in generate_slideshow_auto: {same dict}
  4. [DEBUG] Full prompt length: XXXX characters
  5. [INFO] Injecting CTA - Text: {...}, URL: {...}
  6. Gemini response 2: {...slides...}

If step 1-2 missing:
  → CTA ID not reaching backend
  
If step 5 missing:
  → CTA dict exists but not injected into prompt
  
If CTA text missing in step 6:
  → Groq didn't follow the priority instruction
```

---

## Common Cut-Off Points

| Point | Symptom | Check |
|-------|---------|-------|
| **Frontend** | ctaId is null in console | Is CTA selected in CtaNode dropdown? |
| **API Client** | ctaId null in request payload | Check selectedCta state value |
| **Backend Fetch** | No "[DEBUG] Fetching CTA" log | Is cta_id in request body? |
| **CTA Database** | "[DEBUG] CTA fetched: null" | Does CTA ID exist in database? |
| **Prompt Injection** | No "[INFO] Injecting CTA" log | Is cta dict being passed? |
| **Groq Response** | CTA text missing in final slide | Check prompt length - might be truncated |

---

## Testing Checklist

- [ ] Start backend: `uvicorn backend.main:app --reload`
- [ ] Open frontend: `npm run dev`
- [ ] Navigate to Generate page
- [ ] Create a test CTA first (if not done)
- [ ] Select CTA from CtaNode dropdown
- [ ] Open browser DevTools → Console
- [ ] Click Generate
- [ ] Check console for `[DEBUG]` logs
- [ ] Check backend terminal for `[DEBUG]` and `[INFO]` logs
- [ ] Verify final slide contains selected CTA text

---

## Key Variables to Monitor

| Variable | Location | Expected Value |
|----------|----------|-----------------|
| `selectedCta` | Generate page state | UUID string or null |
| `payload.ctaId` | API Client params | UUID string or undefined |
| `request.cta_id` | Backend endpoint | UUID string or None |
| `cta` | Backend dict | `{cta_text, cta_url, ...}` or None |
| `cta_section` | Prompt builder | String with CTA override text or empty |
| `prompt` | Groq input | Full string including cta_section |
| Final slide text | Groq response | Should contain exact `cta_text` value |

