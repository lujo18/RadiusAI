"""
Cron job registration for automation worker.

Registers the automation worker to run every 10-15 minutes.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio

from services.workers.automation.automation_worker import process_due_automations

def register_automation_worker(scheduler: BackgroundScheduler) -> None:
    """
    Register the automation worker with the scheduler.

    Runs every 10 minutes.
    """
    scheduler.add_job(
        lambda: asyncio.run(process_due_automations()),
        CronTrigger(minute="*/10"),  # every 10 minutes
        id="automation_worker",
        max_instances=1,  # avoid overlapping runs
        replace_existing=True,
    )
    