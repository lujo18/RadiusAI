from fastapi import FastAPI
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio

from services.workers.analytics.analytic_worker import process_due_posts

def register_analytics_worker(scheduler: AsyncIOScheduler):
    scheduler.add_job(
        lambda: asyncio.run(process_due_posts()),
        CronTrigger(minute="*/10"),  # every 10 minutes
        id="analytics_worker",
        max_instances=1,  # avoid overlapping runs
        replace_existing=True,
    )
    



