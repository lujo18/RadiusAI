from ..client import get_stripe_supabase
from typing import List, Optional

class PlansRepository:
    @staticmethod
    def get_plans() -> List[dict]:
        """Get all plans ordered by plan_id"""
        supabase = get_stripe_supabase()
        response = supabase.table('plans').select('*').order('plan_id').execute()
        return response.data if response.data else []

    @staticmethod
    def get_plan(plan_id: str) -> Optional[dict]:
        """Get a single plan by plan_id"""
        supabase = get_stripe_supabase()
        response = supabase.table('plans').select('*').eq('plan_id', plan_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def create_plan(plan_data: dict) -> dict:
        """Create a new plan"""
        supabase = get_stripe_supabase()
        response = supabase.table('plans').insert(plan_data).execute()
        if not response.data:
            raise ValueError("Failed to create plan")
        return response.data[0]

    @staticmethod
    def update_plan(plan_id: str, updates: dict) -> dict:
        """Update an existing plan"""
        supabase = get_stripe_supabase()
        response = supabase.table('plans').update(updates).eq('plan_id', plan_id).execute()
        if not response.data:
            raise ValueError("Plan not found")
        return response.data[0]

    @staticmethod
    def delete_plan(plan_id: str) -> bool:
        """Delete a plan"""
        supabase = get_stripe_supabase()
        response = supabase.table('plans').delete().eq('plan_id', plan_id).execute()
        return True
