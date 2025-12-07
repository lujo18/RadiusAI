from google import genai
from google.genai import types
from backend.config import Config

client = genai.Client(api_key=Config.GEMINI_API_KEY)