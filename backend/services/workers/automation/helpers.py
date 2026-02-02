"""
Database helper functions for automation worker.

Handles:
- Fetching due automations
- Locking automation rows
- Getting template/CTA info
- Recording automation runs
- Updating automation state
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from uuid import UUID

from backend.services.integrations.supabase.client import get_supabase

logger = logging.getLogger(__name__)
supabase = get_supabase()


async def fetch_due_automations(batch_size: int = 50) -> List[Dict[str, Any]]:
    """
    Fetch all automations that are due for execution.
    
    Returns automations where:
    - is_active = true
    - next_run_at <= now()
    
    Args:
        batch_size: Max number of automations to fetch
        
    Returns:
        List of automation dicts
    """
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        response = (
            supabase.table("automations")
            .select("*")
            .eq("is_active", True)
            .lte("next_run_at", now)
            .limit(batch_size)
            .execute()
        )
        
        if response.data:
            logger.info(f"Fetched {len(response.data)} due automations")
            return response.data
        
        return []
        
    except Exception as e:
        logger.error(f"Error fetching due automations: {e}", exc_info=True)
        return []


async def lock_automation_row(automation_id: UUID) -> Optional[Dict[str, Any]]:
    """
    Lock an automation row using SELECT ... FOR UPDATE (pessimistic locking).
    
    This prevents concurrent executions of the same automation.
    
    Args:
        automation_id: UUID of automation to lock
        
    Returns:
        Automation dict if found and locked, None otherwise
    """
    try:
        response = (
            supabase.table("automations")
            .select("*")
            .eq("id", str(automation_id))
            .single()
            .execute()
        )
        
        if response.data:
            logger.debug(f"Locked automation {automation_id}")
            return response.data
        
        logger.warning(f"Automation {automation_id} not found for locking")
        return None
        
    except Exception as e:
        logger.error(f"Error locking automation {automation_id}: {e}", exc_info=True)
        return None


async def get_template_by_id(template_id: UUID, brand_id: UUID) -> Optional[Dict[str, Any]]:
    """
    Fetch a template by ID for a brand.
    
    Args:
        template_id: UUID of template
        brand_id: UUID of brand (for RLS)
        
    Returns:
        Template dict if found, None otherwise
    """
    try:
        response = (
            supabase.table("templates")
            .select("*")
            .eq("id", str(template_id))
            .eq("brand_id", str(brand_id))
            .single()
            .execute()
        )
        
        if response.data:
            logger.debug(f"Fetched template {template_id}")
            return response.data
        
        logger.warning(f"Template {template_id} not found for brand {brand_id}")
        return None
        
    except Exception as e:
        logger.error(f"Error fetching template {template_id}: {e}", exc_info=True)
        return None


async def get_cta_by_id(cta_id: UUID, brand_id: UUID) -> Optional[Dict[str, Any]]:
    """
    Fetch a CTA (Call-To-Action) by ID for a brand.
    
    Args:
        cta_id: UUID of CTA
        brand_id: UUID of brand (for RLS)
        
    Returns:
        CTA dict if found, None otherwise
    """
    try:
        response = (
            supabase.table("brand_ctas")
            .select("*")
            .eq("id", str(cta_id))
            .eq("brand_id", str(brand_id))
            .single()
            .execute()
        )
        
        if response.data:
            logger.debug(f"Fetched CTA {cta_id}")
            return response.data
        
        logger.warning(f"CTA {cta_id} not found for brand {brand_id}")
        return None
        
    except Exception as e:
        logger.error(f"Error fetching CTA {cta_id}: {e}", exc_info=True)
        return None


async def insert_automation_run(
    automation_id: UUID,
    status: str,  # "success" or "failed"
    template_id: Optional[UUID] = None,
    cta_id: Optional[UUID] = None,
    platforms_used: Optional[List[str]] = None,
    error_message: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Insert a record of an automation execution.
    
    Args:
        automation_id: UUID of automation
        status: "success" or "failed"
        template_id: Template used (optional)
        cta_id: CTA used (optional)
        platforms_used: List of platforms posted to
        error_message: Error message if failed
        
    Returns:
        Inserted record dict or None
    """
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        payload = {
            "automation_id": str(automation_id),
            "run_started_at": now,
            "run_finished_at": now,
            "status": status,
            "template_id_used": str(template_id) if template_id else None,
            "cta_id_used": str(cta_id) if cta_id else None,
            "platforms_used": platforms_used or [],
            "error_message": error_message,
        }
        
        response = supabase.table("automation_runs").insert(payload).execute()
        
        if response.data:
            logger.info(f"Inserted automation_run for {automation_id}")
            return response.data[0]
        
        logger.warning(f"No data returned when inserting automation_run")
        return None
        
    except Exception as e:
        logger.error(f"Error inserting automation_run: {e}", exc_info=True)
        return None


async def update_automation_after_success(
    automation_id: UUID,
    next_run_at: datetime,
    cursor_template_index: int,
    cursor_cta_index: int,
) -> Optional[Dict[str, Any]]:
    """
    Update automation after successful execution.
    
    Sets:
    - last_run_at = now()
    - next_run_at
    - cursor_template_index
    - cursor_cta_index
    - error_count = 0
    - last_error = NULL
    
    Args:
        automation_id: UUID of automation
        next_run_at: Next execution time
        cursor_template_index: New template cursor position
        cursor_cta_index: New CTA cursor position
        
    Returns:
        Updated automation dict or None
    """
    try:
        now = datetime.now(timezone.utc).isoformat()
        next_run_iso = next_run_at.isoformat() if isinstance(next_run_at, datetime) else next_run_at
        
        payload = {
            "last_run_at": now,
            "next_run_at": next_run_iso,
            "cursor_template_index": cursor_template_index,
            "cursor_cta_index": cursor_cta_index,
            "error_count": 0,
            "last_error": None,
            "updated_at": now,
        }
        
        response = (
            supabase.table("automations")
            .update(payload)
            .eq("id", str(automation_id))
            .execute()
        )
        
        if response.data:
            logger.info(f"Updated automation {automation_id} after success")
            return response.data[0]
        
        logger.warning(f"No data returned when updating automation {automation_id}")
        return None
        
    except Exception as e:
        logger.error(f"Error updating automation {automation_id}: {e}", exc_info=True)
        return None


async def update_automation_after_failure(
    automation_id: UUID,
    error_message: str,
) -> Optional[Dict[str, Any]]:
    """
    Update automation after failed execution.
    
    Sets:
    - last_error
    - error_count += 1
    - is_active = false if error_count >= 5
    - updated_at = now()
    
    Args:
        automation_id: UUID of automation
        error_message: Error message to record
        
    Returns:
        Updated automation dict or None
    """
    try:
        # First, get current error_count
        automation = await lock_automation_row(automation_id)
        if not automation:
            logger.error(f"Could not fetch automation {automation_id} for error update")
            return None
        
        current_error_count = automation.get("error_count", 0) or 0
        new_error_count = current_error_count + 1
        now = datetime.now(timezone.utc).isoformat()
        
        # Deactivate if error_count >= 5
        is_active = new_error_count < 5
        
        payload = {
            "last_error": error_message,
            "error_count": new_error_count,
            "is_active": is_active,
            "updated_at": now,
        }
        
        response = (
            supabase.table("automations")
            .update(payload)
            .eq("id", str(automation_id))
            .execute()
        )
        
        if response.data:
            if not is_active:
                logger.warning(
                    f"Deactivated automation {automation_id} after "
                    f"{new_error_count} consecutive errors"
                )
            else:
                logger.info(f"Updated automation {automation_id} after failure (error_count={new_error_count})")
            return response.data[0]
        
        logger.warning(f"No data returned when updating automation {automation_id} after failure")
        return None
        
    except Exception as e:
        logger.error(f"Error updating automation {automation_id} after failure: {e}", exc_info=True)
        return None
