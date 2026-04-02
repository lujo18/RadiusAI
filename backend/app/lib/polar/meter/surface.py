from backend.app.lib.polar.meter.service import get_meter_for_customer, get_meter_by_subscription
from backend.app.lib.polar.subscription.model import SubscriptionItem



def get_credit_usage_for_subscription(sub: SubscriptionItem):
  return get_meter_by_subscription(sub, "credits")

def get_credit_usage_for_customer(customer_id: str):
  return get_meter_for_customer(customer_id, "credits")

def get_credit_usage_for_team(team_id: str):
  return get_meter_for_customer(team_id, "credits")
  




# TODO! Continue writing getters for credits, then create a dedicated router