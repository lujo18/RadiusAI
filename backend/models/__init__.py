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

# Models Package - Central Exports (LEGACY - DO NOT EXPAND)

from .enums import (
    TemplateCategory,
    TemplateStatus,
    HookStyle,
    BackgroundType,
    AspectRatio,
    VariantSetStatus,
)

from .template import (
    LayoutConfig,
    ContentRules,
    StyleConfig,
    TemplatePerformance,
    Template,
    CreateTemplateRequest,
    UpdateTemplateRequest,
)

from .gemini import (
    Slide,
    GeminiCarouselResponse,
    GenerateContentRequest,
    GenerateContentResponse,
)

from .post import (
    StorageUrls,
    PostAnalytics,
    PostMetadata,
    Post,
    CreatePostRequest,
    UpdatePostRequest,
)

from .analytics import (
    PostMetrics,
    Analytics,
    TrackAnalyticsRequest,
)

from .variant import (
    TemplateStats,
    VariantSetResults,
    VariantSet,
    CreateVariantSetRequest,
)

from .user import (
    BrandSettings,
    UpdateProfileRequest,
)
from .platform_integration import (
    PlatformIntegration,
    IntegrationStatus,
)

__all__ = [
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
