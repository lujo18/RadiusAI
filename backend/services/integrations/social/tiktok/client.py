"""
TikTok Open API async HTTP client.

All requests go to https://open.tiktokapis.com/v2/.
On a 401 the client calls the provided `refresh_fn` once and retries.
"""

from typing import Any, Callable, Coroutine, Optional
import httpx

TIKTOK_BASE_URL = "https://open.tiktokapis.com/v2"


class TikTokAPIError(Exception):
    """Raised when TikTok API returns a non-2xx or error payload."""

    def __init__(self, status_code: int, error_code: str, message: str):
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        super().__init__(f"TikTok API [{error_code}] {message} (HTTP {status_code})")


class TikTokClient:
    """
    Thin async wrapper around TikTok's Content Posting API.

    Args:
        access_token:  Bearer token for the connected account.
        refresh_fn:    Optional async callable that returns a fresh access_token.
                       Called once automatically on 401.
    """

    def __init__(
        self,
        access_token: str,
        refresh_fn: Optional[Callable[[], Coroutine[Any, Any, str]]] = None,
    ):
        self._access_token = access_token
        self._refresh_fn = refresh_fn

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json; charset=UTF-8",
        }

    def _check_response(self, response: httpx.Response) -> dict:
        """Parse response and raise TikTokAPIError on failure."""
        try:
            data = response.json()
        except Exception:
            response.raise_for_status()
            return {}

        error = data.get("error", {})
        code = error.get("code", "ok")
        if code != "ok" and code != "":
            raise TikTokAPIError(
                status_code=response.status_code,
                error_code=code,
                message=error.get("message", str(data)),
            )

        if response.status_code >= 400:
            response.raise_for_status()

        return data

    async def get(
        self, path: str, params: Optional[dict] = None, fields: Optional[str] = None
    ) -> dict:
        """Authenticated GET.  `fields` is appended as ?fields=... query param."""
        url = f"{TIKTOK_BASE_URL}{path}"
        query = dict(params or {})
        if fields:
            query["fields"] = fields

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url, headers=self._headers(), params=query)

            if resp.status_code == 401 and self._refresh_fn:
                self._access_token = await self._refresh_fn()
                resp = await client.get(url, headers=self._headers(), params=query)

            return self._check_response(resp)

    async def post(self, path: str, payload: dict) -> dict:
        """Authenticated POST with JSON body."""
        url = f"{TIKTOK_BASE_URL}{path}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=self._headers(), json=payload)

            if resp.status_code == 401 and self._refresh_fn:
                self._access_token = await self._refresh_fn()
                resp = await client.post(url, headers=self._headers(), json=payload)

            return self._check_response(resp)

    # -- OAuth helpers (no auth header – uses client credentials) ----------------

    @staticmethod
    async def exchange_code(
        client_key: str,
        client_secret: str,
        code: str,
        redirect_uri: str,
        code_verifier: Optional[str] = None,
    ) -> dict:
        """Exchange authorization code for access + refresh tokens."""
        payload: dict = {
            "client_key": client_key,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }
        if code_verifier:
            payload["code_verifier"] = code_verifier

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://open.tiktokapis.com/v2/oauth/token/",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            if data.get("error"):
                raise TikTokAPIError(
                    status_code=resp.status_code,
                    error_code=data.get("error", "unknown"),
                    message=data.get("error_description", str(data)),
                )
            return data

    @staticmethod
    async def refresh_token(
        client_key: str, client_secret: str, refresh_token: str
    ) -> dict:
        """Refresh an expired access token."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://open.tiktokapis.com/v2/oauth/token/",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "client_key": client_key,
                    "client_secret": client_secret,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            if data.get("error"):
                raise TikTokAPIError(
                    status_code=resp.status_code,
                    error_code=data.get("error", "unknown"),
                    message=data.get("error_description", str(data)),
                )
            return data

    @staticmethod
    async def revoke_token(
        client_key: str, client_secret: str, token: str
    ) -> None:
        """Revoke an access token (logout / disconnect)."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://open.tiktokapis.com/v2/oauth/revoke/",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "client_key": client_key,
                    "client_secret": client_secret,
                    "token": token,
                },
            )
            # 200 or 400 both indicate the token is gone – treat as success
            if resp.status_code not in (200, 400):
                resp.raise_for_status()
