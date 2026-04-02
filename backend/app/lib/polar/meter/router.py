from fastapi import APIRouter, Depends, Query, HTTPException

from backend.app.features.team.repository import members_repo
from backend.app.lib.polar.meter.surface import get_credit_usage_for_customer, get_credit_usage_for_team
from backend.auth import get_current_user


router = APIRouter(prefix="/meter", tags=["billing"])


# ═════════ PLANS ═════════


@router.get("/plans", summary="List billing plans")
async def get_available_plans(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get all available billing plans."""
    # TODO: Implement list plans
    return {
        "items": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
    }


@router.get("/plans/{plan_id}", summary="Get plan details")
async def get_plan(plan_id: str):
    """Get details of a specific billing plan."""
    # TODO: Implement get plan
    return {"plan_id": plan_id}


# ═════════ METER ═════════


@router.get("/", summary="List available meters")
async def list_benefits(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get all available benefits and features."""
    # TODO: Implement list benefits
    return {
        "items": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{meter}", summary="Get benefit details")
async def get_benefit(meter: str):
    """Get details of a specific benefit."""
    # TODO: Implement get benefit
    return {"benefit_id": benefit_id}


@router.get("/team/{team_id}/credits", summary="Get team credits")
async def get_meter_for_customer(
    team_id: str,
    user_id: str = Depends(get_current_user),
):
    member = await members_repo.get_by_team_and_user(team_id, user_id)
    if not member or member.status != "active":
        raise HTTPException(status_code=403, detail="Not a member of that team")
    return get_credit_usage_for_team(team_id)
    


__all__ = ["router"]
