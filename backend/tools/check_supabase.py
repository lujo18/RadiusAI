import traceback
from app.core.config import settings
from supabase.client import create_client

try:
    create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    print('create_client succeeded')
except Exception:
    traceback.print_exc()
