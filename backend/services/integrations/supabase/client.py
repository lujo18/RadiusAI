from supabase import create_client, Client
from backend.config import Config

def get_supabase() -> Client:
    url = Config.SUPABASE_URL
    key = Config.SUPABASE_SERVICE_ROLE_KEY
    return create_client(url, key)