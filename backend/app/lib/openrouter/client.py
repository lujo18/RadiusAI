import json
import logging
import re
from typing import Any

import httpx

from app.core.config import settings


logger = logging.getLogger(__name__)


def _normalize_message_content(content: str) -> str:
    """Normalize model text content to a JSON string when possible."""
    text = content.strip()

    # Unwrap markdown code fences like ```json ... ```.
    fence_match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, flags=re.DOTALL | re.IGNORECASE)
    if fence_match:
        text = fence_match.group(1).strip()

    # If the whole text is valid JSON, canonicalize it.
    try:
        parsed = json.loads(text)
        return json.dumps(parsed, ensure_ascii=False)
    except Exception:
        pass

    # Try extracting the first JSON object/array from mixed text.
    object_start = text.find("{")
    object_end = text.rfind("}")
    array_start = text.find("[")
    array_end = text.rfind("]")

    candidates: list[tuple[int, int]] = []
    if object_start != -1 and object_end > object_start:
        candidates.append((object_start, object_end + 1))
    if array_start != -1 and array_end > array_start:
        candidates.append((array_start, array_end + 1))

    if candidates:
        start, end = min(candidates, key=lambda pair: pair[0])
        candidate = text[start:end].strip()
        try:
            parsed = json.loads(candidate)
            return json.dumps(parsed, ensure_ascii=False)
        except Exception:
            pass

    return text


class OpenRouterClient:
    """Minimal OpenRouter chat completion client."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://openrouter.ai/api/v1",
        app_name: str = "SlideForge",
        referer: str | None = None,
        timeout_seconds: float = 120.0,
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.app_name = app_name
        self.referer = referer
        self.timeout_seconds = timeout_seconds

    def chat_completions_create(self, **payload: Any) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Title": self.app_name,
        }
        if self.referer:
            headers["HTTP-Referer"] = self.referer

        response = httpx.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=self.timeout_seconds,
        )

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = response.text
            raise RuntimeError(f"OpenRouter request failed: {detail}") from exc

        # Try to decode JSON. If the provider returned non-JSON (HTML/error page),
        # fall back to returning a minimal structure where `choices[0].message.content`
        # contains the raw text. This keeps the contract compatible with callers
        # that expect `response["choices"][0]["message"]["content"]`.
        try:
            data = response.json()
        except Exception:
            logger.warning(
                "OpenRouter returned non-JSON response; returning raw text fallback"
            )
            return {"choices": [{"message": {"content": response.text}}]}

        # Normalize the first choice's message.content so callers receive a string.
        try:
            choices = data.get("choices") if isinstance(data, dict) else None
            if isinstance(choices, list) and len(choices) > 0:
                first = choices[0]
                if isinstance(first, dict):
                    message = first.get("message", {})
                    content = message.get("content")

                    # If provider returned structured content (dict/list), convert to JSON string
                    if content is not None and not isinstance(content, (str, bytes)):
                        try:
                            message["content"] = json.dumps(content, ensure_ascii=False)
                        except Exception:
                            # Fallback to string conversion if JSON serialization fails
                            message["content"] = str(content)
                        first["message"] = message
                        data["choices"][0] = first

                    # If content is a string, strip code fences / normalize embedded JSON.
                    if isinstance(message.get("content"), str):
                        message["content"] = _normalize_message_content(message["content"])
                        first["message"] = message
                        data["choices"][0] = first

                    # If content is missing/null, use raw response text as a fallback
                    if message.get("content") in (None, ""):
                        message["content"] = response.text
                        first["message"] = message
                        data["choices"][0] = first
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Error normalizing OpenRouter response: %s", exc)
            return {"choices": [{"message": {"content": response.text}}]}

        return data


_openrouter_client: OpenRouterClient | None = None


def get_openrouter_client() -> OpenRouterClient:
    """Return a singleton OpenRouter client configured from settings."""
    global _openrouter_client

    if _openrouter_client is None:
        if not settings.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY is not configured")

        _openrouter_client = OpenRouterClient(
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
            app_name=settings.OPENROUTER_APP_NAME,
            referer=settings.BACKEND_URL,
        )

    return _openrouter_client
