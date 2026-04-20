"""Legacy compatibility shim for team models.

Many modules still import from `backend.models.team`. Forward those
imports to the new feature-scoped location under `app.features.team.schemas`.
"""

try:
    from app.features.team.schemas import (
        Team,
        TeamDetail,
        TeamMemberInfo,
        TeamEventSchema as TeamEvent,
        CreateTeamRequest,
        UpdateTeamRequest,
        InviteTeamMemberRequest,
        UpdateTeamMemberRequest,
    )
except Exception:  # pragma: no cover - best-effort shim
    # Provide minimal placeholders to keep static analysis tools happy.
    class Team:  # type: ignore
        """Minimal placeholder for legacy `Team` imports.

        This class is only used as a best-effort shim when the modern
        `app.features.team.schemas` import is unavailable during static
        analysis or very early runtime phases.
        """
        id: str
        name: str
        slug: str

        def __init__(self, id: str = "", name: str = "", slug: str = "") -> None:
            self.id = id
            self.name = name
            self.slug = slug

    class TeamDetail:  # type: ignore
        """Placeholder for `TeamDetail` schema used by legacy imports."""


    class TeamMemberInfo:  # type: ignore
        """Placeholder representing a team member's public information."""


    class TeamEvent:  # type: ignore
        """Placeholder for team event payload schema."""


    class CreateTeamRequest:  # type: ignore
        """Placeholder for create-team API request shape."""


    class UpdateTeamRequest:  # type: ignore
        """Placeholder for update-team API request shape."""


    class InviteTeamMemberRequest:  # type: ignore
        """Placeholder for invite-team-member request schema."""


    class UpdateTeamMemberRequest:  # type: ignore
        """Placeholder for update-team-member request schema."""


__all__ = [
    "Team",
    "TeamDetail",
    "TeamMemberInfo",
    "TeamEvent",
    "CreateTeamRequest",
    "UpdateTeamRequest",
    "InviteTeamMemberRequest",
    "UpdateTeamMemberRequest",
]
