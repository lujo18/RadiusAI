"""Invoices router for Polar billing invoice history."""

from fastapi import APIRouter, Depends, Query

from app.features.team.service import get_current_team
from app.lib.polar.invoices.model import BillingInvoicesResponse
from app.lib.polar.invoices.service import list_invoices_for_team

router = APIRouter(prefix="/invoices", tags=["billing"])


@router.get("", summary="List invoices")
@router.get("/", summary="List invoices")
async def list_invoices(
    team_id: str = Depends(get_current_team),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> BillingInvoicesResponse:
    return list_invoices_for_team(team_id=team_id, limit=limit, offset=offset)


__all__ = ["router"]
