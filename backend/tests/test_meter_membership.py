import pytest
import asyncio
from fastapi import HTTPException

from app.lib.polar.meter import router as meter_router
from app.features.team import repository as team_repository


class DummyMember:
    def __init__(self, status):
        self.status = status


def test_meter_for_customer_non_member(monkeypatch):
    async def fake_get_by_team_and_user(team_id, user_id):
        return None

    monkeypatch.setattr(
        team_repository.members_repo, "get_by_team_and_user", fake_get_by_team_and_user
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(meter_router.get_meter_for_customer("team1", user_id="user1"))

    assert exc.value.status_code == 403


def test_meter_for_customer_inactive_member(monkeypatch):
    async def fake_get_by_team_and_user(team_id, user_id):
        return DummyMember(status="inactive")

    monkeypatch.setattr(
        team_repository.members_repo, "get_by_team_and_user", fake_get_by_team_and_user
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(meter_router.get_meter_for_customer("team1", user_id="user1"))

    assert exc.value.status_code == 403


def test_meter_for_customer_active_member(monkeypatch):
    async def fake_get_by_team_and_user(team_id, user_id):
        return DummyMember(status="active")

    monkeypatch.setattr(
        team_repository.members_repo, "get_by_team_and_user", fake_get_by_team_and_user
    )

    # Patch the surface helper used by the router to return deterministic data
    monkeypatch.setattr(meter_router, "get_credit_usage_for_team", lambda team_id: {"credits": 123})

    result = asyncio.run(meter_router.get_meter_for_customer("team1", user_id="user1"))
    assert result == {"credits": 123}
