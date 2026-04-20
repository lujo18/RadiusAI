from app.lib.groq.client import get_groq_client


# Backward-compatible export while Groq client lives under app/lib.
groq = get_groq_client()
