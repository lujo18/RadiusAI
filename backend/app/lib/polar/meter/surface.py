from polar_sdk import CustomerMeter

from app.lib.polar.meter.model import SingletonMeterResponse
from app.lib.polar.meter.service import (
  get_meter_for_customer,
  get_meter_by_subscription,
  get_meter_for_team,
  list_meters_for_team as _list_meters_for_team,
)
from app.lib.polar.subscription.model import SubscriptionItem



def get_credit_usage_for_subscription(sub: SubscriptionItem):
  return get_meter_by_subscription(sub, "credits")

def get_credit_usage_for_customer(customer_id: str):
  return get_meter_for_customer(customer_id, "credits")

def get_basic_generation_for_team(team_id: str) -> SingletonMeterResponse:
  res = get_meter_for_team(team_id, "basic_generations")
  
  if not res:
    return SingletonMeterResponse(
      balance=0,
      consumed=0,
      limit=0
    )
  
  return SingletonMeterResponse(
    balance=res.balance,
    consumed=res.consumed_units,
    limit=res.credited_units
  )

def get_ai_credits_for_team(team_id: str):
  return get_meter_for_team(team_id, "ai_credits")


def get_credit_usage_for_team(team_id: str):
  return get_meter_for_team(team_id, "credits")

def list_meters_for_team(team_id: str):
    return _list_meters_for_team(team_id)
  

def increment_meter_for_team(team_id: str, meter_name: str, amount: float):
    # TODO! Implement this in the service layer and expose via router
    pass


