import warnings

warnings.warn(
    "backend.services.profile.connect_account is deprecated; use app.features.integrations.social.profile.connect_account",
    DeprecationWarning,
    stacklevel=2,
)

from app.features.integrations.social.profile.connect_account import connect_social

__all__ = ["connect_social"]
