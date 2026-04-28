"""Scheduler for running background worker tasks."""

import asyncio
import logging
from app.core.events import lifespan

logger = logging.getLogger(__name__)


async def start_scheduler():
    """Start the APScheduler with worker tasks."""
    logger.info("Starting scheduler using events.py...")
    async with lifespan(None):
        logger.info("Scheduler initialized via events.py")

        # Keep the script running
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            logger.info("Shutting down scheduler...")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(start_scheduler())