import jwt
from fastapi import HTTPException

from backend.config import Config


def decode_state(state: str):
  """
  Docstring for decode_state
  
  :param state: Description
  :type state: str
  """

  SECRET_KEY = Config.STATE_SECRET_KEY

  if not SECRET_KEY:
    raise ValueError("STATE_SECRET_KEY is not set in Config")

  try:
    payload = jwt.decode(state, SECRET_KEY, algorithms=["HS256"])
    return payload
  except jwt.ExpiredSignatureError:
    raise HTTPException(400, "State expired")
  except jwt.InvalidTokenError:
    raise HTTPException(400, "Invalid state")
