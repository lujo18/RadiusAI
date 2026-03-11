import json
import logging
from typing import Dict, Optional
from models.slide import LayoutConfig, PostContent
from models.user import BrandSettings
from models import Template
from services.genai.prompts import SYSTEM_PROMPT
from services.integrations.groq.client import groq
from services.usage.service import track_slides_generated
from .client import client
from .slide_layouts import get_all_layout_schemas, SLIDE_LAYOUTS, SlideLayout
from google.genai import types
from services.unsplash.getPhotos import queryUnsplashUrls

logger = logging.getLogger(__name__)


def generate_slideshow_auto(
    slideshowGoals: str, brandSettings: BrandSettings, count: int = 1, cta: Optional[dict] = None
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
    prompt = _generate_prompt(layout_options, slideshowGoals, brandSettings, count, template_structure=None, cta=cta)

    logger.info("FULL PROMPT:", prompt)
    
    # tokens = client.models.count_tokens(model="gemini-2.0-flash", contents=prompt).total_tokens

    # logger.info(f"Token count: {tokens}")

    # logger.info(f"genai models") # TODO: remove when done
    # for model in client.models.list():
    #   logger.info(f"MODEL: {model.name}")

    # FIXME: Switch back to "gemini-2.5-flash" when protobuf issues are resolved
    # response = client.models.generate_content(
    #     model="gemini-2.5-flash-lite", #gemini-3-flash-preview
    #     contents=prompt,
    #     config=types.GenerateContentConfig(
    #         temperature=0.85,
    #         max_output_tokens=2048,
    #         response_mime_type="application/json",
    #         thinking_config=types.ThinkingConfig(
    #             thinking_budget=0
    #         )
    #     ),
    # )

    # openai/gpt-oss-120b (production model)
    # meta-llama/llama-4-maverick-17b-128e-instruct (preview model)

    response = groq.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.4,
        top_p=0.9,
        presence_penalty=0.1,
        frequency_penalty=0.1,
        max_completion_tokens=3072,
        # reasoning_effort="medium",
        
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "carousel_array",
                "schema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "slides": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "slide_number": {"type": "integer"},
                                        "layout_type": {"type": "string"},
                                        "text_elements": {
                                            "type": "object",
                                            "additionalProperties": {"type": "string"},
                                        },
                                    },
                                    "required": [
                                        "slide_number",
                                        "layout_type",
                                        "text_elements",
                                    ],
                                },
                            },
                            "caption": {"type": "string"},
                            "hashtags": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                            "background_query": {"type": "string"},
                        },
                        "required": [
                            "slides",
                            "caption",
                            "hashtags",
                            "background_query",
                        ],
                    },
                },
            },
        },
    )

    print("Response received from Gemini.")

    # Parse response FIXME: re add if needed \/
    # response_text = response.text.strip()
    # generated_data = json.loads(response_text)

    response_text = response.choices[0].message.content
    
    print("Gemini response 1:", response_text)

    if not response_text:
        raise ValueError("No response_text received from Gemini/Groq API.")

    generated_data = json.loads(response_text.strip())
    

    # Ensure response is an array
    if isinstance(generated_data, dict):
        # Check if it has a wrapping key with array data
        if "items" in generated_data:
            # Extract array from "items" wrapper
            generated_data = generated_data["items"]
        elif "slides" in generated_data:
            # Single carousel object, wrap it in array
            generated_data = [generated_data]
        else:
            raise ValueError(f"Groq response structure unexpected: {list(generated_data.keys())}")
    elif not isinstance(generated_data, list):
        raise ValueError(f"Groq response must be an array or object, got: {type(generated_data)}")

    print("Gemini response 2:", generated_data)

    # generated_data = [{'slides': [{'slide_number': 1, 'layout_type': 'hook', 'text_elements': {'text-1767736354031': 'Level Up Your Bench Press: The 5-Step Roadmap to 225 lbs'}}, {'slide_number': 2, 'layout_type': 'header_and_body', 'text_elements': {'text-1767736354031': 'Step 1: Master the Fundamentals', 'text-1767738943620': 'Proper form is non-negotiable. Focus on your bench press technique, shoulder stability, and thoracic extension. Watch tutorials, record yourself, and consider a coach for initial feedback.'}}, {'slide_number': 3, 'layout_type': 'header_and_body', 'text_elements': {'text-1767736354031': 'Step 2: Implement Progressive Overload', 'text-1767738943620': 'To get stronger, you need to consistently challenge your muscles. This means gradually increasing the weight, reps, or sets over time. Track your workouts meticulously.'}}, {'slide_number': 4, 'layout_type': 'header_and_body', 'text_elements': {'text-1767736354031': 'Step 3: Build Supporting Muscle Groups', 'text-1767738943620': "Your bench press isn't just about your chest. Strengthen your triceps, shoulders, and upper back with accessory exercises like overhead presses, dips, and rows."}}, {'slide_number': 5, 'layout_type': 'header_and_body', 'text_elements': {'text-1767736354031': 'Step 4: Prioritize Recovery and Nutrition', 'text-1767738943620': "Muscle growth happens when you rest. Ensure you're getting enough sleep and fueling your body with adequate protein and calories. Recovery is just as important as the workout itself."}}, {'slide_number': 6, 'layout_type': 'header_and_body', 'text_elements': {'text-1767736354031': 'Step 5: Train Smart, Not Just Hard', 'text-1767738943620': 'Incorporate periodization into your training. Plan phases of strength building, hypertrophy, and deload weeks. Listen to your body and adjust as needed to avoid burnout.'}}, {'slide_number': 7, 'layout_type': 'header', 'text_elements': {'text-1767736354031': 'Ready to hit 225? Start your journey today.'}}], 'caption': "Here's your actionable 5-step plan to boost your bench press and reach that 225 lb milestone. Track your progress and stay consistent!", 'hashtags': ['#BenchPress', '#StrengthTraining', '#FitnessGoals', '#WorkoutPlan', '#GymTips'], 'background_query': 'Modern tech-themed background with subtle weightlifting elements'}]

    # Ensure response is an array
    if not isinstance(generated_data, list):
        raise ValueError("Gemini response must be an array of post variations")

    post_contents = [
        _convert_to_post_content(generated_post) for generated_post in generated_data
    ]

    logger.info(f"Converted {len(post_contents)} posts successfully")

    return post_contents


def _generate_prompt(
    layout_options: dict[str, dict[str, dict[str, str]] | None],
    slideshowGoals: str,
    brand: BrandSettings,
    count: int = 1,
    template_structure: dict = None,
    cta: Optional[dict] = None,
):
    # Build template enforcement section
    template_section = ""
    if template_structure:
        template_section = f"""
MANDATORY TEMPLATE STRUCTURE (Follow exactly as specified):
{template_structure}

YOU MUST:
1. Follow this structure exactly - do not invent slides or reorder
2. Generate content that FULFILLS each slide's purpose
3. For Slide 1 hook: Use quantity-based format (e.g., "3 Ways to...", "5 Prompts for...", "7 Tips for...")
4. Make each subsequent slide deliver on the promise made in Slide 1
"""

    # Build CTA override section if provided
    cta_section = ""
    if cta:
        cta_text = cta.get('cta_text', '')
        cta_url = cta.get('cta_url', '')
        logger.info(f"Injecting CTA - Text: {cta_text}, URL: {cta_url}")
        cta_section = f"""
*** PRIORITY CTA OVERRIDE ***
Final slide MUST include this exact CTA: "{cta_text}"
CTA URL: {cta_url if cta_url else 'N/A'}
Do NOT replace or modify this CTA text."""

    return f""" 
SLIDESHOW STRUCTURE:
{slideshowGoals}

{template_section}{cta_section}

BRAND VOICE:
Niche: {brand.niche}
Aesthetic: {brand.aesthetic}
Tone: {brand.tone_of_voice}
Emojis: {brand.emoji_usage}
Forbidden words: {', '.join(brand.forbidden_words) if brand.forbidden_words else 'None'}
Preferred phrases: {', '.join(brand.preferred_words) if brand.preferred_words else 'None'}

AVAILABLE LAYOUTS (choose optimal layout per slide):
{layout_options}

CRITICAL CONTENT RULES:
- Fill ALL text element IDs - no placeholders
- Use standard ASCII only (no unicode, em-dashes)
- Add \n between list items for proper formatting
- Generate ORIGINAL content - never copy template labels as text
- Keep background_query SHORT: 2-3 words only

OUTPUT FORMAT - Return array of {count} variation(s):
[
  {{
    "slides": [
      {{
        "slide_number": 1,
        "layout_type": "hook",
        "text_elements": {{
          "text-1767736354031": "Hook text following the template structure"
        }}
      }}
    ],
    "caption": "Authentic caption related to content",
    "hashtags": ["hashtag1", "hashtag2"],
    "background_query": "2-3 words describing an image related to content"
  }}
]

Output only valid JSON array.
"""


def _convert_to_post_content(generated: dict) -> PostContent:
    """
    Convert a single Gemini-generated post into PostContent structure.
    Maps generated text back to slide elements.
    """
    logger.info("Converting Gemini response to PostContent")

    post_slides = []

    logger.info(
        f"Generated data: {generated['background_query']}, {len(generated['slides'])} slides"
    )

    backgroundUrls = queryUnsplashUrls(
        generated["background_query"], len(generated["slides"])
    )

    if backgroundUrls is None or len(backgroundUrls) == 0:
        raise ValueError("Failed to retrieve background images from Unsplash")
    
    # If we got fewer URLs than slides, extend with the last URL as fallback
    while len(backgroundUrls) < len(generated["slides"]):
        backgroundUrls.append(backgroundUrls[-1] if backgroundUrls else None)

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
                logger.warning(
                    f"Missing content for element {element_id} in slide {slide_num}"
                )
                content = ""  # Use empty string as fallback

            filled_elements.append({**element, "content": content})

        logger.info(
            f"Filling slide {slide_num} with layout {backgroundUrls[int(slide_num) - 1]}"
        )

        post_slides.append(
            {
                "slide_number": slide_num,
                "design_id": design["name"],
                "background": {
                    "type": "image",
                    "image_url": backgroundUrls[int(slide_num) - 1],
                },
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
