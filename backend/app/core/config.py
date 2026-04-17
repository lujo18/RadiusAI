from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from pathlib import Path

# Resolve backend/.env regardless of current working directory
env_path = Path(__file__).resolve().parents[2] / ".env"
class Settings(BaseSettings):
    # Required in production, but optional during development
    GEMINI_API_KEY: str | None = None
    SUPABASE_URL: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    STRIPE_SECRET_KEY: str | None = None
    DATABASE_URL: str | None = None
    POLAR_API_KEY: str | None = None
    POLAR_ORGANIZATION_ID: str | None = None
    # Polar migration and webhook config
    USE_POLAR: bool = True
    POLAR_WEBHOOK_SECRET: str | None = None
    POLAR_MIGRATION_MODE: str = "gradual"  # options: 'gradual' or 'immediate'

    # Optional vars
    ENV: str = "development"
    GROQ_API_KEY: str | None = None
    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_APP_NAME: str = "SlideForge"
    DEFAULT_AI_PROVIDER: str = "groq"
    LATE_API_KEY: str | None = None
    POST_FOR_ME_API_KEY: str | None = None
    SOCIAL_PROVIDER: str
    SUPABASE_JWT_SECRET: str | None = None
    UNSPLASH_APP_ID: str | None = None
    UNSPLASH_SECRET_KEY: str | None = None
    UNSPLASH_ACCESS_KEY: str | None = None
    RUNWARE_DEV_KEY: str | None = None
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"
    STATE_SECRET_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None

    model_config = SettingsConfigDict(
        env_file=str(env_path),
        case_sensitive=True,
        extra="ignore",
    )

settings = Settings()


def validate_production_settings():
    """
    Validate that required settings are present in production.
    Call this at startup.
    """
    if settings.ENV == "production":
        # Base required settings
        required = [
            "SUPABASE_URL",
            "SUPABASE_SERVICE_ROLE_KEY",
            "POLAR_API_KEY"
        ]

        missing = [key for key in required if not getattr(settings, key)]
        if missing:
            raise ValueError(f"Missing required settings in production: {missing}")
