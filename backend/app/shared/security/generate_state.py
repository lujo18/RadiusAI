import jwt
import time

from config import Config

def generate_state(brand_id: str, user_id: str):
    """
    Creates state for passing brand and user ids through Late API
    
    :param brand_id: current brand being used
    :type brand_id: str
    :param user_id: current user
    :type user_id: str
    """
    SECRET_KEY = Config.STATE_SECRET_KEY
  
    if not SECRET_KEY:
      raise ValueError("STATE_SECRET_KEY is not set in Config")
      
    payload = {
        "brandId": brand_id,
        "userId": user_id,
        "exp": int(time.time()) + 600  # expires in 10 minutes
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token
