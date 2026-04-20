"""
Variants feature router - A/B testing endpoints
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from app.shared.dependencies import get_current_user
from app.features.variants.schemas import (
    VariantSet,
    CreateVariantSetRequest,
    VariantResultResponse,
)
from app.features.variants.service import VariantsService, get_variants_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/variants", tags=["variants"])


@router.post("/", response_model=VariantSet)
async def create_variant_set(
    request: CreateVariantSetRequest,
    user_id: str = Depends(get_current_user),
    variants_service: VariantsService = Depends(get_variants_service),
):
    """
    Create new A/B test variant set.

    Tests multiple templates to determine which performs best.
    """
    try:
        variant_set = await variants_service.create_variant_set(
            team_id=user_id,  # TODO: Get actual team_id from context
            user_id=user_id,
            name=request.name,
            templates=request.templates,
            posts_per_template=request.posts_per_template,
            duration_days=request.duration_days,
            description=request.description,
        )

        return variant_set

    except Exception as e:
        logger.error(f"Failed to create variant set: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{variant_set_id}", response_model=VariantSet)
async def get_variant_set(
    variant_set_id: str,
    user_id: str = Depends(get_current_user),
    variants_service: VariantsService = Depends(get_variants_service),
):
    """
    Get variant set details.

    Returns current status and performance metrics.
    """
    try:
        _ = user_id
        variant_set = await variants_service.get_variant_set(variant_set_id)
        return variant_set

    except Exception as e:
        logger.error(f"Failed to fetch variant set: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{variant_set_id}/complete", response_model=VariantResultResponse)
async def complete_variant_set(
    variant_set_id: str,
    user_id: str = Depends(get_current_user),
    variants_service: VariantsService = Depends(get_variants_service),
):
    """
    Complete variant test and get results.

    Calculates winner and generates insights.
    """
    try:
        _ = user_id
        variant_set = await variants_service.complete_variant_set(variant_set_id)

        if not variant_set.results:
            raise HTTPException(status_code=400, detail="No results available yet")

        return {
            "variant_set_id": variant_set.id,
            "winning_template_id": variant_set.results["winning_template_id"],
            "confidence_score": variant_set.results["confidence_score"],
            "performance_breakdown": [],  # TODO: Build from stored data
            "insights": variant_set.results["insights"],
            "recommendation": f"Use template {variant_set.results['winning_template_id']} for best results",
        }

    except Exception as e:
        logger.error(f"Failed to complete variant set: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{variant_set_id}/pause")
async def pause_variant_set(
    variant_set_id: str,
    user_id: str = Depends(get_current_user),
    variants_service: VariantsService = Depends(get_variants_service),
):
    """
    Pause an active variant test.

    Can be resumed or completed later.
    """
    try:
        _ = user_id
        variant_set = await variants_service.pause_variant_set(variant_set_id)
        return {"status": "paused", "variant_set_id": variant_set.id}

    except Exception as e:
        logger.error(f"Failed to pause variant set: {e}")
        raise HTTPException(status_code=500, detail=str(e))
