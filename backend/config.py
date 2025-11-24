import os
from dotenv import load_dotenv

if os.getenv("ENV") != "production":
    load_dotenv()

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    ENV = os.getenv("ENV", "development")
