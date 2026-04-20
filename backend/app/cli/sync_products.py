"""Management command for syncing Polar products to database.

Usage:
    python -m backend.app.cli.sync_products --env=development
    python -m backend.app.cli.sync_products --env=production --dry-run
"""

import asyncio
import logging
import sys
from argparse import ArgumentParser

from app.core.config import settings
from app.lib.polar.billing_service import get_polar_billing_service

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


async def sync_products(dry_run: bool = False) -> int:
    """Sync Polar products to database.

    Args:
        dry_run: If True, log what would be synced without writing to DB

    Returns:
        Exit code (0 = success, 1 = error)
    """
    try:
        if not settings.USE_POLAR:
            logger.error("USE_POLAR is False; cannot sync Polar products")
            return 1

        logger.info("Starting Polar product sync...")
        service = get_polar_billing_service()

        result = await service.sync_products()

        if result.get("synced"):
            count = result.get("count", 0)
            logger.info(f"âœ“ Successfully synced {count} Polar products")
            if dry_run:
                logger.info("(DRY RUN: No database changes were made)")
            return 0
        else:
            error = result.get("error", "Unknown error")
            logger.error(f"âœ— Product sync failed: {error}")
            return 1

    except Exception as exc:
        logger.exception(f"Fatal error during product sync: {exc}")
        return 1


async def main():
    """CLI entry point."""
    parser = ArgumentParser(description="Sync Polar products to SlideForge database")
    parser.add_argument(
        "--env",
        default="development",
        choices=["development", "staging", "production"],
        help="Environment name",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate sync without writing to database",
    )

    args = parser.parse_args()

    logger.info(f"Polar Product Sync | Environment: {args.env}")

    exit_code = await sync_products(dry_run=args.dry_run)
    sys.exit(exit_code)


if __name__ == "__main__":
    asyncio.run(main())

