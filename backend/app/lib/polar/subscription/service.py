from backend.app.lib.polar.client import get_polar_client
from backend.app.lib.polar.subscription.model import SubscriptionItem, SubscriptionListResponse



def get_subscription_for_team(team_id: str, index: int = 0) -> SubscriptionItem:
  """Lists the active subscriptions for customer"""
  res = get_polar_client().subscriptions.list(external_customer_id=team_id, active=True);
  
  if not res:
    raise Exception(f"Failed to get subscription for team: {team_id}")
    
  return SubscriptionListResponse.model_validate(res).items[index]


def get_subscription_for_customer(customer_id: str, index: int = 0) -> SubscriptionItem:
  """Lists the active subscriptions for customer"""
  res = get_polar_client().subscriptions.list(customer_id=customer_id, active=True);
  
  if not res:
    raise Exception(f"Failed to get subscription for customer: {customer_id}")
    
  return SubscriptionListResponse.model_validate(res).items[index]

