# Shared Enums

from enum import Enum


class TemplateCategory(str, Enum):
    """Categories for templates used to group and select templates."""
    LISTICLE = "listicle"
    QUOTE = "quote"
    STORY = "story"
    EDUCATIONAL = "educational"
    COMPARISON = "comparison"
    CUSTOM = "custom"


class TemplateStatus(str, Enum):
    """Lifecycle status for a template."""
    ACTIVE = "active"
    ARCHIVED = "archived"
    TESTING = "testing"


class HookStyle(str, Enum):
    """Style of the opening hook for a slide (question/statement/number)."""
    QUESTION = "question"
    STATEMENT = "statement"
    NUMBER = "number"


class BackgroundType(str, Enum):
    """Types of background visuals supported by slide designs."""
    GRADIENT = "gradient"
    SOLID = "solid"
    IMAGE = "image"


class AspectRatio(str, Enum):
    """Common aspect ratios used for slide image/layout rendering."""
    STORY = "9:16"
    SQUARE = "1:1"
    PORTRAIT = "4:5"


class VariantSetStatus(str, Enum):
    """Status values for asynchronous variant generation sets."""
    RUNNING = "running"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
