# Gemini 2.0 Flash Integration Service

import json
from typing import List, Dict, Any
from google import genai
from google.genai import types
from .client import client
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from models import (
    Template, 
    GeminiCarouselResponse, 
    Slide,
    GenerateContentRequest,
    StyleConfig
)

def generate_prompt_from_template(template: Template, topic: str) -> str:
    """
    Convert template StyleConfig into a structured Gemini prompt.
    This is the key to ensuring Gemini follows your brand rules.
    """
    style = template.styleConfig
    
    prompt = f"""You are a viral social media content creator. Generate a carousel post with EXACTLY {style.layout.slideCount} slides.

TEMPLATE: {template.name}
CATEGORY: {template.category.value}

VISUAL REQUIREMENTS:
- Background: {style.visual.background.type.value} using colors {', '.join(style.visual.background.colors)}
- Font: {style.visual.font.family} at {style.visual.font.size}pt in {style.visual.font.color}
- Font effects: {', '.join(style.visual.font.effects)}
- Accent color: {style.visual.accentColor}
- Aspect ratio: {style.layout.aspectRatio.value}

SLIDE STRUCTURE: {' → '.join(style.layout.structure)}
Each slide should follow this exact structure in order.

CONTENT RULES:
- Tone: {style.content.tone} (maintain this tone throughout)
- Hook style: {style.content.hookStyle.value}
  * question: Start with an engaging question (e.g., "Want to know the secret?")
  * statement: Bold declarative hook (e.g., "This changed everything")
  * number: Numbered hook (e.g., "7 ways to improve...")
- Emojis: {'Include relevant emojis strategically' if style.content.useEmojis else 'NO emojis allowed'}
- CTA (final slide): "{style.content.ctaTemplate}"
{f'- FORBIDDEN WORDS (NEVER use): {", ".join(style.content.forbiddenWords)}' if style.content.forbiddenWords else ''}

SLIDE CONTENT REQUIREMENTS:
- Each slide should have 10-30 words max (punchy, scannable)
- First slide MUST be a hook following the {style.content.hookStyle.value} style
- Middle slides provide value/insights
- Last slide includes the CTA template
- Text should be optimized for {style.layout.aspectRatio.value} aspect ratio

IMAGE PROMPTS:
For each slide, provide a detailed image prompt for Unsplash/Leonardo AI that:
- Matches the {style.visual.background.type.value} background style
- Uses color palette: {', '.join(style.visual.background.colors)}
- Fits the slide's message
- Is visually cohesive with the overall template

OUTPUT FORMAT (strict JSON):
{{
  "slides": [
    {{"slideNumber": 1, "text": "Your hook here", "imagePrompt": "Detailed prompt for image generation"}},
    {{"slideNumber": 2, "text": "Value point 1", "imagePrompt": "..."}},
    ...
    {{"slideNumber": {style.layout.slideCount}, "text": "{style.content.ctaTemplate}", "imagePrompt": "..."}}
  ],
  "caption": "Instagram caption (150-200 chars, engaging, includes topic keywords)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}}

TOPIC: {topic}

Generate the carousel following ALL rules above. Output ONLY valid JSON with no additional text."""
    
    return prompt


def generate_content_with_gemini(
    template: Template, 
    topic: str,
    count: int = 1
) -> List[GeminiCarouselResponse]:
    """
    Generate carousel content using Gemini 2.0 Flash.
    Returns structured JSON parsed into GeminiCarouselResponse objects.
    """
    prompt = generate_prompt_from_template(template, topic)
    
    results = []
    
    for i in range(count):
        response_text = ""
        try:
            # Generate content using client with JSON mode
            response = client.models.generate_content(
                model='gemini-2.0-flash-exp',
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.9,
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=2048,
                    response_mime_type="application/json"
                )
            )
            
            # Extract JSON from response
            response_text = response.text.strip() if response.text else ""
            
            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            # Parse JSON
            carousel_data = json.loads(response_text)
            
            # Validate slide count
            if len(carousel_data["slides"]) != template.styleConfig.layout.slideCount:
                print(f"Warning: Expected {template.styleConfig.layout.slideCount} slides, got {len(carousel_data['slides'])}")
            
            # Convert to Pydantic model
            carousel = GeminiCarouselResponse(**carousel_data)
            results.append(carousel)
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response text: {response_text}")
            raise ValueError(f"Gemini returned invalid JSON: {e}")
        except Exception as e:
            print(f"Error generating content: {e}")
            raise
    
    return results


def generate_week_content(
    template: Template,
    topics: List[str],
    platforms: List[str] = ["instagram", "tiktok"]
) -> Dict[str, Any]:
    """
    Generate a week's worth of content (7 days × 2 platforms = 14 posts).
    """
    if len(topics) < 7:
        raise ValueError("Need at least 7 topics for a week of content")
    
    posts_by_platform = {}
    
    for platform in platforms:
        platform_posts = []
        
        for topic in topics[:7]:  # One per day
            carousels = generate_content_with_gemini(template, topic, count=1)
            platform_posts.extend(carousels)
        
        posts_by_platform[platform] = platform_posts
    
    return posts_by_platform


def generate_variant_set_content(
    templates: List[Template],
    topics: List[str],
    posts_per_template: int
) -> Dict[str, List[GeminiCarouselResponse]]:
    """
    Generate content for A/B testing across multiple templates.
    Returns posts organized by template ID.
    """
    if len(topics) < posts_per_template:
        raise ValueError(f"Need at least {posts_per_template} topics for variant set")
    
    posts_by_template = {}
    
    for template in templates:
        template_posts = []
        
        # Use same topics for all templates to ensure fair comparison
        for topic in topics[:posts_per_template]:
            carousels = generate_content_with_gemini(template, topic, count=1)
            template_posts.extend(carousels)
        
        posts_by_template[template.id] = template_posts
    
    return posts_by_template


def validate_gemini_response(
    response: GeminiCarouselResponse, 
    template: Template
) -> tuple[bool, List[str]]:
    """
    Validate that Gemini's response follows all template rules.
    Returns (is_valid, list_of_violations)
    """
    violations = []
    style = template.styleConfig
    
    # Check slide count
    if len(response.slides) != style.layout.slideCount:
        violations.append(f"Expected {style.layout.slideCount} slides, got {len(response.slides)}")
    
    # Check forbidden words
    if style.content.forbiddenWords:
        for slide in response.slides:
            text_lower = slide.text.lower()
            for word in style.content.forbiddenWords:
                if word.lower() in text_lower:
                    violations.append(f"Forbidden word '{word}' found in slide {slide.slideNumber}")
        
        caption_lower = response.caption.lower()
        for word in style.content.forbiddenWords:
            if word.lower() in caption_lower:
                violations.append(f"Forbidden word '{word}' found in caption")
    
    # Check emoji usage
    has_emojis = any(char for slide in response.slides for char in slide.text if ord(char) > 127)
    if style.content.useEmojis and not has_emojis:
        violations.append("Template requires emojis but none found")
    elif not style.content.useEmojis and has_emojis:
        violations.append("Template forbids emojis but emojis found")
    
    # Check CTA template in last slide
    if style.content.ctaTemplate.lower() not in response.slides[-1].text.lower():
        violations.append(f"Last slide doesn't include CTA template: '{style.content.ctaTemplate}'")
    
    # Check hashtag count
    if len(response.hashtags) < 3:
        violations.append("Need at least 3 hashtags")
    
    return len(violations) == 0, violations


# ==================== USAGE EXAMPLES ====================

"""
# Example 1: Generate single post
template = get_template_from_firestore("template_id_123")
topic = "10 productivity tips for remote workers"
carousels = generate_content_with_gemini(template, topic, count=1)

# Example 2: Generate week's content
topics = [
    "5 morning habits that changed my life",
    "The truth about productivity hacks",
    "Why you're procrastinating (and how to stop)",
    "3 books that will change your mindset",
    "How I doubled my income in 6 months",
    "The biggest mistake new entrepreneurs make",
    "Simple trick to wake up at 5 AM"
]
week_content = generate_week_content(template, topics)

# Example 3: A/B testing
template_a = get_template("template_a")
template_b = get_template("template_b")
template_c = get_template("template_c")

variant_posts = generate_variant_set_content(
    templates=[template_a, template_b, template_c],
    topics=topics,
    posts_per_template=14
)

# Example 4: Validate response
carousel = carousels[0]
is_valid, violations = validate_gemini_response(carousel, template)
if not is_valid:
    print("Violations found:")
    for v in violations:
        print(f"  - {v}")
"""
