from config import Config
from unsplash.api import Api
from unsplash.auth import Auth

# Create Auth object with just access key (no OAuth flow needed for public API)
auth = Auth(
    client_id=Config.UNSPLASH_ACCESS_KEY,
    client_secret="",  # Not needed for public API
    redirect_uri=""
)
api = Api(auth)
