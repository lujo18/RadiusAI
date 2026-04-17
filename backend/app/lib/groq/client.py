from groq import Groq

from app.core.config import settings


_groq_client: Groq | None = None


def get_groq_client() -> Groq:
    """Return a singleton Groq client configured from settings."""
    global _groq_client

    if _groq_client is None:
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured")

        _groq_client = Groq(api_key=settings.GROQ_API_KEY)

    return _groq_client
