"""Polar Adapter

Provides backwards-compatible shims for legacy usage functions by delegating
to Polar meter APIs and local usage storage. This module is intended to be a
drop-in replacement for the legacy `check_generation_credits` and
`track_slides_generated` functions while preserving the expected return
shapes used throughout the codebase.
"""
from typing import Optional, Dict, Any
import asyncio

from app.core.config import settings
from app.features.integrations.supabase.client import get_supabase

# Import Polar helpers
from backend.app.lib.polar.meter.service import get_meter_for_team
from backend.app.lib.polar.reconciliation import get_polar_reconciliation_service


# Keep credit cost mapping local to avoid importing deprecated service module.
CREDIT_USAGE = {
    "text_generation": 1,
    "image_generation": 1,
}


def _resolve_team_id_for_user(user_id: str) -> Optional[str]:
    """Resolve a user's primary `team_id` using Supabase.

    Returns None if the user or team cannot be found.
    """
    try:
        supabase = get_supabase()
        res = (
            supabase.table("users").select("team_id").eq("id", user_id).limit(1).execute()
        )
        if not getattr(res, "data", None) or len(res.data) == 0:
            return None
        first = res.data[0]
        if isinstance(first, dict):
            team_id = first.get("team_id")
            return str(team_id) if team_id is not None else None
        return None
    except Exception as e:
        print("[Polar Adapter] _resolve_team_id_for_user failed:", e)
        return None


def _meter_entry_to_legacy_check(meter_entry: Any, slides_to_generate: int) -> Dict[str, Any]:
    """Map a Polar MeterEntry to the legacy check_generation_credits shape.

    Assumptions:
    - `meter_entry.consumed_units` represents credits already consumed this period
    - `meter_entry.credited_units` represents credits granted for the period
    """
    credits_to_consume = slides_to_generate * CREDIT_USAGE.get("text_generation", 1)

    if not meter_entry:
        # No subscription/meter found -> treat as unlimited for the moment
        return {
            "allowed": True,
            "current_credits": 0,
            "credits_to_consume": credits_to_consume,
            "projected_credits": credits_to_consume,
            "credit_limit": None,
            "will_exceed": False,
            "message": "No Polar meter found; allowing generation (no limit detected).",
        }

    try:
        current_credits = int(getattr(meter_entry, "consumed_units", 0) or 0)
        credit_limit = getattr(meter_entry, "credited_units", None)
        credit_limit = int(credit_limit) if credit_limit is not None else None

        projected_credits = current_credits + credits_to_consume

        if credit_limit is None:
            return {
                "allowed": True,
                "current_credits": current_credits,
                "credits_to_consume": credits_to_consume,
                "projected_credits": projected_credits,
                "credit_limit": None,
                "will_exceed": False,
                "message": "No credit limit found on Polar meter; allowing generation.",
            }

        # Grace/hard-block behavior mirrors legacy semantics
        will_exceed = projected_credits > credit_limit
        hard_block = projected_credits >= (credit_limit * 1.1)

        if hard_block:
            return {
                "allowed": False,
                "current_credits": current_credits,
                "credits_to_consume": credits_to_consume,
                "projected_credits": projected_credits,
                "credit_limit": credit_limit,
                "will_exceed": True,
                "message": (
                    f"Generation blocked: projected credits ({projected_credits}) would exceed 1.1x your limit ({int(credit_limit * 1.1)}). "
                    f"Current: {current_credits}/{credit_limit}"
                ),
            }

        if will_exceed:
            return {
                "allowed": True,
                "current_credits": current_credits,
                "credits_to_consume": credits_to_consume,
                "projected_credits": projected_credits,
                "credit_limit": credit_limit,
                "will_exceed": True,
                "message": (
                    f"⚠️ Warning: generation will exceed your credit limit. Current: {current_credits}/{credit_limit}. "
                    f"Projected: {projected_credits}. Consider upgrading."
                ),
            }

        return {
            "allowed": True,
            "current_credits": current_credits,
            "credits_to_consume": credits_to_consume,
            "projected_credits": projected_credits,
            "credit_limit": credit_limit,
            "will_exceed": False,
            "message": f"OK: {projected_credits}/{credit_limit} credits after generation",
        }

    except Exception as e:
        print("[Polar Adapter] _meter_entry_to_legacy_check mapping failed:", e)
        return {
            "allowed": True,
            "current_credits": 0,
            "credits_to_consume": credits_to_consume,
            "projected_credits": credits_to_consume,
            "credit_limit": None,
            "will_exceed": False,
            "message": "Failed to map Polar meter entry; allowing generation.",
        }


def check_generation_credits(user_id: str, slides_to_generate: int) -> Dict[str, Any]:
    """Check generation credits using Polar meters.

    Returns the same dict shape as the legacy `check_generation_credits`.
    """
    team_id = _resolve_team_id_for_user(user_id)
    if not team_id:
        return {
            "allowed": False,
            "current_credits": 0,
            "credits_to_consume": 0,
            "projected_credits": 0,
            "credit_limit": None,
            "will_exceed": False,
            "message": "User not found or not attached to a team; blocking generation.",
        }

    try:
        meter = get_meter_for_team(team_id, "credits")
    except Exception as e:
        print("[Polar Adapter] failed to fetch meter for team", team_id, e)
        # Fail-open: allow generation if Polar check is unavailable
        return {
            "allowed": True,
            "current_credits": 0,
            "credits_to_consume": slides_to_generate * CREDIT_USAGE.get("text_generation", 1),
            "projected_credits": slides_to_generate * CREDIT_USAGE.get("text_generation", 1),
            "credit_limit": None,
            "will_exceed": False,
            "message": "Polar check failed; allowing generation.",
        }

    return _meter_entry_to_legacy_check(meter, slides_to_generate)


def track_slides_generated(user_id: str, count: int = 1) -> Optional[Dict[str, Any]]:
    """Record generated slides via the Polar reconciliation path.

    Returns a lightweight status dict or None when no team is found.
    """
    team_id = _resolve_team_id_for_user(user_id)
    if not team_id:
        print(f"[Polar Adapter] track_slides_generated: No team for user {user_id}")
        return None

    credits = count * CREDIT_USAGE.get("text_generation", 1)

    # Dispatch Polar dual-write asynchronously
    result: Dict[str, Any] = {
        "recorded": False,
        "queued": False,
        "user_id": user_id,
        "team_id": team_id,
        "credits": credits,
    }

    try:
        recon = get_polar_reconciliation_service()
        coro = recon.log_usage_event_dual_write(user_id, "text_generation", credits, metadata={"team_id": team_id})
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(coro)
            result["queued"] = True
        except RuntimeError:
            # No running loop: run synchronously (best-effort)
            try:
                sync_result = asyncio.run(coro)
                result["recorded"] = bool(
                    sync_result.get("success") or sync_result.get("polar_recorded")
                )
            except Exception as e:
                print("[Polar Adapter] Polar dual-write (sync) failed:", e)
    except Exception as e:
        print("[Polar Adapter] scheduling Polar dual-write failed:", e)

    return result
