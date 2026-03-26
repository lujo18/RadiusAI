# convert unix timestamps to iso if needed
from datetime import datetime


def to_iso(val):
    if val is None:
        return None
    try:
        # stripe returns ints for many fields
        if isinstance(val, int):
            return datetime.utcfromtimestamp(val).isoformat()
        return val
    except Exception:
        return None