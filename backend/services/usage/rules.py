from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field, validator
from enum import Enum
from backend.services.usage import repo as usage_repo


class RuleType(str, Enum):
    fixed = "fixed"
    rate = "rate"


class BaseRule(BaseModel):
    id: Optional[str]
    type: RuleType
    metric: Optional[str] = Field(None, description="user_activity metric to check, e.g., post_count")
    limit: Optional[int]
    window: Optional[str] = None

    @validator("limit")
    def limit_non_negative(cls, v):
        if v is None:
            return v
        if int(v) < 0:
            raise ValueError("limit must be >= 0")
        return int(v)


class RulesDocument(BaseModel):
    schema_version: Optional[int] = 1
    rules: List[BaseRule] = []


def parse_rules(raw: Any) -> Optional[RulesDocument]:
    """Parse raw JSON from `product_rate_limits.rules` into a RulesDocument.

    Accepts either a dict with `rules` or a list of rule dicts.
    Returns None on parse error.
    """
    if raw is None:
        return None
    try:
        if isinstance(raw, list):
            doc = RulesDocument(rules=raw)
        elif isinstance(raw, dict):
            # normalize
            if 'rules' in raw:
                doc = RulesDocument(**raw)
            else:
                # assume dict is single rule
                doc = RulesDocument(rules=[raw])
        else:
            return None
        return doc
    except Exception as e:
        print("Failed to parse rules document", e)
        return None


def evaluate_rules_for_user(user_id: str, rules_doc: RulesDocument, amount: int = 1) -> Dict[str, Any]:
    """Evaluate all rules for a user; returns aggregated result.

    Result: {allowed: bool, failures: [...], details: [...], remaining: int|null}
    """
    details = []
    failures = []
    remaining_values: List[int] = []

    ua = usage_repo.get_user_activity(user_id) or {}
    # Support centralized `usage` JSON column: prefer ua['usage'][metric], fall back to top-level
    usage_map = ua.get('usage') or {}

    for r in rules_doc.rules:
        metric = r.metric or 'post_count'
        used = int(usage_map.get(metric) or ua.get(metric) or 0)
        if r.type == RuleType.fixed:
            if r.limit is None:
                # no limit -> allowed
                rem = None
            else:
                rem = r.limit - used
                if rem < amount:
                    failures.append({"rule": r.dict(), "used": used, "remaining": rem})
                else:
                    remaining_values.append(rem)

            details.append({"rule": r.dict(), "used": used, "remaining": rem})

        elif r.type == RuleType.rate:
            # treat similarly to fixed for now
            if r.limit is None:
                rem = None
            else:
                rem = r.limit - used
                if rem < amount:
                    failures.append({"rule": r.dict(), "used": used, "remaining": rem})
                else:
                    remaining_values.append(rem)
            details.append({"rule": r.dict(), "used": used, "remaining": rem})
        else:
            details.append({"rule": r.dict(), "used": used, "remaining": None})

    allowed = len(failures) == 0
    remaining = min(remaining_values) if remaining_values else None

    return {"allowed": allowed, "failures": failures, "details": details, "remaining": remaining}
