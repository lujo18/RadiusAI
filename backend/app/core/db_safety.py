"""Helpers for resilient SQLAlchemy access on schema-drifted environments.

These utilities avoid common runtime failures when ORM models include
optional columns that are not yet present in an older database schema.
"""

from typing import Any


def is_missing_column_error(exc: Exception) -> bool:
    """Return True if an exception message indicates a missing DB column."""
    message = str(exc).lower()
    return "column" in message and "does not exist" in message


def safe_instance_get(instance: Any, attr: str, default: Any = None) -> Any:
    """Read an ORM attribute without forcing a lazy-load when possible.

    SQLAlchemy stores loaded attributes in ``instance.__dict__``. Reading from
    that mapping first avoids triggering implicit IO that can fail in async
    contexts or on schema drift.
    """
    state = getattr(instance, "__dict__", None)
    if isinstance(state, dict) and attr in state:
        return state.get(attr)
    # Avoid calling getattr which may trigger SQLAlchemy lazy-loading
    # and perform IO in contexts that don't support it (see MissingGreenlet).
    return default


def model_has_column(model: Any, column_name: str) -> bool:
    """Check whether the ORM model declares a column name."""
    table = getattr(model, "__table__", None)
    if table is None:
        return False
    try:
        return column_name in table.columns.keys()
    except Exception:
        return False


def safe_set_if_column_exists(instance: Any, attr: str, value: Any) -> bool:
    """Set an ORM attribute only if the model declares that column."""
    if model_has_column(instance.__class__, attr):
        setattr(instance, attr, value)
        return True
    return False
