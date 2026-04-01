class PolarError(Exception):
    """Base Polar integration error."""


class PolarConfigurationError(PolarError):
    """Raised when Polar is not configured properly (missing API key, etc.)."""


class PolarAPIError(PolarError):
    """Raised for non-configuration Polar API errors."""
