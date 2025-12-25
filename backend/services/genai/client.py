from backend.config import Config

class GeminiClient:
    """Lazy-loading Gemini client to avoid import issues"""
    def __init__(self):
        self._client = None
        
    def __getattr__(self, name):
        if self._client is None:
            # Lazy import to avoid Python 3.14 protobuf issues at startup
            import google.generativeai as genai
            genai.configure(api_key=Config.GEMINI_API_KEY)
            self._client = genai.GenerativeModel('gemini-2.0-flash-exp')
        return getattr(self._client, name)

client = GeminiClient()