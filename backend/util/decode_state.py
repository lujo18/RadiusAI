import jwt
from fastapi import HTTPException

from app.core.config import settings


def decode_state(state: str):
    """
    Docstring for decode_state

    :param state: Description
    :type state: str
    """

    SECRET_KEY = settings.STATE_SECRET_KEY

    if not SECRET_KEY:
        raise ValueError("STATE_SECRET_KEY is not set in settings")

    try:
        payload = jwt.decode(state, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(400, "State expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(400, "Invalid state") from exc
