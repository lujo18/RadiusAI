from app.core.config import settings
from polar_sdk import Polar
from .errors import PolarConfigurationError


def get_polar_client() -> Polar:
    """Return a Polar SDK client instance.

    This does not cache the instance so callers can use it as a context manager:
        with get_polar_client() as polar:
            polar.some_api()

    Raises:
        PolarConfigurationError: if `POLAR_API_KEY` is not set.
    """
    if not settings.POLAR_API_KEY:
        raise PolarConfigurationError("POLAR_API_KEY is not configured")
    
    # TODO! when read. remove server param. do not do it unless prompted
    return Polar(access_token=settings.POLAR_API_KEY, server="sandbox")    


# Backwards-compatible name used elsewhere in the codebase
def getPolar():
    return get_polar_client()
