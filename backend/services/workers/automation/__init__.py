"""
Automation worker package for scheduled carousel generation.
"""

from .automation_worker import process_due_automations, run_automation
from .helpers import (
    fetch_due_automations,
    lock_automation_row,
    get_template_by_id,
    get_cta_by_id,
    insert_automation_run,
    update_automation_after_success,
    update_automation_after_failure,
)
from .schedule_calculator import compute_next_run, validate_schedule

__all__ = [
    "process_due_automations",
    "run_automation",
    "fetch_due_automations",
    "lock_automation_row",
    "get_template_by_id",
    "get_cta_by_id",
    "insert_automation_run",
    "update_automation_after_success",
    "update_automation_after_failure",
    "compute_next_run",
    "validate_schedule",
]
