import os
import sys
import inspect
from pathlib import Path

import pytest

# Ensure repo root and backend are on sys.path so imports like `app.*` work
REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_PATH = REPO_ROOT / "backend"

if str(BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_PATH))
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

# Default environment for tests
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("ENV", "test")
os.environ.setdefault("USE_POLAR", "False")


@pytest.fixture(autouse=True)
def disable_schedulers(monkeypatch):
    """
    Best-effort: prevent APScheduler from starting during tests by monkeypatching
    AsyncIOScheduler.start/shutdown to no-op. If APScheduler isn't installed,
    this will be a no-op.
    """
    try:
        import apscheduler.schedulers.asyncio as aio_scheduler

        monkeypatch.setattr(
            aio_scheduler.AsyncIOScheduler, "start", lambda self, *a, **k: None
        )
        monkeypatch.setattr(
            aio_scheduler.AsyncIOScheduler, "shutdown", lambda self, *a, **k: None
        )
    except Exception:
        # APScheduler not available in this environment; ignore
        pass

    yield


@pytest.fixture(autouse=True)
def quiet_logging():
    import logging

    logging.getLogger().setLevel(logging.WARNING)
    yield


@pytest.fixture(autouse=True)
def httpx_asyncclient_app_compat(monkeypatch):
    """Support tests that still use `httpx.AsyncClient(app=...)`.

    Newer httpx versions require `transport=httpx.ASGITransport(app=...)`.
    """
    import httpx

    sig = inspect.signature(httpx.AsyncClient.__init__)
    if "app" in sig.parameters:
        yield
        return

    original_init = httpx.AsyncClient.__init__

    def compat_init(self, *args, app=None, **kwargs):
        if app is not None and "transport" not in kwargs:
            kwargs["transport"] = httpx.ASGITransport(app=app)
        return original_init(self, *args, **kwargs)

    monkeypatch.setattr(httpx.AsyncClient, "__init__", compat_init)
    yield
