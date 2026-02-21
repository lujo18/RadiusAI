# backend/main.py
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Add backend directory to Python path first (before any imports)
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from routers import account, post, postforme_webhook, plans_bridge, brand, generate, product_rate_limits, teams
from routers import billing_service
from routers import usage

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from services.genai.client import client
from services.integrations.supabase.client import get_supabase
from auth import get_current_user
from dotenv import load_dotenv
from config import Config


# Import analytics worker and scheduler
from services.workers.analytics.analytic_worker import process_due_posts
from services.workers.automation.automation_worker import process_due_automations
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio

# Initialize scheduler
scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - start/stop scheduler"""
    # Startup: schedule the analytics worker
    scheduler.add_job(
        lambda: asyncio.run(process_due_posts()),
        CronTrigger(minute="*/5"),  # every 5 minutes
        id="analytics_worker",
        max_instances=1,  # avoid overlapping runs
        replace_existing=True,
    )
    
    # Startup: schedule the automation worker
    scheduler.add_job(
        lambda: asyncio.run(process_due_automations()),
        CronTrigger(minute="*/10"),  # every 10 minutes
        id="automation_worker",
        max_instances=1,  # avoid overlapping runs
        replace_existing=True,
    )
    
    scheduler.start()
    logger = logging.getLogger(__name__)
    logger.info("✅ Analytics worker scheduler started (runs every 5 minutes)")
    logger.info("✅ Automation worker scheduler started (runs every 10 minutes)")
    
    try:
        yield
    finally:
        # Shutdown: stop scheduler
        scheduler.shutdown()
        logger.info("📴 Analytics worker scheduler stopped")
        logger.info("📴 Automation worker scheduler stopped")


app = FastAPI(title="ViralStack API", version="1.0.0", lifespan=lifespan)

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

logger = logging.getLogger(__name__)

# Initialize Supabase
try:
    supabase = get_supabase()
    print("✅ Supabase initialized successfully")
    print(f"   URL: {Config.SUPABASE_URL}")
except Exception as e:
    print(f"⚠️  WARNING: Supabase initialization failed: {e}")
    print("   Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env")

# Include routers
app.include_router(teams.router)
app.include_router(brand.router)
app.include_router(generate.router)
app.include_router(account.router)
app.include_router(post.router)
app.include_router(plans_bridge.router)
app.include_router(postforme_webhook.router)  # Register PostForMe webhook
app.include_router(billing_service.router)
app.include_router(usage.router)
app.include_router(product_rate_limits.router)

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
