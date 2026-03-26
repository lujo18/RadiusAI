import json
import logging
from typing import Dict, Optional
from app.features.stock_packs.getPhotos import queryStockPackUrls
from app.shared.genai.llm_output_sanitizer import sanitize_text
from app.features.posts.schemas import LayoutConfig, PostContent
from app.features.user.schemas import BrandSettings
from app.features.templates.schemas import Template
from app.shared.genai.prompts import SYSTEM_PROMPT
from app.shared.genai.gpt_oss_prompts import assemble_generation_prompt
from app.features.integrations.groq.client import groq
from app.features.usage.service import track_slides_generated
from .client import client
from .slide_layouts import get_all_layout_schemas, SLIDE_LAYOUTS, SlideLayout
from google.genai import types
from app.features.integrations.unsplash.getPhotos import queryUnsplashUrls

logger = logging.getLogger(__name__)


def generate_slideshow_auto(
    slideshowGoals: str, brandSettings: BrandSettings, count: int = 1, cta: Optional[dict] = None, stock_pack_directory: str | None = None
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

    layout_options = get_all_layout_schemas()
    prompt = _generate_prompt(layout_options, slideshowGoals, brandSettings, count, template_structure=None, cta=cta)

    prompt = " ".join(prompt.split())

    print("System PROMPT:", SYSTEM_PROMPT)

    print("FULL PROMPT:", prompt)
    
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
        temperature=0.6,
        top_p=0.95,
        presence_penalty=0.4,
        frequency_penalty=0.3,
        max_completion_tokens=6000,
        # reasoning_effort="medium",
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "carousel_response",
                "schema": {
                    "type": "object",
                    "properties": {
                        "variations": {
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
                    "required": ["variations"],
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

    # Unwrap from the required root object wrapper
    if isinstance(generated_data, dict):
        if "variations" in generated_data:
            generated_data = generated_data["variations"]
        elif "items" in generated_data:
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

    cta_image_url = (cta or {}).get("metadata", {}).get("cta_image", None) 
    print("CTA IMAGE OVERRIDE: ", cta_image_url)
    post_contents = [
        _convert_to_post_content(generated_post, cta_image_override=cta_image_url, stock_pack_directory=stock_pack_directory) for generated_post in generated_data
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
    classifier_context: Optional[Dict] = None,
):
    """
    Build complete generation prompt using modular injection architecture.
    
    Per GPT-OSS 120B docs: Static content first (caching optimization),
    dynamic content last (task-specific data).
    
    Components (in order):
    1. SYSTEM ROLE - persona, reasoning effort, constraints
    2. BRAND GUIDELINES - brand voice and rules
    3. TEMPLATE ARCHITECTURE - slide structure
    4. TEXT OUTPUT SCHEMA - layout definitions
    5. CTA OVERRIDES - if provided
    6. INPUT TOPIC - user goal and instructions
    
    Args:
        layout_options: Slide layout definitions
        slideshowGoals: Template structure (JSON string)
        brand: BrandSettings with voice/tone info
        count: Number of variations to generate
        template_structure: Unused (for backward compat)
        cta: Optional CTA override
        classifier_context: Template format, niche, content_mode, etc.
    
    Returns:
        Complete prompt string for Groq/GPT-OSS 120B
    """
    if cta:
        logger.info(f"Injecting CTA - Text: {cta.get('cta_text', '')}, URL: {cta.get('cta_url', '')}")
    
    # Use new modular component builders
    prompt = assemble_generation_prompt(
        layout_options=layout_options,
        slideshow_goals=slideshowGoals,
        brand=brand,
        topic=slideshowGoals,  # Topic is embedded in slideshowGoals JSON
        count=count,
        cta=cta,
        classifier_context=classifier_context,
    )
    
    return prompt


def _convert_to_post_content(generated: dict, cta_image_override: str | None, stock_pack_directory:str|None) -> PostContent:
    """
    Convert a single Gemini-generated post into PostContent structure.
    Maps generated text back to slide elements.
    """
    logger.info("Converting Gemini response to PostContent")

    post_slides = []

    background_query = generated.get("background_query", None)
    
    if not background_query:
        ValueError("No backgrounds were added to post")

    logger.info(
        f"Generated data: {background_query}, {len(generated['slides'])} slides"
    )

    if stock_pack_directory:
        backgroundUrls = queryStockPackUrls(
            stock_pack_directory, len(generated["slides"])
        )
    else: 
        backgroundUrls = queryUnsplashUrls(
            background_query, len(generated["slides"])
        )

    if backgroundUrls is None or len(backgroundUrls) == 0:
        raise ValueError("Failed to retrieve background images from Unsplash")
    
    # If we got fewer URLs than slides, extend with the last URL as fallback
    while len(backgroundUrls) < len(generated["slides"]):
        backgroundUrls.append(backgroundUrls[-1] if backgroundUrls else None)
        
    last_slide_index = len(generated['slides']) - 1
    # Replace last image with CTA IMAGE OVERIDE
    if cta_image_override and last_slide_index >= 0:
        backgroundUrls[last_slide_index] = cta_image_override

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
            content = sanitize_text(gen_slide["text_elements"].get(element_id))

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
