import json
import logging
from typing import Dict
from backend.models.slide import LayoutConfig, PostContent
from backend.models.user import BrandSettings
from backend.models import Template
from backend.services.genai.prompts import SYSTEM_PROMPT
from .client import client
from .slide_layouts import get_all_layout_schemas, SLIDE_LAYOUTS, SlideLayout
from google.genai import types
from backend.services.unsplash.getPhotos import queryUnsplashUrls

logger = logging.getLogger(__name__)


def generate_slideshow_auto(
    slideshowGoals: str, brandSettings: BrandSettings, count: int = 1
):
    """
    Generate complete TikTok slideshow with layout selection and content.

    Args:
        slideshowGoals: Content goals/topic for the slideshow
        brandSettings: Brand voice, aesthetic, and rules
        count: Number of variations to generate

    Returns:
        Gemini response with structured slideshow data
    """
    logger.info("Made it to generate_slideshow_auto")

    layout_options = get_all_layout_schemas()
    prompt = _generate_prompt(layout_options, slideshowGoals, brandSettings, count)

    # tokens = client.models.count_tokens(model="gemini-2.0-flash", contents=prompt).total_tokens

    # logger.info(f"Token count: {tokens}")
    
    # logger.info(f"genai models") # TODO: remove when done
    # for model in client.models.list():
    #   logger.info(f"MODEL: {model.name}")

# FIXME: Switch back to "gemini-2.5-flash" when protobuf issues are resolved
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.85,
            max_output_tokens=2048,
            response_mime_type="application/json",
            thinking_config=types.ThinkingConfig(
                thinking_budget=0
            )
        ),
    )

    print("Response received from Gemini.")

    # Parse response
    response_text = response.text.strip()
    generated_data = json.loads(response_text)
    print("Gemini response:", generated_data)
    
    # generated_data = [{'slides': [{'slide_number': 1, 'layout_type': 'hook', 'text_elements': {'text-1767736354031': 'Level Up Your Bench Press: The 5-Step Roadmap to 225 lbs'}}, {'slide_number': 2, 'layout_type': 'header_and_body', 'text_elements': {'text-1767736354031': 'Step 1: Master the Fundamentals', 'text-1767738943620': 'Proper form is non-negotiable. Focus on your bench press technique, shoulder stability, and thoracic extension. Watch tutorials, record yourself, and consider a coach for initial feedback.'}}, {'slide_number': 3, 'layout_type': 'header_and_body', 'text_elements': {'text-1767736354031': 'Step 2: Implement Progressive Overload', 'text-1767738943620': 'To get stronger, you need to consistently challenge your muscles. This means gradually increasing the weight, reps, or sets over time. Track your workouts meticulously.'}}, {'slide_number': 4, 'layout_type': 'header_and_body', 'text_elements': {'text-1767736354031': 'Step 3: Build Supporting Muscle Groups', 'text-1767738943620': "Your bench press isn't just about your chest. Strengthen your triceps, shoulders, and upper back with accessory exercises like overhead presses, dips, and rows."}}, {'slide_number': 5, 'layout_type': 'header_and_body', 'text_elements': {'text-1767736354031': 'Step 4: Prioritize Recovery and Nutrition', 'text-1767738943620': "Muscle growth happens when you rest. Ensure you're getting enough sleep and fueling your body with adequate protein and calories. Recovery is just as important as the workout itself."}}, {'slide_number': 6, 'layout_type': 'header_and_body', 'text_elements': {'text-1767736354031': 'Step 5: Train Smart, Not Just Hard', 'text-1767738943620': 'Incorporate periodization into your training. Plan phases of strength building, hypertrophy, and deload weeks. Listen to your body and adjust as needed to avoid burnout.'}}, {'slide_number': 7, 'layout_type': 'header', 'text_elements': {'text-1767736354031': 'Ready to hit 225? Start your journey today.'}}], 'caption': "Here's your actionable 5-step plan to boost your bench press and reach that 225 lb milestone. Track your progress and stay consistent!", 'hashtags': ['#BenchPress', '#StrengthTraining', '#FitnessGoals', '#WorkoutPlan', '#GymTips'], 'background_query': 'Modern tech-themed background with subtle weightlifting elements'}]

    # Ensure response is an array
    if not isinstance(generated_data, list):
        raise ValueError("Gemini response must be an array of post variations")

    post_contents = [
        _convert_to_post_content(generated_post)
        for generated_post in generated_data
    ]

    logger.info(f"Converted {len(post_contents)} posts successfully")
    
    return post_contents


def _generate_prompt(
    layout_options: dict[str, dict[str, dict[str, str]] | None],
    slideshowGoals: str,
    brand: BrandSettings,
    count: int = 1,
):
    # {SYSTEM_PROMPT}
    return f""" 

TOPIC: {slideshowGoals}

BRAND VOICE:
Niche: {brand.niche}
Aesthetic: {brand.aesthetic}
Tone: {brand.tone_of_voice}
Emojis: {brand.emoji_usage}
Forbidden words: {', '.join(brand.forbidden_words) if brand.forbidden_words else 'None'}
Preferred phrases: {', '.join(brand.preferred_words) if brand.preferred_words else 'None'}

AVAILABLE LAYOUTS (choose optimal layout per slide):
{layout_options}

TASK:
1. Determine ideal slide count (5-10 slides)
2. Choose layout for each slide from available options
3. Generate compelling text for each layout's text fields
4. Structure: Start with "hook", end with strong CTA

OUTPUT FORMAT - Return array of {count} variation(s):
[
  {{
    "slides": [
      {{
        "slide_number": 1,
        "layout_type": "hook",
        "text_elements": {{
          "text-1767736354031": "Your hook text here"
        }}
      }},
      {{
        "slide_number": 2,
        "layout_type": "header_and_body",
        "text_elements": {{
          "text-1767736354031": "Header text",
          "text-1767738943620": "Body text"
        }}
      }}
    ],
    "caption": "Caption matching {brand.tone_of_voice} tone with keywords",
    "hashtags": ["relevant", "hashtags", "5-7tags"],
    "background_query": 2-3 simple keywords for Unsplash
  }}
]

CRITICAL - background_query RULES:
- Keep it SHORT: 2-3 words maximum (no full sentences)
- Focus on **where** the content is happening
- Balance the query by 70% content based, 30% brand rule based
- Think cohesive mood across all slides

RULES:
- Fill ALL text element IDs for chosen layout
- One slide object per slide_number
- All text_elements for a slide in ONE object
- Match brand tone and aesthetic
- Avoid forbidden words
- Generate {count} UNIQUE variation(s)

Output only valid JSON."""


def _convert_to_post_content(generated: dict) -> PostContent:
    """
    Convert a single Gemini-generated post into PostContent structure.
    Maps generated text back to slide elements.
    """
    logger.info("Converting Gemini response to PostContent")
    
    post_slides = []
    
    logger.info(f"Generated data: {generated['background_query']}, {len(generated['slides'])} slides")
    
    backgroundUrls = queryUnsplashUrls(generated["background_query"], len(generated["slides"]))


    if backgroundUrls is None:
      raise ValueError("Failed to retrieve background images from Unsplash")

    for gen_slide in generated["slides"]:
        slide_num = gen_slide["slide_number"]

        design: SlideLayout = SLIDE_LAYOUTS[gen_slide["layout_type"]]
        # Find original slide design

        # Clone design elements and fill with generated content
        filled_elements = []
        for element in design["text_elements"]:
            # Fill element with Gemini's content
            # Handle both dash and underscore formats (Gemini is inconsistent)
            element_id = element["id"]
            content = gen_slide["text_elements"].get(element_id)
            
            # Fallback: try with underscore if dash version not found
            if content is None:
                fallback_id = element_id.replace("-", "_")
                content = gen_slide["text_elements"].get(fallback_id)
            
            # Fallback: try with dash if underscore version not found
            if content is None:
                fallback_id = element_id.replace("_", "-")
                content = gen_slide["text_elements"].get(fallback_id)
            
            if content is None:
                logger.warning(f"Missing content for element {element_id} in slide {slide_num}")
                content = ""  # Use empty string as fallback
            
            filled_elements.append(
                {**element, "content": content}
            )

        logger.info(f"Filling slide {slide_num} with layout {backgroundUrls[int(slide_num) - 1]}")

        post_slides.append(
            {
                "slide_number": slide_num,
                "design_id": design["name"],
                "background": {"type": "image", "image_url": backgroundUrls[int(slide_num) - 1]},
                "dynamic": True,
                "elements": filled_elements,
                "image_prompt": None,  # Could add AI background prompts later
            }
        )
        
        
    logger.info("RESPONSE: Sending post content back")

    return PostContent(
        slides=post_slides,
        layout=LayoutConfig(aspect_ratio="4:5", width=1080, height=1350),
        caption=generated["caption"],
        hashtags=generated["hashtags"],
    )
  