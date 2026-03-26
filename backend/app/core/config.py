from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # Required in production, but optional during development
    GEMINI_API_KEY: str | None = None
    SUPABASE_URL: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    STRIPE_SECRET_KEY: str | None = None
    DATABASE_URL: str | None = None 
    
    # Optional vars
    ENV: str = "development"
    GROQ_API_KEY: str | None = None
    LATE_API_KEY: str | None = None
    POST_FOR_ME_API_KEY: str | None = None
    SUPABASE_JWT_SECRET: str | None = None
    UNSPLASH_APP_ID: str | None = None
    UNSPLASH_SECRET_KEY: str | None = None
    UNSPLASH_ACCESS_KEY: str | None = None
    RUNWARE_DEV_KEY: str | None = None
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"
    STATE_SECRET_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


def validate_production_settings():
    """
    Validate that required settings are present in production.
    Call this at startup.
    """
    if settings.ENV == "production":
        required = [
            "GEMINI_API_KEY",
            "SUPABASE_URL",
            "SUPABASE_SERVICE_ROLE_KEY",
            "STRIPE_SECRET_KEY",
        ]
        missing = [key for key in required if not getattr(settings, key)]
        if missing:
            raise ValueError(f"Missing required settings in production: {missing}")

