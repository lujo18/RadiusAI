"""Backwards-compatible shim exposing automation worker functions.

Some tests import `app.core.workers.automation.automation_worker` directly.
This module re-exports the real implementations from the services package.
"""

from backend.services.workers.automation.automation_worker import (
    run_automation,
    process_due_automations,
)

__all__ = ["run_automation", "process_due_automations"]
