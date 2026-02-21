# AI Package - Gemini Integration

This package contains all AI-related functionality for Radius's content generation system.

## 📁 Structure

```
backend/ai/
├── __init__.py          # Package exports
├── client.py            # Gemini client initialization
├── gemini_service.py    # Core generation logic
├── examples.py          # Usage examples
├── prompts.py           # Prompt templates (future)
└── routes.py            # FastAPI routes (future)
```

## 🚀 Quick Start

### Import and Use

```python
from ai import generate_content_with_gemini
from models import Template

# Generate content
carousels = generate_content_with_gemini(template, topic="productivity tips", count=1)

# Access generated content
for slide in carousels[0].slides:
    print(f"Slide {slide.slideNumber}: {slide.text}")
```

## 📚 Available Functions

### `generate_content_with_gemini(template, topic, count=1)`
Generate carousel posts using a template.

**Parameters:**
- `template` (Template): Template with styleConfig
- `topic` (str): Content topic/theme
- `count` (int): Number of variations to generate

**Returns:** `List[GeminiCarouselResponse]`

**Example:**
```python
template = get_template("template_123")
carousels = generate_content_with_gemini(template, "morning routines", count=3)
```

---

### `generate_week_content(template, topics, platforms)`
Generate a full week of content (7 days × platforms).

**Parameters:**
- `template` (Template): Template to use
- `topics` (List[str]): 7+ topics for the week
- `platforms` (List[str]): Platforms (default: ["instagram", "tiktok"])

**Returns:** `Dict[str, List[GeminiCarouselResponse]]`

**Example:**
```python
topics = [
    "Monday: Productivity tips",
    "Tuesday: Morning habits",
    # ... 5 more
]
week_content = generate_week_content(template, topics)
# Returns: {"instagram": [7 posts], "tiktok": [7 posts]}
```

---

### `generate_variant_set_content(templates, topics, posts_per_template)`
Generate content for A/B testing across multiple templates.

**Parameters:**
- `templates` (List[Template]): 2-5 templates to compare
- `topics` (List[str]): Topics to use (same for all templates)
- `posts_per_template` (int): Number of posts per template

**Returns:** `Dict[str, List[GeminiCarouselResponse]]` (keyed by template ID)

**Example:**
```python
templates = [template_a, template_b, template_c]
variant_posts = generate_variant_set_content(templates, topics, posts_per_template=14)
# Returns: {"template_a": [14 posts], "template_b": [14 posts], ...}
```

---

### `validate_gemini_response(response, template)`
Validate that Gemini's output follows template rules.

**Parameters:**
- `response` (GeminiCarouselResponse): Generated content
- `template` (Template): Original template

**Returns:** `Tuple[bool, List[str]]` - (is_valid, violations)

**Example:**
```python
carousel = generate_content_with_gemini(template, "topic")[0]
is_valid, violations = validate_gemini_response(carousel, template)

if not is_valid:
    print("Violations:")
    for v in violations:
        print(f"  - {v}")
```

---

### `generate_prompt_from_template(template, topic)`
Convert template styleConfig into structured Gemini prompt.

**Parameters:**
- `template` (Template): Template with styleConfig
- `topic` (str): Content topic

**Returns:** `str` - Formatted prompt

**Example:**
```python
prompt = generate_prompt_from_template(template, "productivity")
print(prompt)  # See full structured prompt
```

## 🎨 How It Works

### 1. Template → Prompt Conversion

```python
template.styleConfig = {
    layout: { slideCount: 7, aspectRatio: "9:16", structure: [...] },
    visual: { background, font, accentColor },
    content: { tone, hookStyle, useEmojis, forbiddenWords }
}

↓ converts to ↓

prompt = """
You are a viral content creator.
VISUAL: gradient with #0f0f0f, #1a1a1a
STRUCTURE: hook → intro → point → point → cta
TONE: direct
FORBIDDEN: journey, game-changer
...
"""
```

### 2. Gemini Generation

```python
client.models.generate_content(
    model='gemini-2.0-flash-exp',
    contents=prompt,
    config=types.GenerateContentConfig(
        temperature=0.9,
        response_mime_type="application/json"
    )
)
```

### 3. Response Validation

```python
✅ Slide count matches template
✅ No forbidden words used
✅ Emoji usage follows rules
✅ CTA appears in last slide
✅ Valid JSON structure
```

## 📊 Response Format

Gemini returns JSON in this structure:

```json
{
  "slides": [
    {
      "slideNumber": 1,
      "text": "Want to 10x your productivity? 🚀",
      "imagePrompt": "Minimalist workspace with laptop, gradient background #0f0f0f to #1a1a1a"
    },
    {
      "slideNumber": 2,
      "text": "Here's what changed everything for me",
      "imagePrompt": "Person working focused, dark aesthetic"
    },
    ...
  ],
  "caption": "10 productivity tips that actually work (save for later!)",
  "hashtags": ["productivity", "remotework", "tips", "workfromhome", "entrepreneur"]
}
```

## 🧪 Testing

Run the examples:

```bash
cd backend
python -m ai.examples
```

This will:
1. Generate a single post
2. Generate a week's content
3. Generate A/B test variants

## 🔧 Configuration

### Client Setup (`client.py`)

```python
from google import genai
from config import Config

client = genai.Client(api_key=Config.GEMINI_API_KEY)
```

### Environment Variables

```bash
GEMINI_API_KEY=your_api_key_here
```

Get your API key: https://aistudio.google.com/app/apikey

## 🎯 Best Practices

### 1. Prompt Engineering
- Be specific about visual requirements
- Include forbidden words to avoid clichés
- Specify exact slide structure
- Use JSON mode for consistent output

### 2. Validation
- Always validate responses before saving
- Check forbidden words
- Verify slide count
- Confirm CTA placement

### 3. Error Handling
```python
try:
    carousels = generate_content_with_gemini(template, topic)
except ValueError as e:
    print(f"Invalid JSON: {e}")
except Exception as e:
    print(f"Generation error: {e}")
```

### 4. Batch Generation
```python
# Good: Generate multiple variants in one call
carousels = generate_content_with_gemini(template, topic, count=5)

# Avoid: Multiple individual calls
for i in range(5):
    carousel = generate_content_with_gemini(template, topic, count=1)
```

## 📈 Performance

- **Generation Time**: ~3-5 seconds per post
- **Rate Limits**: 60 requests/minute (Gemini API)
- **Batch Size**: Generate 1-10 posts per call
- **Caching**: None (each generation is unique)

## 🚀 Future Enhancements

- [ ] Image generation integration (Leonardo/Unsplash)
- [ ] Multi-modal prompts (image + text)
- [ ] Fine-tuned models per template category
- [ ] Prompt caching for faster generation
- [ ] Streaming responses for real-time UI
- [ ] Prompt versioning and A/B testing

## 📝 Example Output

```
Generated Carousel:
─────────────────────────────────────────
Slide 1: Want to know the secret to 10x productivity? 🚀
Slide 2: Here's what changed everything for me...
Slide 3: ⏰ Time blocking - schedule EVERYTHING
Slide 4: 📝 Brain dumps - clear your mental RAM
Slide 5: 🎯 One big goal per day (that's it)
Slide 6: ⚡ 90-min deep work sprints
Slide 7: Save this for later! Follow for more tips 💪

Caption: 10 productivity hacks that actually work (no BS)
Hashtags: #productivity #remotework #tipsandtricks #entrepreneur #workfromhome
```

## 🐛 Troubleshooting

### Issue: Invalid JSON response
```python
# Solution: Check if Gemini is in JSON mode
config = types.GenerateContentConfig(
    response_mime_type="application/json"  # ← Ensure this is set
)
```

### Issue: Forbidden words appearing
```python
# Solution: Strengthen prompt language
prompt += "\nIMPORTANT: NEVER use these words: {words}"
```

### Issue: Wrong slide count
```python
# Solution: Validate and regenerate if needed
if len(response.slides) != expected:
    response = generate_content_with_gemini(template, topic)
```

---

**Built with ❤️ using Gemini 2.0 Flash**
