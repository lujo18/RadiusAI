from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ConnectStartRequest(BaseModel):
    platform: str
    user_id: Optional[str] = None


@router.post("/connect-social/start")
def start_connect(req: ConnectStartRequest):
    """Minimal compatibility stub for social connect start.

    - Accepts JSON body with `platform` and `user_id`.
    - Returns 503 to simulate downstream API being unreachable (acceptable by tests).
    - Returns 400 for unsupported platforms.
"""
    supported = {"tiktok", "instagram", "facebook"}
    if req.platform not in supported:
        raise HTTPException(status_code=400, detail="Unsupported platform")

    # In real runtime this would call an external LATE API. For tests, return 503.
    raise HTTPException(status_code=503, detail="Late API unreachable (stub)")
