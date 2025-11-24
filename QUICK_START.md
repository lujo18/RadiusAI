# Quick Start Guide - Template A/B Testing System

## 🚀 Getting Started in 5 Minutes

### 1. Install Required Packages

#### Frontend (Already Installed ✅)
```bash
cd frontend
# Already have: @tanstack/react-query, zustand, firebase
```

#### Backend
```bash
cd backend
pip install google-generativeai firebase-admin
```

### 2. Set Up Environment Variables

Create `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id

# Get Gemini API Key:
# https://aistudio.google.com/app/apikey

# Firebase service account JSON:
# Firebase Console → Project Settings → Service Accounts → Generate New Key
```

### 3. Initialize Firebase Admin (Backend)

Create `backend/firebase_admin.py`:
```python
import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase Admin
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()
```

### 4. Test Template Creation (Frontend)

1. Run frontend: `npm run dev`
2. Navigate to Dashboard → Templates
3. Click "Create Template"
4. Choose "Listicle" category
5. Name it "Bold Questions Test"
6. Customize colors and fonts
7. Set forbidden words: `["journey", "game-changer", "unlock"]`
8. Save

### 5. Test Gemini Generation (Backend)

```python
# backend/test_gemini.py
from gemini_service import generate_content_with_gemini
from models import Template, StyleConfig, LayoutConfig, VisualConfig, ContentRules
from types import Template as TemplateType

# Create test template
test_template = Template(
    id="test_123",
    userId="user_123",
    name="Test Template",
    category="listicle",
    status="active",
    styleConfig=StyleConfig(
        layout=LayoutConfig(
            slideCount=7,
            aspectRatio="9:16",
            structure=["hook", "intro", "point", "point", "point", "point", "cta"]
        ),
        visual=VisualConfig(
            background={"type": "gradient", "colors": ["#0f0f0f", "#1a1a1a"], "opacity": 0.9},
            font={"family": "Inter Bold", "size": 48, "color": "#ffffff", "effects": []},
            accentColor="#ff4f8b"
        ),
        content=ContentRules(
            tone="direct",
            hookStyle="question",
            useEmojis=True,
            ctaTemplate="Save this!",
            forbiddenWords=["journey"]
        )
    ),
    performance={"totalPosts": 0, "avgEngagementRate": 0},
    createdAt="2025-11-23",
    updatedAt="2025-11-23"
)

# Generate content
topic = "10 productivity tips for remote workers"
carousels = generate_content_with_gemini(test_template, topic, count=1)

print("Generated Carousel:")
for slide in carousels[0].slides:
    print(f"Slide {slide.slideNumber}: {slide.text}")
print(f"Caption: {carousels[0].caption}")
print(f"Hashtags: {', '.join(carousels[0].hashtags)}")
```

Run: `python test_gemini.py`

## 📊 How to Use the System

### Workflow 1: Create Your First Template

```
1. Dashboard → Templates
2. Click "Create Template"
3. Step 1: Choose category and name
   - Category: Listicle (for "7 tips" style posts)
   - Name: "My First Template"
   - Set as default: ✅

4. Step 2: Visual Style
   - Background: Gradient
   - Colors: #0f0f0f → #1a1a1a
   - Font: Inter Bold, 48pt
   - Accent: #ff4f8b
   - Aspect Ratio: 9:16 (Stories)

5. Step 3: Content Rules
   - Tone: Direct
   - Hook: Question ("Want to know...?")
   - Emojis: ✅ Yes
   - CTA: "Save this for later!"
   - Forbidden: "journey, game-changer, unlock"
   - Slides: 7

6. Click "Save Template" ✅
```

### Workflow 2: Run Your First A/B Test

```
1. Create 3 Template Variants:
   - Variant A: Question hooks
   - Variant B: Statement hooks  
   - Variant C: Number hooks
   (Same visual style, different hook styles)

2. Dashboard → A/B Testing → Create Test
3. Fill out:
   - Name: "Week 47 - Hook Test"
   - Select Templates: A, B, C
   - Posts per Template: 14 (7 days × 2 platforms)
   - Duration: 7 days

4. System generates 42 posts (14 × 3 templates)
5. Posts auto-schedule across the week
6. After 7 days, click "Analyze Results"
7. View winner with confidence score
8. Click "Apply Winner" to set as default
```

### Workflow 3: Generate Week's Content

```python
# Backend endpoint: POST /api/generate/week
{
  "templateId": "template_123",
  "topics": [
    "5 morning habits that changed my life",
    "The truth about productivity",
    "Why you procrastinate",
    "3 books that shift mindset",
    "Double your income strategy",
    "Biggest entrepreneur mistake",
    "Wake up at 5 AM trick"
  ],
  "platforms": ["instagram", "tiktok"]
}

# Returns: 14 posts (7 × 2 platforms)
```

## 🎯 Common Use Cases

### Use Case 1: Perfect Your Hook Style
```
Problem: Not sure if questions or numbers work better
Solution: Create 2 templates with identical settings except hook style
Test: Generate 14 posts each, compare saves
Winner: Use that hook style as default
```

### Use Case 2: Optimize Visual Style
```
Problem: Should backgrounds be dark or light?
Solution: Create 2 templates - dark gradient vs light solid
Test: Same content, different visuals
Winner: Apply to all future templates
```

### Use Case 3: Find Best CTA
```
Problem: Which CTA drives more saves?
Templates:
  A: "Save this for later!"
  B: "Follow for more tips!"
  C: "Share with a friend!"
Test: 14 posts each
Winner: Use in all templates
```

## 🔍 How to Read Analytics

### Template Performance Card
```
Bold Questions Template
------------------------
Total Posts: 42
Avg Engagement: 8.4% ← Higher is better
Avg Saves: 680 ← Primary metric
Avg Shares: 92

Interpretation:
- 680 saves = Strong retention
- 8.4% engagement = Above average
- Use as default ✅
```

### A/B Test Results
```
Variant A: 320 saves
Variant B: 680 saves ← WINNER
Variant C: 420 saves

Confidence: 94% ← High confidence

Insight: Variant B outperformed by 42%
Action: Set Variant B as default
```

## 📝 Gemini Prompt Anatomy

Your template generates this prompt:

```
You are a viral social media content creator.

TEMPLATE: Bold Questions
CATEGORY: listicle

VISUAL REQUIREMENTS:
- Background: gradient using colors #0f0f0f, #1a1a1a
- Font: Inter Bold at 48pt
- Accent color: #ff4f8b

SLIDE STRUCTURE: hook → intro → point → point → point → point → cta

CONTENT RULES:
- Tone: direct
- Hook style: question (e.g., "Want to know the secret?")
- Emojis: Include relevant emojis
- CTA: "Save this for later!"
- FORBIDDEN WORDS: journey, game-changer, unlock

OUTPUT FORMAT (JSON):
{
  "slides": [...],
  "caption": "...",
  "hashtags": [...]
}

Topic: 10 productivity tips for remote workers
```

Gemini returns structured JSON that follows ALL rules.

## 🚨 Troubleshooting

### Issue: Gemini returns forbidden words
```python
# Add validation check
is_valid, violations = validate_gemini_response(carousel, template)
if not is_valid:
    print(violations)
    # Regenerate with stricter prompt
```

### Issue: Wrong slide count
```python
# Check template config
assert template.styleConfig.layout.slideCount == len(carousel.slides)
```

### Issue: Template not saving
```typescript
// Check Firebase permissions
// Firestore Rules → templates collection → allow write if authenticated
```

### Issue: Analytics not updating
```javascript
// Check Cloud Function deployment
// Or manually trigger aggregation:
await updateTemplatePerformance(templateId, metrics);
```

## 📊 Performance Benchmarks

### Good Engagement Rates
- Instagram Carousel: 6-10% engagement
- TikTok: 8-15% engagement
- Saves: >300 per post = excellent
- Shares: >50 per post = viral potential

### Template Testing
- Minimum: 10 posts per variant
- Recommended: 14-21 posts per variant
- Confidence threshold: >85% to declare winner

### A/B Test Duration
- Short: 3-5 days (quick insights)
- Standard: 7 days (full week)
- Extended: 14 days (seasonal trends)

## 🎓 Tips for Success

1. **Start with One Template**: Perfect it before creating variants
2. **Test One Variable**: Hook style OR visual OR tone, not all
3. **Use Same Topics**: Fair comparison requires same content topics
4. **Track Everything**: Every post should reference a template
5. **Iterate Winners**: Clone winning templates and test small tweaks
6. **Build Forbidden Words List**: Collect overused phrases to avoid
7. **Platform-Specific Templates**: Instagram vs TikTok need different styles
8. **Seasonal Variants**: Duplicate templates for holidays/events

## 🔗 Resources

- **Gemini API Docs**: https://ai.google.dev/docs
- **Firebase Firestore**: https://firebase.google.com/docs/firestore
- **TanStack Query**: https://tanstack.com/query/latest/docs/react
- **Architecture Doc**: `TEMPLATE_SYSTEM_ARCHITECTURE.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`

---

**Ready to create your first template? Go to Dashboard → Templates! 🚀**
