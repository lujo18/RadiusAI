from app.core.config import settings
from groq import Groq
groq = Groq(
    api_key=settings.GROQ_API_KEY,
)
