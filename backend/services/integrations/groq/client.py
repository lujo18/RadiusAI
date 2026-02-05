from groq import Groq

from config import Config

groq = Groq(
    api_key=Config.GROQ_API_KEY,
)