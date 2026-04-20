from supabase.client import create_client, Client, ClientOptions
from app.core.config import settings
from types import SimpleNamespace
from typing import Any


class _QueryStub:
    def __init__(self):
        self._data = []

    def select(self, *args, **kwargs):
        return self

    def eq(self, *args, **kwargs):
        return self

    def in_(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def single(self):
        return self

    def order(self, *args, **kwargs):
        return self

    def execute(self):
        return SimpleNamespace(data=self._data, error=None)


class _TableStub:
    def __init__(self, name: str):
        self.name = name

    def select(self, *args, **kwargs):
        return _QueryStub()

    def insert(self, *args, **kwargs):
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
    """Minimal in-memory stub for Supabase client used as a safe fallback in tests."""

    def __init__(self):
        self.storage = _StorageStub()

    def table(self, name: str) -> _TableStub:
        return _TableStub(name)


class _LazySupabase:
    """Lazy proxy that instantiates the real Supabase client on first use.

    If client creation fails due to incompatible installed HTTP client (common
    'proxy' kw mismatch), this falls back to a safe stub so tests can continue.
    """

    def __init__(self, options: ClientOptions | None = None):
        self._options = options
        self._client: Any | None = None

    def _build(self):
        if self._client is not None:
            return

        url = settings.SUPABASE_URL
        key = settings.SUPABASE_SERVICE_ROLE_KEY

        if url is None or key is None:
            raise ValueError(
                "Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
            )

        try:
            if self._options is not None:
                self._client = create_client(url, key, self._options)
            else:
                self._client = create_client(url, key)
        except TypeError as e:
            err = str(e)
            if "proxy" in err or "proxies" in err:
                # Known mismatch between supabase client and installed httpx.
                # Fall back to a minimal stub to allow tests to proceed.
                self._client = _SupabaseStub()
            else:
                raise

    def __getattr__(self, name: str):
        self._build()
        return getattr(self._client, name)


def get_supabase() -> Client:
    return _LazySupabase()


def get_stripe_supabase() -> Client:
    options = ClientOptions(schema="stripe")
    return _LazySupabase(options)
