"""
⚠️ DEPRECATED: Util Package

Utilities have been migrated to feature-based architecture:
- genai utilities → app/shared/genai/
- security utilities → app/shared/security/
- time utilities → app/shared/time/
- data utilities → app/shared/data/
- stock packs → app/features/stock_packs/utils/

This __init__.py provides backwards compatibility during transition.
DO NOT USE FOR NEW CODE - import from app.shared.* instead.
"""

# Re-export for backwards compatibility (DEPRECATED)
try:
    from app.shared.security.generate_state import generate_state
    from app.shared.security.decode_state import decode_state
except ImportError:
    pass

try:
    from app.shared.genai.system_prompt import SYSTEM_PROMPT
    from app.shared.genai.llm_output_sanitizer import sanitize_text
except ImportError:
    pass

try:
    from app.shared.time.utils import to_iso
except ImportError:
    pass

try:
    from app.shared.data.text_to_dataframe import gemini_text_to_dataframe, simple_gemini_to_df
except ImportError:
    pass

