"""Re-exports for consolidated Polar meter models.

The canonical models live in `polar.subscription.model` (consolidated file).
This module provides backward-compatible imports used elsewhere in the codebase.
"""

from pydantic import BaseModel

from app.lib.polar.subscription.model import MeterEntry, MeterListResponse


class SingletonMeterResponse(BaseModel):
  balance: float
  consumed: float
  limit: int


__all__ = ["MeterEntry", "MeterListResponse"]
