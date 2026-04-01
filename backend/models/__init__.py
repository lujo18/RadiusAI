"""
⚠️ DEPRECATED MODELS PACKAGE

This package contains LEGACY Pydantic models from the old architecture.

MIGRATION STATUS:
✅ WRAPPED:  team.py (re-exports from app.features.team.schemas)

🔄 LEGACY (still in use, marked for future migration):
  - analytics.py          → app.features.analytics.schemas
  - brand.py              → app.features.brand.schemas
  - enums.py              → app.constants or app.shared
  - gemini.py             → app.features.generate.schemas (genai models)
  - platform_integration.py → app.features.integrations schemas
  - post.py               → app.features.posts.schemas
  - postforme_analytics.py → app.features.analytics.schemas
  - slide.py              → app.features.posts.schemas
  - template.py           → app.features.templates.schemas
  - user.py               → app.features.user.schemas
  - user_activity.py      → app.features.analytics.schemas
  - variant.py            → app.features.variants.schemas

IMPORT PATTERN:
For new code, import from app.features.{feature}.schemas instead.
For legacy code still using backend.models, imports will continue to work.

DO NOT ADD NEW MODELS HERE.
"""

# During migration many legacy modules may be absent; silence import-error
# warnings in this shim so lint focuses on actionable issues elsewhere.
# The file uses broad catch-all imports as a best-effort shim; silence that
# pylint: disable=import-error,broad-except

# Models Package - Central Exports (LEGACY - DO NOT EXPAND)

try:
    from .enums import (
        TemplateCategory,
        TemplateStatus,
        HookStyle,
        BackgroundType,
        AspectRatio,
        VariantSetStatus,
    )
except Exception:  # pragma: no cover - best-effort legacy import
    pass

try:
    from .template import (
        LayoutConfig,
        ContentRules,
        StyleConfig,
        TemplatePerformance,
        Template,
        CreateTemplateRequest,
        UpdateTemplateRequest,
    )
except Exception:  # pragma: no cover - best-effort legacy import
    pass

try:
    from .gemini import (
        Slide,
        GeminiCarouselResponse,
        GenerateContentRequest,
        GenerateContentResponse,
    )
except Exception:  # pragma: no cover - best-effort legacy import
    pass

try:
    from .post import (
        StorageUrls,
        PostAnalytics,
        PostMetadata,
        Post,
        CreatePostRequest,
        UpdatePostRequest,
    )
except Exception:  # pragma: no cover - best-effort legacy import
    pass

try:
    from .analytics import (
        PostMetrics,
        Analytics,
        TrackAnalyticsRequest,
    )
except Exception:  # pragma: no cover - best-effort legacy import
    pass

try:
    from .variant import (
        TemplateStats,
        VariantSetResults,
        VariantSet,
        CreateVariantSetRequest,
    )
except Exception:  # pragma: no cover - best-effort legacy import
    pass

try:
    from .user import (
        BrandSettings,
        UpdateProfileRequest,
    )
except Exception:  # pragma: no cover - best-effort legacy import
    pass

try:
    from .platform_integration import (
        PlatformIntegration,
        IntegrationStatus,
    )
except Exception:  # pragma: no cover - best-effort legacy import
    pass

ALL = [
    # Enums
    "TemplateCategory",
    "TemplateStatus",
    "HookStyle",
    "BackgroundType",
    "AspectRatio",
    "VariantSetStatus",
    # Template models
    "BackgroundConfig",
    "FontConfig",
    "VisualConfig",
    "LayoutConfig",
    "ContentRules",
    "StyleConfig",
    "TemplatePerformance",
    "Template",
    "CreateTemplateRequest",
    "UpdateTemplateRequest",
    # Gemini models
    "Slide",
    "GeminiCarouselResponse",
    "GenerateContentRequest",
    "GenerateContentResponse",
    # Post models
    "StorageUrls",
    "PostAnalytics",
    "PostMetadata",
    "Post",
    "CreatePostRequest",
    "UpdatePostRequest",
    # Analytics models
    "PostMetrics",
    "Analytics",
    "TrackAnalyticsRequest",
    # Variant models
    "TemplateStats",
    "VariantSetResults",
    "VariantSet",
    "CreateVariantSetRequest",
    # User models
    "BrandSettings",
    "UpdateProfileRequest",
    "PlatformIntegration",
    "IntegrationStatus",
]

# Only export names that actually exist in this runtime environment.
# This avoids spurious lint errors during partial migrations where some
# legacy models have been moved to `app.features.*`.
__all__ = [name for name in ALL if name in globals()]
