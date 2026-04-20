"""Polar utility helpers.

Provides helpers to map local team identifiers to Polar external customer IDs
(`polar_customer_id`) and other small utilities used across the Polar integration.
"""
from typing import Optional

from app.features.integrations.supabase.client import get_supabase


def get_external_customer_id_for_team(team_id: str) -> str:
    """Resolve the external customer id (Polar customer id) for a given team.

    If a `polar_customer_id` is present on the `teams` row, return it. Otherwise
    fall back to the `team_id` itself (so existing code that uses team ids will
    continue to work until teams are backfilled).

    This function intentionally errs on the side of returning a usable id so
    callers can still call Polar SDK functions (the Polar SDK will validate
    whether an id is a real Polar id).
    """
    try:
        supabase = get_supabase()
        res = (
            supabase.table("teams").select("polar_customer_id").eq("id", team_id).limit(1).execute()
        )
        if getattr(res, "data", None) and len(res.data) > 0:
            pid = res.data[0].get("polar_customer_id")
            if pid:
                return pid
    except Exception as exc:
        # Best-effort: log and fall back
        print(f"[Polar Utils] failed to resolve polar_customer_id for team {team_id}: {exc}")

    # Fallback to team id if no polar id is present
    return team_id
