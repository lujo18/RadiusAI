import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from multiple locations for robustness
# Try: backend/.env, then ../.env, then current directory
env_locations = [
    os.path.join(os.path.dirname(__file__), '.env'),  # backend/.env
    os.path.join(os.path.dirname(__file__), '..', '.env'),  # /.env (project root)
    '.env',  # Current working directory
]

loaded = False
for env_path in env_locations:
    if os.path.exists(env_path):
        print(f"Loading .env from: {os.path.abspath(env_path)}")
        load_dotenv(env_path)
        loaded = True
        break

if not loaded:
    print("Warning: No .env file found in any expected location. Falling back to environment variables.")

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    LATE_API_KEY = os.getenv("LATE_API_KEY")
    POST_FOR_ME_API_KEY = os.getenv("POST_FOR_ME_API_KEY")
    ENV = os.getenv("ENV", "development")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    UNSPLASH_APP_ID = os.getenv("UNSPLASH_APP_ID")
    UNSPLASH_SECRET_KEY = os.getenv("UNSPLASH_SECRET_KEY")
    UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
    RUNWARE_DEV_KEY = os.getenv("RUNWARE_DEV_KEY")
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    STATE_SECRET_KEY = os.getenv("STATE_SECRET_KEY") # secure transporting data through social media oauth and back
    # Stripe configuration (optional but required for billing endpoints)
    # Support both STRIPE_SECRET_KEY and legacy/alternate name STRIPE_API_KEY
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY") or os.getenv("STRIPE_API_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")


def get_settings():
    """Get application settings singleton"""
    return Config
