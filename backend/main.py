# backend/main.py
import sys
import logging
from pathlib import Path

from backend.routers import account, post, stripe, billing

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
from config import Config

# Import routers
from routers import brand, generate

app = FastAPI(title="ViralStack API", version="1.0.0")

# CORS middleware - Allow both localhost and 127.0.0.1
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
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
app.include_router(brand.router)
app.include_router(generate.router)
app.include_router(account.router)
app.include_router(post.router)
app.include_router(stripe.router)  # Register the new router
app.include_router(billing.router)

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
