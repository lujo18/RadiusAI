from supabase.client import create_client, Client, ClientOptions
from app.core.config import settings
from typing import Any
import logging
import os

logger = logging.getLogger(__name__)


def _ensure_remote_url(url: str) -> None:
    if not url:
        raise ValueError("SUPABASE_URL must be set and point to a remote Supabase project")
    lower = url.lower()
    forbidden = ("localhost", "127.0.0.1", "supabase.local")
    if any(token in lower for token in forbidden):
        raise ValueError(
            "Local Supabase URLs are not permitted. Set SUPABASE_URL to your remote Supabase project"
        )


def _create_client(options: ClientOptions | None = None) -> Client:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY

    if url is None or key is None:
        raise ValueError(
            "Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
        )

    _ensure_remote_url(url)

    try:
        if options is not None:
            return create_client(url, key, options)
        return create_client(url, key)
    except Exception as e:
        # Allow an explicit fallback to an in-memory stub for development/debugging.
        allow_fallback = os.getenv("SUPABASE_ALLOW_FALLBACK", "false").lower() in (
            "1",
            "true",
        )

        logger.exception("Failed to create Supabase client")
        if allow_fallback:
            logger.warning("Falling back to in-memory Supabase stub (SUPABASE_ALLOW_FALLBACK=1)")

            class _TableStub:
                def __init__(self, name: str):
                    self.name = name

                def select(self, *args, **kwargs):
                    return SimpleNamespace(data=[], error=None)

                def insert(self, *args, **kwargs):
                    return SimpleNamespace(data=None, error=None)

                def upsert(self, *args, **kwargs):
                    return SimpleNamespace(data=None, error=None)

            class _StorageFromStub:
                def __init__(self, bucket: str):
                    self.bucket = bucket

                def upload(self, **kwargs):
                    return SimpleNamespace(data=None, error=None)

                def get_public_url(self, path: str) -> str:
                    return f"https://supabase.local/{self.bucket}/{path}"

                def list(self, path: str):
                    return []

                def remove(self, paths):
                    return True

                def download(self, path: str):
                    return b""

            class _StorageStub:
                def from_(self, bucket: str) -> _StorageFromStub:
                    return _StorageFromStub(bucket)

            class _SupabaseStub:
                def __init__(self):
                    self.storage = _StorageStub()

                def table(self, name: str) -> _TableStub:
                    return _TableStub(name)

            return _SupabaseStub()

        raise RuntimeError(
            "Failed to create Supabase client. Check supabase-py / httpx compatibility or set SUPABASE_ALLOW_FALLBACK=1 for a stub fallback."
        ) from e


# Eagerly-created clients (no lazy proxy)
_SUPABASE_CLIENT: Client = _create_client()
_STRIPE_SUPABASE_CLIENT: Client = _create_client(ClientOptions(schema="stripe"))


def get_supabase() -> Client:
    return _SUPABASE_CLIENT


def get_stripe_supabase() -> Client:
    return _STRIPE_SUPABASE_CLIENT
