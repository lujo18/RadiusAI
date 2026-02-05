from fastapi import FastAPI
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio

from services.workers.analytics.analytic_worker import process_due_posts

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        lambda: asyncio.run(process_due_posts()),
        CronTrigger(minute="*/10"),    # every 5 minutes
        id="analytics_worker",
        max_instances=1,              # avoid overlapping runs
        replace_existing=True,
    )
    scheduler.start()
    try:
        yield
    finally:
        scheduler.shutdown()

app = FastAPI(lifespan=lifespan)
