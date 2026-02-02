from fastapi import APIRouter, HTTPException, Depends
from backend.services.integrations.supabase.stripe import PlansRepository
from backend.auth import get_current_user
from backend.services.usage import repo as usage_repo

router = APIRouter(prefix="/api/stripe", tags=["stripe"])

@router.get("/plans")
def get_plans(user=Depends(get_current_user)):
    try:
        plans = PlansRepository.get_plans()
        return plans
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch plans: {str(e)}")

@router.get("/plans/{plan_id}")
def get_plan(plan_id: str, user=Depends(get_current_user)):
    try:
        plan = PlansRepository.get_plan(plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        return plan
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch plan: {str(e)}")

@router.post("/plans")
def create_plan(plan_data: dict, user=Depends(get_current_user)):
    try:
        plan = PlansRepository.create_plan(plan_data)
        return plan
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create plan: {str(e)}")

@router.patch("/plans/{plan_id}")
def update_plan(plan_id: str, updates: dict, user=Depends(get_current_user)):
    try:
        # Separate out explicit `rules` payload and any numeric limits
        prl_result = None
        rules = None
        if isinstance(updates, dict):
            # Extract provided rules JSON if present
            if 'rules' in updates:
                rules = updates.pop('rules')

            # Capture limit-style fields and remove them from updates so we don't write unknown columns to `plans`
            limit_keys = ['ai_credits', 'max_brands', 'max_posts_per_month', 'max_slides_per_month']
            limits = {k: updates.pop(k) for k in limit_keys if k in updates}

            # Merge numeric limits into rules JSON under a `limits` key
            if limits:
                if isinstance(rules, dict):
                    existing_limits = rules.get('limits') if isinstance(rules.get('limits'), dict) else {}
                    existing_limits.update(limits)
                    rules['limits'] = existing_limits
                else:
                    rules = {'limits': limits} if not rules else {'limits': limits, 'value': rules}

            # If we now have rules (either provided or built from limits), persist them
            if rules is not None:
                try:
                    prl_result = usage_repo.set_product_rate_limit(plan_id, rules)
                except Exception:
                    # bubble up to caller as a 400
                    raise

        # We do NOT update the plans table here. Persist limits/rules to product_rate_limits only.
        if prl_result:
            return prl_result

        # No rules/limits provided — nothing to update
        raise HTTPException(status_code=400, detail="No rules or limits provided to update")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update plan: {str(e)}")

@router.delete("/plans/{plan_id}")
def delete_plan(plan_id: str, user=Depends(get_current_user)):
    try:
        PlansRepository.delete_plan(plan_id)
        return {"message": "Plan deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete plan: {str(e)}")
