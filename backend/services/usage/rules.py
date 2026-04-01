from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field, validator
from enum import Enum
from app.features.usage import repo as usage_repo


class RuleType(str, Enum):
    fixed = "fixed"
    rate = "rate"


class BaseRule(BaseModel):
    id: Optional[str]
    type: RuleType
    metric: Optional[str] = Field(
        None, description="team_activity metric to check, e.g., post_count"
    )
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


def _normalize_rules_input(raw: Any) -> Optional[Dict[str, Any]]:
    """Normalize different rules payload shapes into {schema_version, rules}.

    Supported inputs:
    - {"schema_version": 1, "rules": [{...}]}
    - [{...rule...}, {...rule...}]
    - {"limits": {"post_count": 100, "credits": 500}}
    - {"rules": [{"limits": {...}}]} (legacy nested form)
    """
    if raw is None:
        return None

    def _legacy_limits_to_rules(limits: Dict[str, Any]) -> List[Dict[str, Any]]:
        normalized_rules: List[Dict[str, Any]] = []
        for metric_name, metric_limit in (limits or {}).items():
            if metric_limit is None:
                continue
            try:
                normalized_rules.append(
                    {
                        "id": f"legacy-{metric_name}",
                        "type": "fixed",
                        "metric": str(metric_name),
                        "limit": int(metric_limit),
                    }
                )
            except Exception:
                continue
        return normalized_rules

    if isinstance(raw, list):
        return {"schema_version": 1, "rules": raw}

    if isinstance(raw, dict):
        schema_version = raw.get("schema_version", 1)

        if "rules" in raw:
            maybe_rules = raw.get("rules")
            if isinstance(maybe_rules, list):
                expanded_rules: List[Dict[str, Any]] = []
                for item in maybe_rules:
                    if (
                        isinstance(item, dict)
                        and "limits" in item
                        and isinstance(item.get("limits"), dict)
                    ):
                        expanded_rules.extend(
                            _legacy_limits_to_rules(item.get("limits") or {})
                        )
                    else:
                        expanded_rules.append(item)
                return {"schema_version": schema_version, "rules": expanded_rules}
            return None

        if "limits" in raw and isinstance(raw.get("limits"), dict):
            return {
                "schema_version": schema_version,
                "rules": _legacy_limits_to_rules(raw.get("limits") or {}),
            }

        # Single rule object fallback
        return {"schema_version": schema_version, "rules": [raw]}

    return None


def parse_rules(raw: Any) -> Optional[RulesDocument]:
    """Parse raw JSON from `product_rate_limits.rules` into a RulesDocument.

    Accepts either a dict with `rules` or a list of rule dicts.
    Returns None on parse error.
    """
    try:
        normalized = _normalize_rules_input(raw)
        if not normalized:
            return None

        doc = RulesDocument(**normalized)
        return doc
    except Exception as e:
        print("Failed to parse rules document", e)
        return None


def evaluate_rules_for_user(
    team_id: str, rules_doc: RulesDocument, amount: int = 1
) -> Dict[str, Any]:
    """Evaluate all rules for a team; returns aggregated result.

    Result: {allowed: bool, failures: [...], details: [...], remaining: int|null}
    """
    details = []
    failures = []
    remaining_values: List[int] = []

    ua = usage_repo.get_team_activity(team_id) or {}
    # Support centralized `usage` JSON column: prefer ua['usage'][metric], fall back to top-level
    usage_map = ua.get("usage") or {}

    for r in rules_doc.rules:
        metric = r.metric or "post_count"
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

    return {
        "allowed": allowed,
        "failures": failures,
        "details": details,
        "remaining": remaining,
    }
