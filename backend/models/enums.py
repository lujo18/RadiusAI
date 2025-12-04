# Shared Enums

from enum import Enum

class TemplateCategory(str, Enum):
    LISTICLE = "listicle"
    QUOTE = "quote"
    STORY = "story"
    EDUCATIONAL = "educational"
    COMPARISON = "comparison"
    CUSTOM = "custom"

class TemplateStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    TESTING = "testing"

class HookStyle(str, Enum):
    QUESTION = "question"
    STATEMENT = "statement"
    NUMBER = "number"

class BackgroundType(str, Enum):
    GRADIENT = "gradient"
    SOLID = "solid"
    IMAGE = "image"

class AspectRatio(str, Enum):
    STORY = "9:16"
    SQUARE = "1:1"
    PORTRAIT = "4:5"

class VariantSetStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
