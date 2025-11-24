# SlideForge Template System Architecture

## 🏗️ Firestore Data Structure

```
users/{userId}
├── profile
│   ├── email
│   ├── name
│   ├── plan
│   ├── defaultTemplateId
│   └── createdAt

templates/{templateId}
├── userId
├── name (e.g., "Bold Questions", "Minimal Lists", "Story Format")
├── isDefault (boolean)
├── category (e.g., "listicle", "quote", "story", "educational")
├── status ("active", "archived", "testing")
├── createdAt
├── updatedAt
│
├── styleConfig
│   ├── layout
│   │   ├── slideCount (5-10)
│   │   ├── aspectRatio ("9:16", "1:1", "4:5")
│   │   └── structure (["hook", "value", "value", "value", "cta"])
│   │
│   ├── visual
│   │   ├── background
│   │   │   ├── type ("gradient", "solid", "image")
│   │   │   ├── colors (["#0f0f0f", "#1a1a1a"])
│   │   │   └── opacity (0.9)
│   │   ├── font
│   │   │   ├── family ("Inter Bold", "Montserrat")
│   │   │   ├── size (48)
│   │   │   ├── color ("#ffffff")
│   │   │   └── effects (["drop-shadow", "outline"])
│   │   └── accentColor ("#ff4f8b")
│   │
│   └── content
│       ├── tone ("direct", "casual", "professional")
│       ├── hookStyle ("question", "statement", "number")
│       ├── useEmojis (true/false)
│       ├── ctaTemplate ("Save this if...", "Follow for more", "Share with...")
│       └── forbiddenWords (["journey", "game-changer"])
│
├── geminiPrompt (auto-generated from styleConfig)
│   └── fullPrompt (string)
│
└── performance (aggregated)
    ├── totalPosts (0)
    ├── avgEngagementRate (0)
    ├── avgSaves (0)
    ├── avgShares (0)
    ├── avgImpressions (0)
    └── lastUpdated

posts/{postId}
├── userId
├── templateId (reference to template)
├── variantSetId (for A/B testing grouping)
├── platform ("instagram", "tiktok")
├── status ("draft", "scheduled", "published", "failed")
├── createdAt
├── scheduledTime
├── publishedTime
│
├── content
│   ├── title
│   ├── caption
│   ├── hashtags ([])
│   └── slides
│       └── [{slideNumber, text, imageUrl, imagePrompt}]
│
└── metadata
    ├── generationParams (Gemini config used)
    └── variantLabel ("A", "B", "C")

analytics/{analyticsId}
├── postId (reference)
├── templateId (reference)
├── userId
├── platform
├── date (timestamp)
├── variantSetId
│
└── metrics
    ├── impressions (0)
    ├── reach (0)
    ├── engagement (0)
    ├── engagementRate (0)
    ├── saves (0)
    ├── shares (0)
    ├── comments (0)
    ├── profileVisits (0)
    └── clickThroughRate (0)

variantSets/{setId} (A/B Test Groups)
├── userId
├── name ("Week 47 - Hook Test")
├── templates ([templateId1, templateId2, templateId3])
├── startDate
├── endDate
├── status ("running", "completed")
├── postsPerTemplate (14) // Equal distribution
│
└── results
    ├── winningTemplateId
    ├── confidenceScore (0.95)
    └── insights ([])
```

## 🎯 Gemini 2.0 Flash Prompting Strategy

### Template → Gemini Prompt Generator

```python
def generate_gemini_prompt(template: dict) -> str:
    """Convert template styleConfig to Gemini prompt"""
    
    style = template['styleConfig']
    
    prompt = f"""You are a viral social media content creator. Generate a carousel post with EXACTLY {style['layout']['slideCount']} slides.

TEMPLATE: {template['name']}
CATEGORY: {template['category']}

VISUAL REQUIREMENTS:
- Background: {style['visual']['background']['type']} using colors {style['visual']['background']['colors']}
- Font: {style['visual']['font']['family']} at {style['visual']['font']['size']}pt
- Accent color: {style['visual']['accentColor']}
- Aspect ratio: {style['layout']['aspectRatio']}

SLIDE STRUCTURE: {' → '.join(style['layout']['structure'])}

CONTENT RULES:
- Tone: {style['content']['tone']}
- Hook style: {style['content']['hookStyle']}
- Emojis: {'Include emojis' if style['content']['useEmojis'] else 'No emojis'}
- CTA template: "{style['content']['ctaTemplate']}"
- NEVER use these words: {', '.join(style['content']['forbiddenWords'])}

OUTPUT FORMAT (JSON):
{{
  "slides": [
    {{"slideNumber": 1, "text": "Hook here", "imagePrompt": "Prompt for Unsplash/Leonardo"}},
    {{"slideNumber": 2, "text": "Value point", "imagePrompt": "..."}},
    ...
  ],
  "caption": "Instagram caption here",
  "hashtags": ["hashtag1", "hashtag2"]
}}

Topic: {{user_provided_topic}}
"""
    
    return prompt
```

### Classification System

```python
TEMPLATE_CATEGORIES = {
    "listicle": {
        "name": "Listicle",
        "structure": ["hook", "intro", "point", "point", "point", "point", "cta"],
        "hookStyles": ["number", "question"],
        "best_for": "How-to, tips, recommendations"
    },
    "quote": {
        "name": "Bold Quotes",
        "structure": ["hook", "quote", "quote", "quote", "cta"],
        "hookStyles": ["statement"],
        "best_for": "Motivation, inspiration"
    },
    "story": {
        "name": "Story Arc",
        "structure": ["hook", "setup", "conflict", "resolution", "lesson", "cta"],
        "hookStyles": ["question", "statement"],
        "best_for": "Personal experiences, case studies"
    },
    "educational": {
        "name": "Educational",
        "structure": ["hook", "problem", "solution", "example", "example", "cta"],
        "hookStyles": ["question"],
        "best_for": "Tutorials, explainers"
    },
    "comparison": {
        "name": "Before/After",
        "structure": ["hook", "before", "problem", "solution", "after", "cta"],
        "hookStyles": ["statement"],
        "best_for": "Transformations, results"
    }
}
```

## 🔥 Efficient A/B Testing Flow

### 1. Create Variant Set
```python
# User creates 3 template variants for testing
variant_set = {
    "name": "Week 47 - Hook Style Test",
    "templates": [
        template_id_1,  # Question hooks
        template_id_2,  # Statement hooks
        template_id_3,  # Number hooks
    ],
    "postsPerTemplate": 14,  # 7 days × 2 platforms
    "startDate": datetime.now(),
    "endDate": datetime.now() + timedelta(days=7)
}
```

### 2. Generate Posts
```python
for template_id in variant_set['templates']:
    template = get_template(template_id)
    prompt = generate_gemini_prompt(template)
    
    for i in range(14):
        # Generate with Gemini
        response = gemini.generate_content(prompt)
        
        # Create post with template reference
        post = {
            "templateId": template_id,
            "variantSetId": variant_set_id,
            "variantLabel": get_variant_label(template_id),  # A, B, C
            "content": parse_gemini_response(response)
        }
        
        save_post(post)
```

### 3. Track Analytics
```python
# Daily cron job or webhook from Ayrshare
def update_analytics(post_id: str, metrics: dict):
    # Save individual post analytics
    analytics_doc = {
        "postId": post_id,
        "templateId": post['templateId'],
        "variantSetId": post['variantSetId'],
        "metrics": metrics,
        "date": datetime.now()
    }
    
    db.collection('analytics').add(analytics_doc)
    
    # Update template aggregate performance
    update_template_performance(post['templateId'], metrics)
```

### 4. Calculate Winners
```python
def analyze_variant_set(set_id: str):
    # Get all analytics for this set
    analytics = db.collection('analytics')\
        .where('variantSetId', '==', set_id)\
        .get()
    
    # Group by template
    template_stats = {}
    for doc in analytics:
        template_id = doc['templateId']
        if template_id not in template_stats:
            template_stats[template_id] = []
        template_stats[template_id].append(doc['metrics'])
    
    # Calculate averages
    results = {}
    for template_id, metrics_list in template_stats.items():
        results[template_id] = {
            'avgSaves': mean([m['saves'] for m in metrics_list]),
            'avgEngagement': mean([m['engagement'] for m in metrics_list]),
            'avgImpressions': mean([m['impressions'] for m in metrics_list]),
        }
    
    # Determine winner (using saves as primary metric)
    winner = max(results.items(), key=lambda x: x[1]['avgSaves'])
    
    # Update variant set with results
    db.collection('variantSets').document(set_id).update({
        'results': {
            'winningTemplateId': winner[0],
            'stats': results,
            'completedAt': datetime.now()
        }
    })
```

## 📊 Analytics Storage Strategy

### Option 1: Firestore (Recommended for <1M posts/month)
- Real-time updates
- Easy queries for dashboards
- Auto-aggregation with Cloud Functions
- Cost: ~$0.06 per 100K reads

### Option 2: BigQuery (For scale >1M posts/month)
- Warehouse all analytics
- Run complex SQL aggregations
- Export Firestore → BigQuery via Cloud Functions
- Cost-effective for massive datasets

### Hybrid Approach (Best)
```
Firestore → Recent analytics (last 30 days) for dashboard
BigQuery → Historical analytics for deep analysis
Cloud Scheduler → Daily aggregation job
```

## 🎨 Main vs Custom Templates

### Default Template System
```javascript
// User has ONE default template
user.profile.defaultTemplateId = "template_123"

// But can create unlimited custom templates
templates = [
  { id: "1", name: "My Default - Bold Questions", isDefault: true },
  { id: "2", name: "Test: Minimal Lists", isDefault: false },
  { id: "3", name: "Test: Story Format", isDefault: false },
  { id: "4", name: "Seasonal: Holiday Theme", isDefault: false }
]
```

### Template Inheritance
```javascript
// Clone from default
function cloneTemplate(sourceId, newName) {
  const source = getTemplate(sourceId)
  return createTemplate({
    ...source.styleConfig,
    name: newName,
    isDefault: false,
    parentTemplateId: sourceId  // Track lineage
  })
}
```

## 🧪 A/B Testing Best Practices

1. **Equal Distribution**: Posts per template should be equal
2. **Time Balancing**: Distribute across same time slots
3. **Platform Split**: Test Instagram & TikTok separately
4. **Minimum Sample**: ≥10 posts per variant for statistical significance
5. **Confidence Intervals**: Calculate using t-test or bootstrap

## 📈 Performance Aggregation

```javascript
// Real-time aggregation with Firestore Triggers
exports.updateTemplateStats = functions.firestore
  .document('analytics/{analyticsId}')
  .onCreate(async (snap, context) => {
    const analytics = snap.data()
    const templateRef = db.collection('templates').doc(analytics.templateId)
    
    // Atomic increment
    await templateRef.update({
      'performance.totalPosts': FieldValue.increment(1),
      'performance.totalSaves': FieldValue.increment(analytics.metrics.saves),
      'performance.totalEngagement': FieldValue.increment(analytics.metrics.engagement),
      'performance.lastUpdated': FieldValue.serverTimestamp()
    })
    
    // Calculate new averages
    const template = await templateRef.get()
    const perf = template.data().performance
    
    await templateRef.update({
      'performance.avgSaves': perf.totalSaves / perf.totalPosts,
      'performance.avgEngagementRate': perf.totalEngagement / perf.totalPosts
    })
  })
```

## 🎯 UI/UX Flow

```
1. Templates Page
   ├── Default Template Card (highlighted)
   ├── Custom Templates Grid
   └── + Create New Template Button

2. Create Template Flow
   ├── Choose Category (listicle, quote, story, etc.)
   ├── Customize Visual Style (colors, fonts)
   ├── Set Content Rules (tone, hooks, CTAs)
   ├── Preview Example Slide
   └── Save & Set as Default (optional)

3. A/B Testing Dashboard
   ├── Active Tests (running variant sets)
   ├── Create New Test
   │   ├── Select 2-4 templates to compare
   │   ├── Set duration (7-14 days)
   │   └── Generate posts
   └── Past Results
       ├── Winner badges
       └── Performance comparison charts

4. Analytics View
   ├── By Template (filter dropdown)
   ├── By Variant Set (A/B test results)
   └── By Time Period
```

This architecture is:
✅ Modular - Each template is independent
✅ Scalable - Firestore handles millions of docs
✅ Efficient - Real-time aggregation
✅ Flexible - Easy to add new template categories
✅ AI-Ready - Structured prompts for Gemini 2.0 Flash
