import os
from dotenv import load_dotenv

# Load .env from the same directory as this config.py file
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

if not os.getenv("GEMINI_API_KEY"):
    raise ValueError("GEMINI_API_KEY environment variable is not set")

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    LATE_API_KEY = os.getenv("LATE_API_KEY")
    ENV = os.getenv("ENV", "development")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
