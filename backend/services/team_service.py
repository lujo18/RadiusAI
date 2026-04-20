"""
Team Service - Core business logic for team management and access control.

Handles:
- Team creation and lifecycle
- Team membership management
- Access control and validation
- Team context resolution
"""

from fastapi import HTTPException, status
from typing import List, Optional, Literal
from datetime import datetime
from models.team import (
    Team,
    TeamDetail,
    TeamMemberInfo,
    TeamEvent,
    CreateTeamRequest,
    UpdateTeamRequest,
    InviteTeamMemberRequest,
    UpdateTeamMemberRequest,
)
from app.features.integrations.supabase.client import get_supabase


class TeamService:
    """Service for team operations with full access control"""

    def __init__(self, supabase=None):
        """Initialize with optional Supabase client (for testing)"""
        self.supabase = supabase or get_supabase()

    # ====================================================================
    # TEAM CRUD & LIFECYCLE
    # ====================================================================

    async def create_team(self, user_id: str, request: CreateTeamRequest) -> Team:
        """Create a new team owned by the user"""
        try:
            team_data = {
                "owner_id": user_id,
                "name": request.name,
                "slug": request.slug,
                "description": request.description or None,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

            response = self.supabase.table("teams").insert(team_data).execute()

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create team",
                )

            team = Team(**response.data[0])

            # Auto-add owner as team member with owner role
            await self.add_team_member(
                team_id=team.id,
                user_id=user_id,
                email=None,  # Will be fetched automatically,
                role="owner",
                invited_by=user_id,
            )

            # Log team creation event
            await self._log_team_event(
                team_id=team.id,
                actor_id=user_id,
                event_type="TEAM_CREATED",
                payload={"name": team.name, "slug": team.slug},
            )

            return team

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create team: {str(e)}",
            ) from e

    async def get_team(self, team_id: str, user_id: str) -> TeamDetail:
        """Get team with member list (user must be a member)"""
        try:
            # Verify access first
            await self.verify_team_access(user_id, team_id)

            # Fetch team
            team_response = (
                self.supabase.table("teams").select("*").eq("id", team_id).execute()
            )

            if not team_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Team not found"
                )

            team = Team(**team_response.data[0])

            # Fetch team members
            members_response = (
                self.supabase.table("team_members")
                .select(
                    "id, user_id, email, role, status, invited_at, accepted_at, created_at, updated_at"
                )
                .eq("team_id", team_id)
                .execute()
            )

            members = [TeamMemberInfo(**member) for member in members_response.data]

            return TeamDetail(**team.dict(), member_count=len(members), members=members)

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch team: {str(e)}",
            ) from e

    async def list_user_teams(self, user_id: str) -> List[Team]:
        """List all teams the user is member of"""
        try:
            response = (
                self.supabase.table("team_members")
                .select(
                    "teams:team_id(id, owner_id, name, slug, description, avatar_url, created_at, updated_at, deleted_at)"
                )
                .eq("user_id", user_id)
                .eq("status", "active")
                .execute()
            )

            teams = []
            for record in response.data:
                if record.get("teams"):
                    team_data = record["teams"]
                    if isinstance(team_data, list) and team_data:
                        team_data = team_data[0]
                    if isinstance(team_data, dict):
                        teams.append(Team(**team_data))

            return teams

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list teams: {str(e)}",
            ) from e

    async def update_team(
        self, team_id: str, user_id: str, request: UpdateTeamRequest
    ) -> Team:
        """Update team (owner only)"""
        try:
            # Verify user is owner
            await self.verify_team_role(user_id, team_id, min_role="owner")

            update_data = {
                k: v
                for k, v in request.dict(exclude_unset=True).items()
                if v is not None
            }
            update_data["updated_at"] = datetime.utcnow().isoformat()

            response = (
                self.supabase.table("teams")
                .update(update_data)
                .eq("id", team_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Team not found"
                )

            await self._log_team_event(
                team_id=team_id,
                actor_id=user_id,
                event_type="TEAM_UPDATED",
                payload=update_data,
            )

            return Team(**response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update team: {str(e)}",
            ) from e

    async def delete_team(self, team_id: str, user_id: str) -> dict:
        """Soft-delete team (owner only) - sets deleted_at"""
        try:
            await self.verify_team_role(user_id, team_id, min_role="owner")

            response = (
                self.supabase.table("teams")
                .update({"deleted_at": datetime.utcnow().isoformat()})
                .eq("id", team_id)
                .execute()
            )

            await self._log_team_event(
                team_id=team_id,
                actor_id=user_id,
                event_type="TEAM_DELETED",
                payload={"deleted_at": response.data[0].get("deleted_at")},
            )

            return {"success": True, "message": "Team deleted"}

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete team: {str(e)}",
            ) from e

    # ====================================================================
    # TEAM MEMBER MANAGEMENT
    # ====================================================================

    async def add_team_member(
        self,
        team_id: str,
        user_id: str,
        email: str,
        role: Literal["owner", "admin", "member", "viewer"],
        invited_by: Optional[str] = None,
    ) -> TeamMemberInfo:
        """Add or invite a user to a team"""
        try:
            # Check if already a member
            existing = (
                self.supabase.table("team_members")
                .select("*")
                .eq("team_id", team_id)
                .eq("user_id", user_id)
                .execute()
            )

            if existing.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User is already a member of this team",
                )

            # Get user email if not provided
            if not email and user_id:
                user_response = (
                    self.supabase.table("auth.users")
                    .select("email")
                    .eq("id", user_id)
                    .execute()
                )
                if user_response.data:
                    email = user_response.data[0]["email"]
                else:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                    )

            member_data = {
                "team_id": team_id,
                "user_id": user_id if user_id else None,
                "email": email,
                "role": role,
                "status": "active" if user_id else "invited",
                "invited_by": invited_by,
                "invited_at": datetime.utcnow().isoformat(),
                "accepted_at": datetime.utcnow().isoformat() if user_id else None,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

            response = self.supabase.table("team_members").insert(member_data).execute()

            return TeamMemberInfo(**response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add team member: {str(e)}",
            ) from e

    async def invite_team_member(
        self, team_id: str, user_id: str, request: InviteTeamMemberRequest
    ) -> TeamMemberInfo:
        """Invite an external user to a team (admin/owner only)"""
        try:
            # Verify inviter is admin/owner
            await self.verify_team_role(user_id, team_id, min_role="admin")

            return await self.add_team_member(
                team_id=team_id,
                user_id=None,  # Not yet accepted
                email=request.email,
                role=request.role,
                invited_by=user_id,
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to invite team member: {str(e)}",
            ) from e

    async def update_team_member_role(
        self,
        team_id: str,
        member_id: str,
        user_id: str,
        request: UpdateTeamMemberRequest,
    ) -> TeamMemberInfo:
        """Update a team member's role (admin/owner only)"""
        try:
            # Verify user is admin/owner
            await self.verify_team_role(user_id, team_id, min_role="admin")

            response = (
                self.supabase.table("team_members")
                .update(
                    {"role": request.role, "updated_at": datetime.utcnow().isoformat()}
                )
                .eq("id", member_id)
                .eq("team_id", team_id)
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Team member not found",
                )

            return TeamMemberInfo(**response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update team member: {str(e)}",
            ) from e

    async def remove_team_member(
        self, team_id: str, member_id: str, user_id: str
    ) -> dict:
        """Remove a team member (admin/owner only)"""
        try:
            # Verify user is admin/owner
            await self.verify_team_role(user_id, team_id, min_role="admin")

            response = (
                self.supabase.table("team_members")
                .delete()
                .eq("id", member_id)
                .eq("team_id", team_id)
                .execute()
            )

            await self._log_team_event(
                team_id=team_id,
                actor_id=user_id,
                event_type="MEMBER_REMOVED",
                payload={"member_id": member_id},
            )

            return {"success": True, "message": "Team member removed"}

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to remove team member: {str(e)}",
            ) from e

    # ====================================================================
    # ACCESS CONTROL & VALIDATION
    # ====================================================================

    async def verify_team_access(self, user_id: str, team_id: str) -> bool:
        """Verify user can access a team (is active member)"""
        try:
            response = (
                self.supabase.table("team_members")
                .select("*")
                .eq("team_id", team_id)
                .eq("user_id", user_id)
                .eq("status", "active")
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this team",
                )

            return True

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Access verification failed: {str(e)}",
            ) from e

    async def verify_team_role(
        self,
        user_id: str,
        team_id: str,
        min_role: Literal["owner", "admin", "member", "viewer"] = "member",
    ) -> bool:
        """Verify user has minimum role in team"""
        role_hierarchy = {"owner": 3, "admin": 2, "member": 1, "viewer": 0}

        try:
            response = (
                self.supabase.table("team_members")
                .select("role")
                .eq("team_id", team_id)
                .eq("user_id", user_id)
                .eq("status", "active")
                .execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this team",
                )

            user_role = response.data[0]["role"]
            if role_hierarchy.get(user_role, -1) < role_hierarchy.get(min_role, 0):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"This action requires {min_role} role or higher",
                )

            return True

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Role verification failed: {str(e)}",
            ) from e

    async def get_user_default_team(self, user_id: str) -> Optional[Team]:
        """Get user's default/first team (if they have one)"""
        try:
            teams = await self.list_user_teams(user_id)
            return teams[0] if teams else None
        except Exception:
            return None

    # ====================================================================
    # AUDIT LOGGING
    # ====================================================================

    async def _log_team_event(
        self,
        team_id: str,
        actor_id: Optional[str],
        event_type: str,
        payload: Optional[dict] = None,
    ) -> None:
        """Log a team event for audit trail"""
        try:
            self.supabase.table("team_events").insert(
                {
                    "team_id": team_id,
                    "actor_id": actor_id,
                    "event_type": event_type,
                    "payload": payload,
                    "created_at": datetime.utcnow().isoformat(),
                }
            ).execute()
        except Exception as e:
            # Log error but don't fail the main operation
            print(f"Failed to log team event: {str(e)}")

    async def get_team_events(
        self, team_id: str, user_id: str, limit: int = 50
    ) -> List[TeamEvent]:
        """Fetch audit log for a team (members only)"""
        try:
            # Verify access
            await self.verify_team_access(user_id, team_id)

            response = (
                self.supabase.table("team_events")
                .select("*")
                .eq("team_id", team_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )

            return [TeamEvent(**event) for event in response.data]

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch team events: {str(e)}",
            ) from e
