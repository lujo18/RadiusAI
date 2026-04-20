"""
Database configuration and session management

Strategy:
- SQLAlchemy ORM: Core entities (User, Template, Post, Brand, VariantSet)
- Supabase SDK: Analytics tables, webhooks data, storage
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

logger = logging.getLogger(__name__)

# ═════════ SQLAlchemy Setup ═════════
# Prefer an explicit DATABASE_URL (pooler) or DIRECT_URL for migrations.
# Do NOT pass the Supabase project REST URL (https://...) to SQLAlchemy.
db_url = settings.DATABASE_URL or settings.DIRECT_URL

# Remove unsupported query params (e.g. pgbouncer=true) that asyncpg
# may forward to the DBAPI connect() call and cause unexpected-argument
# errors. Rebuild the URL without those params.
if isinstance(db_url, str) and db_url:
    try:
        parsed = urlparse(db_url)
        if parsed.query:
            qs = dict(parse_qsl(parsed.query))
            if "pgbouncer" in qs:
                qs.pop("pgbouncer")
                cleaned = parsed._replace(query=urlencode(qs))
                db_url = urlunparse(cleaned)
    except Exception:
        # If parsing fails, fall back to the original db_url
        pass

if db_url:
    # Common mistake: someone sets SUPABASE_URL (https://...) into DATABASE_URL
    if isinstance(db_url, str) and db_url.startswith("http"):
        raise RuntimeError(
            "DATABASE_URL appears to be an HTTP(S) Supabase project URL.\n"
            "Provide a Postgres connection string (eg. postgresql+asyncpg://user:pass@host:port/dbname)."
        )

    # Normalize schemes for async SQLAlchemy driver
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Enable connection health checks by default. Pool sizing and asyncpg
    # connect args are only valid for Postgres URLs (not SQLite test URLs).
    engine_kwargs = {
        "echo": True,
        "pool_pre_ping": True,
    }

    if db_url.startswith("postgresql+asyncpg://"):
        engine_kwargs.update(
            {
                "connect_args": {"statement_cache_size": 0},
                "pool_size": 5,
                "max_overflow": 10,
                "pool_timeout": 30,
            }
        )

    engine = create_async_engine(db_url, **engine_kwargs)
    AsyncSessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
else:
    # Development mode without database - engine will be None
    engine = None
    AsyncSessionLocal = None
    logger.warning(
        "⚠️  DATABASE not configured - database features will be unavailable"
    )


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""

    pass


@asynccontextmanager
async def get_db_session() -> AsyncIterator[AsyncSession]:
    """Provide a transactional async session for service-layer operations."""
    if not AsyncSessionLocal:
        raise RuntimeError("DATABASE_URL not configured - database access unavailable")

    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_db() -> AsyncIterator[AsyncSession]:
    """
    FastAPI dependency: provides async database session

    Usage:
        @router.get("/users/{user_id}")
        async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
            return await user_repo.get_by_id(db, user_id)
    """
    async with get_db_session() as session:
        yield session


async def init_db():
    """Initialize database schema (create tables from ORM models)"""
    if not engine:
        logger.info(
            "⏭️  Skipping database initialization - DATABASE_URL not configured"
        )
        return

    try:
        async with engine.begin() as conn:
            logger.info("Creating database tables from ORM models...")
            await conn.run_sync(Base.metadata.create_all)
            logger.info("✅ Database initialization complete")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise


# ═════════ Supabase SDK Setup ═════════


def get_supabase_client():
    """
    Get Supabase client (for analytics, webhooks, storage)

    Note: Import only when needed to avoid circular dependencies
    Usage:
        from app.features.integrations.supabase.client import get_supabase
        supabase = get_supabase()
        posts = supabase.table("posts").select("*").execute()
    """
    from app.features.integrations.supabase.client import get_supabase

    return get_supabase()
