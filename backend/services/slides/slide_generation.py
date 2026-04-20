import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional
from app.features.posts.schemas import PostContent
from app.features.templates.schemas import Template
from app.features.user.schemas import BrandSettings
from app.features.generate.genai.generate_slideshow import generate_slideshow_auto
from app.features.usage.service import check_generation_credits, track_slides_generated
# Legacy Supabase integrations - keeping for now due to complex dependencies
# TODO: Migrate to app/features/posts/repository.py for DB operations
from services.integrations.supabase.db.post import (
    create_post,
    update_post_storage_urls,
)
from services.integrations.supabase.storage import upload_post_images_optimized
from services.pillow.renderSlides import SlideRenderer
from app.shared.genai.system_prompt import SYSTEM_PROMPT
import json


logger = logging.getLogger(__name__)


def _normalize_template_input(template: Template | dict) -> Template:
    if isinstance(template, Template):
        return template

    if not isinstance(template, dict):
        raise ValueError("template payload must be a dict or Template model")

    template_id = template.get("id")
    if not template_id:
        raise ValueError("template payload is missing required field: id")

    content_rules = template.get("content_rules")
    if content_rules is None:
        content_rules = template.get("contentRules")

    return Template(
        id=str(template_id),
        name=str(template.get("name") or ""),
        team_id=template.get("team_id"),
        user_id=template.get("user_id"),
        is_default=bool(template.get("is_default", False)),
        category=template.get("category") or "",
        status=template.get("status") or "active",
        created_at=template.get("created_at"),
        updated_at=template.get("updated_at"),
        style_config=template.get("style_config"),
        content_rules=content_rules if isinstance(content_rules, dict) else {},
        brand_id=template.get("brand_id"),
        tags=template.get("tags"),
        favorite=bool(template.get("favorite", False)),
        parent_id=template.get("parent_id"),
    )


def _normalize_brand_settings_input(
    brand_settings: BrandSettings | dict,
) -> BrandSettings:
    if isinstance(brand_settings, BrandSettings):
        return brand_settings

    if not isinstance(brand_settings, dict):
        raise ValueError("brand_settings payload must be a dict or BrandSettings model")

    return BrandSettings(**brand_settings)


def generate_slideshows(
    user_id: str,
    brand_id: str,
    template: Template | dict,
    brand_settings: BrandSettings | dict,
    count: int = 1,
    cta: Optional[dict] = None,
    stock_pack_directory: Optional[str] = None,
):
    """
    Generate slideshow content using Gemini 2.0 Flash.
    Returns structured JSON parsed into GeminiSlideshowResponse objects.
    """

    print("Generating slideshows with Gemini...")

    template_model = _normalize_template_input(template)
    brand_settings_model = _normalize_brand_settings_input(brand_settings)

    # Convert content_rules dict to string for prompt
    prompt = json.dumps(template_model.content_rules or {})

    # 1. Check usage allowance before generation
    check = check_generation_credits(user_id, slides_to_generate=count)
    if not check.get("allowed"):
        raise RuntimeError(
            f"Slide generation not allowed: projected={check.get('projected_credits')} limit={check.get('credit_limit')}"
        )

    # 2. Generate full JSON for a post
    post_content_list = generate_slideshow_auto(
        slideshowGoals=prompt,
        brandSettings=brand_settings_model,
        count=count,
        cta=cta,
        stock_pack_directory=stock_pack_directory,
    )

    # 2. Save all posts to Supabase (serialize PostContent to dict)
    posts = [  # Returns dicts from Supabase, not Post models
        create_post(
            brand_id=brand_id,
            template_id=template_model.id,
            content=post_content.model_dump()
            if hasattr(post_content, "model_dump")
            else post_content.dict(),
        )  # TODO: currently no template, default to instagram
        for post_content in post_content_list
    ]

    # 3. Render and process posts in parallel
    renderer = SlideRenderer()
    return_posts = []

    def process_post(post):
        """Process a single post: render slides, upload to storage, update DB"""
        try:
            # Convert dict to PostContent Pydantic model
            post_content = PostContent(**post["content"])

            # Render all slides (now happens in parallel within render_slides)
            slide_images = renderer.render_slides(post_content.slides)

            # Upload images to Supabase (using brand_id as tenant identifier for storage)
            result = upload_post_images_optimized(
                user_id=brand_id,
                post_id=post["id"],
                slide_images=slide_images,
                optimize=True,
            )

            # Update post with storage URLs and get the updated post back
            updated_post = update_post_storage_urls(
                post_id=post["id"],
                slide_urls=result["slide_urls"],
                thumbnail_url=result["thumbnail_url"],
            )

            return updated_post
        except Exception as e:
            logger.error(f"Failed to process post {post['id']}: {e}", exc_info=True)
            raise

    # Process multiple posts in parallel (up to 2 concurrent post processing)
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(process_post, post): post for post in posts}

        for future in as_completed(futures):
            try:
                processed_post = future.result()
                return_posts.append(processed_post)
            except Exception as e:
                post = futures[future]
                logger.error(f"Error processing post {post['id']}: {e}")

    # 6. Record slides generated for successful posts and return results
    try:
        total_slides = 0
        for p in return_posts:
            content = p.get("content") or {}
            slides = content.get("slides") if isinstance(content, dict) else None
            if slides:
                total_slides += len(slides)

        if total_slides > 0:
            track_slides_generated(user_id, total_slides)
    except Exception as e:
        logger.warning(f"Failed to record slides generated usage: {e}")

    return return_posts
