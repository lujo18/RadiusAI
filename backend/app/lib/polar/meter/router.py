from fastapi import APIRouter, Depends, Query, HTTPException

from app.features.team.repository import members_repo
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.features.team.service import get_current_team
from app.lib.polar.meter.model import SingletonMeterResponse
from app.lib.polar.meter.surface import (
    get_basic_generation_for_team,
    get_credit_usage_for_team,
    list_meters_for_team,
)
from auth import get_current_user


router = APIRouter(prefix="/meter", tags=["billing"])


# ═════════ METER ═════════

@router.get("/basic-generations", summary="Get team credits")
async def get_basic_generations(
    team_id: str = Depends(get_current_team),
)-> SingletonMeterResponse:
    return get_basic_generation_for_team(team_id)

@router.get("/ai-credits", summary="Get team credits")
async def get_ai_credits(
    team_id: str = Depends(get_current_team),
):
    return get_basic_generation_for_team(team_id)
    
@router.get("/list", summary="Get team credits")
async def list_meters(
    team_id: str = Depends(get_current_team),
):
    return list_meters_for_team(team_id)


async def get_meter_for_customer(team_id: str, user_id: str):
    """Return team credit meter for an active team member only."""
    member = await members_repo.get_by_team_and_user(team_id, user_id)
    if member is None or getattr(member, "status", None) != "active":
        raise HTTPException(status_code=403, detail="User is not an active team member")

    return get_credit_usage_for_team(team_id)


__all__ = ["router", "get_meter_for_customer", "get_credit_usage_for_team"]
