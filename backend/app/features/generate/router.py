"""
Generate feature router - AI-powered content generation endpoints
"""

import logging
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder

from app.shared.dependencies import get_current_user
from app.features.generate.schemas import (
    GeneratePostRequest,
    GeneratePostAutoRequest,
    GeneratePostResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generate", tags=["content-generation"])


def _is_generation_payload_error(error: ValueError) -> bool:
    message = str(error)
    return (
        "template payload" in message
        or "brand_settings payload" in message
        or "missing required field: id" in message
    )


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _build_fail_open_credit_check(slides_to_generate: int, reason: str) -> dict[str, Any]:
    credits_to_consume = max(0, _safe_int(slides_to_generate))
    return {
        "allowed": True,
        "current_credits": 0,
        "credits_to_consume": credits_to_consume,
        "projected_credits": credits_to_consume,
        "credit_limit": None,
        "will_exceed": False,
        "message": f"Credit check temporarily unavailable; allowing generation. ({reason})",
    }


def _normalize_credit_check(payload: Any, slides_to_generate: int) -> dict[str, Any]:
    if not isinstance(payload, dict):
        logger.warning(
            "Generation credit check returned non-dict payload (%s); using fail-open fallback.",
            type(payload).__name__,
        )
        return _build_fail_open_credit_check(slides_to_generate, "invalid checker payload")

    current_credits = _safe_int(payload.get("current_credits"), 0)
    credits_to_consume = max(0, _safe_int(payload.get("credits_to_consume"), 0))
    projected_credits = _safe_int(
        payload.get("projected_credits"), current_credits + credits_to_consume
    )

    credit_limit_raw = payload.get("credit_limit")
    credit_limit = None if credit_limit_raw is None else _safe_int(credit_limit_raw)

    message = payload.get("message")

    return {
        "allowed": bool(payload.get("allowed", True)),
        "current_credits": current_credits,
        "credits_to_consume": credits_to_consume,
        "projected_credits": projected_credits,
        "credit_limit": credit_limit,
        "will_exceed": bool(payload.get("will_exceed", False)),
        "message": str(message)
        if message is not None
        else "Credit check unavailable; allowing generation.",
    }


def _resolve_credit_check(
    checker_fn: Any,
    user_id: str,
    slides_to_generate: int,
) -> dict[str, Any]:
    try:
        payload = checker_fn(user_id, slides_to_generate)
    except Exception as exc:
        logger.warning(
            "Generation credit check raised (%s); using fail-open fallback.",
            exc,
            exc_info=True,
        )
        return _build_fail_open_credit_check(slides_to_generate, "checker raised")

    return _normalize_credit_check(payload, slides_to_generate)


def _track_usage_best_effort(tracker_fn: Any, user_id: str, slide_count: int) -> None:
    try:
        tracker_fn(user_id, slide_count)
    except Exception as exc:
        logger.warning(
            "Usage tracking failed; continuing without blocking generation. error=%s",
            exc,
            exc_info=True,
        )


@router.post("/post", response_model=GeneratePostResponse)
async def create_post(
    request: GeneratePostRequest, user_id: str = Depends(get_current_user)
):
    """
    Generate post content using AI based on a predefined template.

    Consumes user's generation credits and returns generated content.
    """
    try:
        # Import feature-level usage API (routes to current billing adapter)
        from app.features.usage.service import (
            check_generation_credits,
            track_slides_generated,
        )
        from app.features.generate.genai.gemini_service import (
            generate_content_with_gemini,
        )

        # Check generation credits with grace period
        credit_check = _resolve_credit_check(
            check_generation_credits, user_id, request.count
        )
        if not credit_check["allowed"]:
            raise HTTPException(status_code=402, detail=credit_check["message"])

        # Generate content
        post_content = generate_content_with_gemini(
            request.template, request.brand_settings, request.count
        )

        # Track usage
        _track_usage_best_effort(track_slides_generated, user_id, request.count)

        # Build response with optional credit warning
        response = {"posts": post_content, "message": "Content generated successfully"}

        if credit_check.get("will_exceed"):
            response["credit_warning"] = credit_check["message"]
            response["credit_info"] = {
                "current": credit_check["current_credits"],
                "consumed": credit_check["credits_to_consume"],
                "projected": credit_check["projected_credits"],
                "limit": credit_check["credit_limit"],
            }

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Content generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/post/auto", response_model=GeneratePostResponse)
async def generate_post_content_from_prompt(
    request: GeneratePostAutoRequest, user_id: str = Depends(get_current_user)
):
    """
    Generate post content using AI with automatic layout selection.

    Analyzes template and brand settings to automatically choose optimal layout.
    Consumes user's generation credits.
    """
    try:
        # Import feature-level usage API (routes to current billing adapter)
        from app.features.usage.service import (
            check_generation_credits,
            track_slides_generated,
        )
        from app.features.posts.utilities.slide_generation import generate_slideshows
        from app.features.integrations.supabase.db.brand_cta import get_brand_cta

        # Check generation credits with grace period
        credit_check = _resolve_credit_check(
            check_generation_credits, user_id, request.count
        )
        if not credit_check["allowed"]:
            raise HTTPException(status_code=402, detail=credit_check["message"])

        # Fetch CTA if provided
        cta = None
        if request.cta_id:
            cta = get_brand_cta(request.cta_id)
            if not cta:
                raise HTTPException(status_code=404, detail="CTA not found")

        # Generate slideshows with auto layout selection
        posts = generate_slideshows(
            user_id=user_id,
            brand_id=request.brand_id,
            template=request.template,
            brand_settings=request.brand_settings,
            count=request.count,
            cta=cta,
            stock_pack_directory=request.stock_pack_directory,
        )

        encoded_posts = jsonable_encoder(posts)

        # Track usage
        _track_usage_best_effort(track_slides_generated, user_id, request.count)

        # Build response with optional credit warning
        response = {"posts": encoded_posts, "message": "Content generated successfully"}

        if credit_check.get("will_exceed"):
            response["credit_warning"] = credit_check["message"]
            response["credit_info"] = {
                "current": credit_check["current_credits"],
                "consumed": credit_check["credits_to_consume"],
                "projected": credit_check["projected_credits"],
                "limit": credit_check["credit_limit"],
            }

        return response

    except HTTPException:
        raise
    except ValueError as e:
        if _is_generation_payload_error(e):
            logger.warning("Invalid auto-generation payload: %s", e)
            raise HTTPException(status_code=422, detail=str(e))
        logger.error(f"Auto post generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Auto post generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
