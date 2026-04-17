from polar_sdk import Subscription

from backend.app.lib.polar.client import get_polar_client
from backend.app.lib.polar.subscription.model import SubscriptionItem, SubscriptionListResponse
from backend.app.lib.polar.utils import get_external_customer_id_for_team
from fastapi.logger import logger


def get_subscription_for_team(team_id: str, index: int = 0) -> Subscription | None:
  """Lists the active subscriptions for a team's external customer id.

  This resolves the team's `polar_customer_id` if present and uses it as the
  `external_customer_id` when calling the Polar SDK. Falls back to `team_id`
  when no Polar id is present (useful during backfill rollout).
  """
  res = get_polar_client().subscriptions.list(external_customer_id=team_id, active=True)

  if not res or len(res.result.items) == 0:
    return None

  return res.result.items[index]


def get_subscription_for_customer(customer_id: str, index: int = 0) -> SubscriptionItem:
  """Lists the active subscriptions for customer"""
  res = get_polar_client().subscriptions.list(customer_id=customer_id, active=True);
  
  if not res:
    raise Exception(f"Failed to get subscription for customer: {customer_id}")
    
  return SubscriptionListResponse.model_validate(res).items[index]

