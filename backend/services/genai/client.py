from backend.config import Config

class GeminiClient:
    """Lazy-loading Gemini client to avoid import issues"""
    def __init__(self):
        self._client = None
        
    def __getattr__(self, name):
        if self._client is None:
            # Lazy import to avoid Python 3.14 protobuf issues at startup
            from google import genai
            self._client = genai.Client(api_key=Config.GEMINI_API_KEY)
        return getattr(self._client, name)

client = GeminiClient()