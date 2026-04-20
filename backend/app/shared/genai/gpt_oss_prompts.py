"""Compatibility shim that re-exports `assemble_generation_prompt`.

Legacy code imports this from `app.shared.genai.gpt_oss_prompts`.
Forward the call to the feature-scoped implementation under
`app.features.generate.genai.gpt_oss_prompts`.
"""

from app.features.generate.genai.gpt_oss_prompts import (
    assemble_generation_prompt,
)

__all__ = ["assemble_generation_prompt"]
