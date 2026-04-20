from app.core.config import settings

# Lazy import in __getattr__ is intentional to avoid optional dependency/runtime issues
# pylint: disable=import-outside-toplevel


class GeminiClient:
    """Lazy-loading Gemini client to avoid import issues"""

    def __init__(self):
        self._client = None

    def __getattr__(self, name):
        if self._client is None:
            # Lazy import to avoid Python 3.14 protobuf issues at startup
            from google import genai

            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return getattr(self._client, name)


client = GeminiClient()
