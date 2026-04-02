from backend.app.lib.polar.subscription.model import MeterEntry, SubscriptionItem
from backend.app.lib.polar.subscription.service import get_subscription_for_customer, get_subscription_for_team


def get_meter_for_team(team_id: str, meter_name: str) -> MeterEntry | None:
    sub = get_subscription_for_team(team_id)
    return get_meter_by_subscription(sub, meter_name)


def get_meter_for_customer(customer_id: str, meter_name: str) -> MeterEntry | None:
    sub = get_subscription_for_customer(customer_id)
    return get_meter_by_subscription(sub, meter_name)


def get_meter_by_subscription(sub: SubscriptionItem, meter_name: str) -> MeterEntry | None:
    for m in sub.meters: 
        if m.meter.name == meter_name:
            return m


