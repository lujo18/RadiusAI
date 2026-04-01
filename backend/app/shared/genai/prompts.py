"""Compatibility shim for shared genai prompts.

This module re-exports the central SYSTEM_PROMPT from
`app.shared.genai.system_prompt` so legacy imports continue to work
during the migration to feature-scoped generators.
"""

from .system_prompt import SYSTEM_PROMPT

__all__ = ["SYSTEM_PROMPT"]
