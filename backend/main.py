# backend/main.py
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, auth
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ai.client import client
from ai.prompts import build_prompt, slide_prompt

# Import routers
from routers import templates, posts

app = FastAPI(title="SlideForge API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase (check if already initialized to avoid errors)
try:
    firebase_admin.get_app()
    print("✅ Firebase already initialized")
except ValueError:
    # App not initialized yet - initialize now
    service_account_path = backend_dir / "serviceAccountKey.json"
    
    if not service_account_path.exists():
        print("⚠️  WARNING: serviceAccountKey.json not found")
        print("   Download from: https://console.firebase.google.com/ → Project Settings → Service Accounts")
        print("   Firebase features will not work until credentials are added.")
        # Initialize with minimal config to avoid errors (won't work but app will start)
        firebase_admin.initialize_app()
    else:
        cred = credentials.Certificate(str(service_account_path))
        # Initialize with storage bucket
        firebase_admin.initialize_app(cred, {
            'storageBucket': 'slideforge-2488d.firebasestorage.app'  # Update with your bucket name
        })
        print("✅ Firebase initialized successfully with Storage bucket")

# Include routers
app.include_router(templates.router)
app.include_router(posts.router)

security = HTTPBearer()

def verify_token(creds: HTTPAuthorizationCredentials = Depends(security)):
    token = creds.credentials
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/protected")
def protected_route(user=Depends(verify_token)):
    return {"uid": user["uid"], "message": "Access granted"}



@app.post("/genSlides")
def run_ai(body: dict):
  prompt = slide_prompt("", 4)
  result = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=prompt
  )
  return {"response": result.text}