import json
import logging
from typing import Dict, Optional
from app.features.stock_packs import queryStockPackUrls
from app.util.llm_output_sanitizer import sanitize_text

from app.features.generate.genai.prompts import SYSTEM_PROMPT
from app.features.generate.genai.gpt_oss_prompts import assemble_generation_prompt
from app.features.integrations.groq.client import groq
from app.features.usage.service import track_slides_generated
from app.features.generate.genai.client import client
from app.features.generate.genai.slide_layouts import (
    get_all_layout_schemas,
    SLIDE_LAYOUTS,
    SlideLayout,
)
from app.features.posts.schemas import LayoutConfig, PostContent
from app.features.user.schemas import BrandSettings
from google.genai import types
from app.features.integrations.unsplash import queryUnsplashUrls

logger = logging.getLogger(__name__)


def generate_slideshow_auto(
    slideshowGoals: str,
    brandSettings: BrandSettings,
    count: int = 1,
    cta: Optional[dict] = None,
    stock_pack_directory: str | None = None,
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
    prompt = _generate_prompt(
        layout_options,
        slideshowGoals,
        brandSettings,
        count,
        template_structure=None,
        cta=cta,
    )

    prompt = " ".join(prompt.split())

    print("System PROMPT:", SYSTEM_PROMPT)

    print("FULL PROMPT:", prompt)

    response = groq.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
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
                                                    "additionalProperties": {
                                                        "type": "string"
                                                    },
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

    print("Response received.")

    response_text = response.choices[0].message.content

    print("Response text:", response_text)

    if not response_text:
        raise ValueError("No response_text received from API.")

    generated_data = json.loads(response_text.strip())

    # Unwrap from the required root object wrapper
    if isinstance(generated_data, dict):
        if "variations" in generated_data:
            generated_data = generated_data["variations"]
        elif "items" in generated_data:
            generated_data = generated_data["items"]
        elif "slides" in generated_data:
            generated_data = [generated_data]
        else:
            raise ValueError(
                f"Response structure unexpected: {list(generated_data.keys())}"
            )
    elif not isinstance(generated_data, list):
        raise ValueError(
            f"Response must be an array or object, got: {type(generated_data)}"
        )

    # Ensure response is an array
    if not isinstance(generated_data, list):
        raise ValueError("Response must be an array of post variations")

    cta_image_url = (cta or {}).get("metadata", {}).get("cta_image", None)
    print("CTA IMAGE OVERRIDE: ", cta_image_url)
    post_contents = [
        _convert_to_post_content(
            generated_post,
            cta_image_override=cta_image_url,
            stock_pack_directory=stock_pack_directory,
        )
        for generated_post in generated_data
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
    """
    if cta:
        logger.info(
            f"Injecting CTA - Text: {cta.get('cta_text', '')}, URL: {cta.get('cta_url', '')}"
        )

    prompt = assemble_generation_prompt(
        layout_options=layout_options,
        slideshow_goals=slideshowGoals,
        brand=brand,
        topic=slideshowGoals,
        count=count,
        cta=cta,
        classifier_context=classifier_context,
    )

    return prompt


def _convert_to_post_content(
    generated: dict, cta_image_override: str | None, stock_pack_directory: str | None
) -> PostContent:
    """
    Convert a single generated post into PostContent structure.
    Maps generated text back to slide elements.
    """
    logger.info("Converting response to PostContent")

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
        backgroundUrls = queryUnsplashUrls(background_query, len(generated["slides"]))

    if backgroundUrls is None or len(backgroundUrls) == 0:
        raise ValueError("Failed to retrieve background images")

    # If we got fewer URLs than slides, extend with the last URL as fallback
    while len(backgroundUrls) < len(generated["slides"]):
        backgroundUrls.append(backgroundUrls[-1] if backgroundUrls else None)

    last_slide_index = len(generated["slides"]) - 1
    # Replace last image with CTA IMAGE OVERRIDE
    if cta_image_override and last_slide_index >= 0:
        backgroundUrls[last_slide_index] = cta_image_override

    for gen_slide in generated["slides"]:
        slide_num = gen_slide["slide_number"]

        design: SlideLayout = SLIDE_LAYOUTS[gen_slide["layout_type"]]

        # Clone design elements and fill with generated content
        filled_elements = []
        for element in design["text_elements"]:
            # Fill element with generated content
            # Handle both dash and underscore formats
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
                content = ""

            filled_elements.append({**element, "content": content})

        logger.info(
            f"Filling slide {slide_num} with background {backgroundUrls[int(slide_num) - 1]}"
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
                "image_prompt": None,
            }
        )

    logger.info("RESPONSE: Sending post content back")

    return PostContent(
        slides=post_slides,
        layout=LayoutConfig(aspect_ratio="4:5", width=1080, height=1350),
        caption=generated["caption"],
        hashtags=generated["hashtags"],
    )
