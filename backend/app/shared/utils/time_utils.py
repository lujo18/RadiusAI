# Time utility functions - migrated from backend/util/time/util.py
from datetime import datetime


def to_iso(val):
    """Convert unix timestamps to ISO format if needed"""
    if val is None:
        return None
    try:
        # stripe returns ints for many fields
        if isinstance(val, int):
            return datetime.utcfromtimestamp(val).isoformat()
        return val
    except Exception:
        return None


def _to_iso(val):
    """Alias for to_iso - legacy compatibility"""
    return to_iso(val)
