#!/usr/bin/env python3
"""Backfill script for teams.polar_customer_id

This script lists teams missing `polar_customer_id` and can optionally set
`polar_customer_id = team.id` as a safe, reversible placeholder if you want
teams to immediately have a non-null external customer id.

Run examples:
  python scripts/backfill_polar_customer_id.py         # list teams
  python scripts/backfill_polar_customer_id.py --set-team-as-polar

NOTE: Setting `polar_customer_id = team.id` is a placeholder and does NOT
create a Polar customer record. Prefer creating Polar customers via the
Polar API and updating rows with the real Polar customer id when possible.
"""
import asyncio
import argparse
import logging

from app.core.database import AsyncSessionLocal
from app.features.team.models import Team
from sqlalchemy import select

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main(set_team_as_polar: bool):
    if not AsyncSessionLocal:
        logger.error("DATABASE_URL not configured; cannot run backfill")
        return

    async with AsyncSessionLocal() as session:
        stmt = select(Team).where(Team.polar_customer_id == None)
        res = await session.execute(stmt)
        teams = res.scalars().all()

        logger.info("Found %d teams without polar_customer_id", len(teams))
        for t in teams:
            logger.info(" - %s: %s", t.id, t.name)

        if set_team_as_polar and teams:
            logger.info("Setting polar_customer_id = team.id for %d teams (placeholder)", len(teams))
            for t in teams:
                t.polar_customer_id = t.id
                session.add(t)
            await session.commit()
            logger.info("Updated teams with placeholder polar_customer_id")
        else:
            logger.info("No updates performed. Use --set-team-as-polar to set placeholder values.")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--set-team-as-polar', action='store_true', help='Set polar_customer_id = team.id as a placeholder')
    args = parser.parse_args()
    asyncio.run(main(args.set_team_as_polar))
