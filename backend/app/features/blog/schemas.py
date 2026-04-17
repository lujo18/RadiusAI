from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class BlogGenerateRequest(BaseModel):
    keyword: str = Field(..., min_length=3, max_length=200)
    tone: str = Field(default="expert", min_length=2, max_length=80)
    audience: Optional[str] = Field(default=None, max_length=120)
    publish_immediately: bool = False


class BlogDraftResponse(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    cover_image_url: Optional[str] = None
    seo_keywords: list[str] = Field(default_factory=list)


class BlogGenerateResponse(BaseModel):
    draft: BlogDraftResponse
    published_post: Optional["BlogPostResponse"] = None


class BlogPublishRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=220)
    slug: Optional[str] = Field(default=None, max_length=240)
    excerpt: str = Field(..., min_length=20, max_length=400)
    content: str = Field(..., min_length=80)
    cover_image_url: Optional[str] = None
    seo_keywords: list[str] = Field(default_factory=list)
    is_published: bool = False


class BlogPostResponse(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: Optional[str] = None
    content: str
    cover_image_url: Optional[str] = None
    seo_keywords: list[str] = Field(default_factory=list)
    author_id: Optional[str] = None
    is_published: bool = False
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class BlogListResponse(BaseModel):
    posts: list[BlogPostResponse] = Field(default_factory=list)


BlogGenerateResponse.model_rebuild()
