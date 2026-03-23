"""
Credit Guard - Prevents public team access from consuming credits.

Used to block credit-consuming operations for demo/public access accounts.
"""

from fastapi import HTTPException
from backend.auth import PublicTeamAccess
from typing import Union


def check_credits_allowed(access: Union[str, PublicTeamAccess], operation: str = "operation") -> str:
    """
    Check if the current access is allowed to consume credits.
    
    If access is a public team, raises a 403 Forbidden error.
    Otherwise returns the user_id.
    
    Args:
        access: Either a user_id (str) or PublicTeamAccess object from auth dependency
        operation: Description of the credit-consuming operation for the error message
    
    Returns:
        user_id if allowed to consume credits
    
    Raises:
        HTTPException(403) if public team access is attempting credit-consuming operation
    
    Usage:
    @router.post("/api/generate")
    async def generate_content(
        access: Union[str, PublicTeamAccess] = Depends(get_current_user_or_public_team),
        request: GenerateRequest = Body(...)
    ):
        # This will raise 403 if public team tries to generate
        user_id = check_credits_allowed(access, "content generation")
        
        # Continue with normal logic using user_id
        ...
    """
    if isinstance(access, PublicTeamAccess):
        raise HTTPException(
            status_code=403,
            detail=f"Demo accounts cannot {operation}. Upgrade to a paid plan to unlock this feature."
        )
    
    return access


def get_team_id_from_access(access: Union[str, PublicTeamAccess]) -> str:
    """
    Extract team_id from either a user_id or PublicTeamAccess.
    
    For authenticated users, queries their team_id from the database.
    For public access, returns the public team_id.
    
    Args:
        access: Either a user_id (str) or PublicTeamAccess object
    
    Returns:
        team_id
    """
    if isinstance(access, PublicTeamAccess):
        return access.team_id
    
    # For authenticated user, fetch their team
    from services.usage import repo as usage_repo
    team_id = usage_repo.get_user_team_id(access)
    return team_id
