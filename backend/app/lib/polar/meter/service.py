from typing import List, Optional
import logging

from polar_sdk import CustomerMeter

from backend.app.lib.polar.client import get_polar_client
from backend.app.lib.polar.meter.model import MeterEntry, MeterListResponse
from backend.app.lib.polar.utils import get_external_customer_id_for_team
from backend.app.lib.polar.subscription.model import MeterEntry, SubscriptionItem
from backend.app.lib.polar.subscription.service import (
    get_subscription_for_customer,
    get_subscription_for_team,
)

logger = logging.getLogger(__name__)


def list_meters_for_team(team_id: str) -> List[CustomerMeter] | None:
    """List all meters for a given team."""

    with get_polar_client() as client:
        res = client.customer_meters.list(customer_id=team_id)

        if not res:
            return None

        if isinstance(res, list):
            return res

        items = getattr(getattr(res, "result", None), "items", None)
        if isinstance(items, list):
            return items

        return None


def get_meter_for_team(team_id: str, meter_name: str) -> CustomerMeter | None:
    """Return the latest meter entry for the given team's external customer id.

    Resolves `polar_customer_id` via `get_external_customer_id_for_team` so callers
    don't have to worry about whether the team has been backfilled.
    """

    with get_polar_client() as client:
        
        
        res = client.customer_meters.list(external_customer_id=team_id)
        
        if not res:
            return None

        items = res.result.items
        logger.info(f"Meter res for {team_id}: {items}")
        for meter in items or []:
            if getattr(getattr(meter, "meter", None), "name", None) == meter_name:
                
                logger.info(f"Meter for {meter_name}: {meter}")
                return meter

        return None

def increment_meter_for_team(team_id: str, meter_name: str, amount: float) -> Optional[CustomerMeter]:
    """Increment the stored meter value for `team_id` by ingesting an event.

    Uses Polar's Events ingest API per the SDK docs: `polar.events.ingest(request={"events": [...]})`.
    Returns the raw ingest response from the Polar client.
    """
    if amount is None:
        raise ValueError("amount is required")

    external_customer_id = get_external_customer_id_for_team(team_id)

    try:
        with get_polar_client() as client:
            payload = {
                "events": [
                    {
                        "customer_id": external_customer_id,
                        "name": meter_name,
                        "value": amount,
                    }
                ]
            }

            # Per Polar SDK docs: ingest expects a `request` mapping with `events`.
            res = client.events.ingest(request=payload)

            return res

    except Exception as exc:
        logger.exception("Failed to ingest meter event for team %s meter %s", team_id, meter_name)
        raise


def get_meter_for_customer(customer_id: str, meter_name: str) -> MeterEntry | None:
    sub = get_subscription_for_customer(customer_id)
    return get_meter_by_subscription(sub, meter_name)


def get_meter_by_subscription(sub: SubscriptionItem, meter_name: str) -> MeterEntry | None:
    for m in sub.meters: 
        if m.meter.name == meter_name:
            return m


