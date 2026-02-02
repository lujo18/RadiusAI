"""
Automation Worker: Executes scheduled automations for carousel generation.

Runs every 10-15 minutes to:
1. Fetch all due automations (next_run_at <= now)
2. Lock & execute each automation concurrently
3. Generate slideshows, post to platforms, record results
4. Update rotation cursors and next_run_at
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from backend.services.integrations.supabase.client import get_supabase
from backend.models.slide import PostContent
from backend.models.template import Template
from backend.models.user import BrandSettings

from .helpers import (
    fetch_due_automations,
    lock_automation_row,
    get_template_by_id,
    get_cta_by_id,
    insert_automation_run,
    update_automation_after_success,
    update_automation_after_failure,
)
from .schedule_calculator import compute_next_run

logger = logging.getLogger(__name__)
supabase = get_supabase()

BATCH_SIZE = 50


async def process_due_automations():
    """
    Main worker function: find automations due for execution and process them.
    Called periodically by the cron scheduler (every 10-15 minutes).
    """
    try:
        now = datetime.now(timezone.utc).isoformat()
        logger.info(f"Starting automation worker at {now}")

        # 1) Fetch all due automations
        due_automations = await fetch_due_automations(batch_size=BATCH_SIZE)

        if not due_automations:
            logger.info("No automations due for execution")
            return

        logger.info(f"Found {len(due_automations)} automations due for execution")

        # 2) Process each automation concurrently
        tasks = [run_automation(auto["id"]) for auto in due_automations]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Log any exceptions that occurred
        success_count = 0
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error processing automation {due_automations[i]['id']}: {result}")
            else:
                success_count += 1

        logger.info(f"Completed execution for {success_count}/{len(due_automations)} automations")

    except Exception as e:
        logger.error(f"Error in process_due_automations: {e}", exc_info=True)


async def run_automation(automation_id: UUID) -> dict:
    """
    Execute a single automation from start to finish.

    Steps:
    1. Lock the automation row (FOR UPDATE)
    2. Extract rotation items (template_id, cta_id)
    3. Generate slideshow
    4. Post to all platforms via PostForMe
    5. Insert automation_runs record
    6. Update rotation cursors
    7. Compute next_run_at
    8. Update automation row
    9. Handle errors and deactivate if needed
    """
    start_time = datetime.now(timezone.utc)
    run_result = {
        "automation_id": str(automation_id),
        "status": "success",
        "error": None,
        "template_id_used": None,
        "cta_id_used": None,
        "platforms_used": [],
    }

    try:
        logger.info(f"Starting execution for automation {automation_id}")

        # Step 1: Lock the automation row
        automation = await lock_automation_row(automation_id)
        if not automation:
            raise ValueError(f"Automation {automation_id} not found")

        logger.debug(f"Locked automation {automation_id}")

        # Step 2: Extract rotation items
        template_ids = automation.get("template_ids", [])
        cta_ids = automation.get("cta_ids", [])
        platforms = automation.get("platforms", [])
        brand_id = automation.get("brand_id")
        cursor_template_index = automation.get("cursor_template_index", 0) % max(len(template_ids), 1)
        cursor_cta_index = automation.get("cursor_cta_index", 0) % max(len(cta_ids), 1)

        if not template_ids or not cta_ids or not platforms:
            raise ValueError(
                f"Automation {automation_id} missing required fields: templates={bool(template_ids)}, "
                f"ctas={bool(cta_ids)}, platforms={bool(platforms)}"
            )

        template_id = template_ids[cursor_template_index]
        cta_id = cta_ids[cursor_cta_index]

        logger.info(
            f"Automation {automation_id}: using template {template_id}, "
            f"cta {cta_id}, platforms {platforms}"
        )

        # Step 3: Fetch template and CTA
        template_dict = await get_template_by_id(template_id, brand_id)
        cta_dict = await get_cta_by_id(cta_id, brand_id)

        if not template_dict:
            raise ValueError(f"Template {template_id} not found")
        if not cta_dict:
            raise ValueError(f"CTA {cta_id} not found")

        # Step 4: Fetch brand settings
        brand_response = supabase.table("brands").select("*").eq("id", brand_id).single().execute()
        if not brand_response.data:
            raise ValueError(f"Brand {brand_id} not found")


        # TODO! fix the brand settings
        brand_data = brand_response.data
        brand_settings = BrandSettings(
            name=brand_data.get("name", ""),
            description=brand_data.get("description", ""),
            niche=brand_data.get("niche", ""),
            tone=brand_data.get("tone", ""),
            target_audience=brand_data.get("target_audience", ""),
        )

        # Step 5: Generate slideshow
        logger.info(f"Generating slideshow for automation {automation_id}")

        # Import here to avoid circular dependency
        from backend.services.slides.slide_generation import generate_slideshows

        # Convert template dict to Template model
        template_model = Template(
            id=template_dict.get("id"),
            name=template_dict.get("name", ""),
            content_rules=template_dict.get("content_rules", {}),
        )

        # Generate 1 slideshow
        posts = generate_slideshows(
            user_id=brand_data.get("user_id"),
            brand_id=str(brand_id),
            template=template_model,
            brand_settings=brand_settings,
            count=1,
            cta=cta_dict,
        )

        if not posts:
            raise ValueError("No posts generated from slideshow")

        generated_post = posts[0]
        post_id = generated_post.get("id")
        storage_urls = generated_post.get("storage_urls", {})
        slide_urls = storage_urls.get("slides", [])

        logger.info(f"Generated post {post_id} with {len(slide_urls)} slides")

        # Step 6: Post to all platforms via PostForMe
        logger.info(f"Posting to platforms: {platforms}")

        from backend.services.integrations.social.postforme.social_account import make_post

        for platform in platforms:
            try:
                logger.info(f"Posting to {platform}")
                await make_post(
                    brand_id=str(brand_id),
                    platforms=[platform],  # PostForMe expects a list
                    post_id=post_id,
                    mode="publish",
                )
                run_result["platforms_used"].append(platform)
            except Exception as e:
                logger.error(f"Failed to post to {platform}: {e}", exc_info=True)
                # Don't fail entire automation if one platform fails
                # Just log and continue to next platform

        # Step 7: Insert automation_runs record
        await insert_automation_run(
            automation_id=automation_id,
            status="success",
            template_id=template_id,
            cta_id=cta_id,
            platforms_used=run_result["platforms_used"],
        )

        # Step 8: Update rotation cursors
        new_template_index = (cursor_template_index + 1) % len(template_ids)
        new_cta_index = (cursor_cta_index + 1) % len(cta_ids)

        # Step 9: Compute next_run_at
        schedule = automation.get("schedule", {})
        next_run_at = compute_next_run(schedule)

        # Step 10: Update automation row
        await update_automation_after_success(
            automation_id=automation_id,
            next_run_at=next_run_at,
            cursor_template_index=new_template_index,
            cursor_cta_index=new_cta_index,
        )

        logger.info(f"Automation {automation_id} executed successfully")

        run_result["template_id_used"] = str(template_id)
        run_result["cta_id_used"] = str(cta_id)

    except Exception as e:
        logger.error(f"Error executing automation {automation_id}: {e}", exc_info=True)

        run_result["status"] = "failed"
        run_result["error"] = str(e)

        # Insert failed automation_run record
        try:
            await insert_automation_run(
                automation_id=automation_id,
                status="failed",
                error_message=str(e),
            )
        except Exception as insert_err:
            logger.error(f"Failed to insert automation_run record: {insert_err}")

        # Update automation with error info and potential deactivation
        try:
            await update_automation_after_failure(automation_id=automation_id, error_message=str(e))
        except Exception as update_err:
            logger.error(f"Failed to update automation after failure: {update_err}")

    return run_result
