# Models Package - Central Exports

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
]
