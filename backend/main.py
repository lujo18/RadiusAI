# backend/main.py
import sys
from pathlib import Path

from backend.routers import generate

# Add backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from services.genai.client import client
from services.integrations.supabase.client import get_supabase
from auth import get_current_user
from dotenv import load_dotenv
from backend.config import Config

# Import routers
from routers import generate, profile

app = FastAPI(title="ViralStack API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase
try:
    supabase = get_supabase()
    print("✅ Supabase initialized successfully")
    print(f"   URL: {Config.SUPABASE_URL}")
except Exception as e:
    print(f"⚠️  WARNING: Supabase initialization failed: {e}")
    print("   Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env")

# Include routers
app.include_router(profile.router)
app.include_router(generate.router)

security = HTTPBearer()

@app.get("/")
def root():
    return {"message": "ViralStack API", "version": "1.0.0", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "supabase"}

@app.get("/protected")
async def protected_route(user_id: str = Depends(get_current_user)):
    return {"userId": user_id, "message": "Access granted"}
