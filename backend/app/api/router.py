"""
Central API router - aggregates all feature routers

Each feature module provides a router; this file wires them together.
"""

from fastapi import APIRouter

api_router = APIRouter(prefix="/api")

# ═════════ Feature-Based Routers (New Architecture) ═════════

# Users: Registration, authentication, profile
from app.features.user.router import router as users_router

api_router.include_router(users_router, prefix="/v1", tags=["auth"])

# Brands: Brand profiles and settings
from app.features.brand.router import router as brands_router

api_router.include_router(brands_router, prefix="/v1", tags=["brands"])

# Templates: Content templates with slide designs
from app.features.templates.router import router as templates_router

api_router.include_router(templates_router, prefix="/v1", tags=["templates"])

# Posts: Generated social media posts
from app.features.posts.router import router as posts_router

api_router.include_router(posts_router, prefix="/v1", tags=["posts"])

# Generate: AI-powered content generation
from app.features.generate.router import router as generate_router

api_router.include_router(generate_router, prefix="/v1", tags=["content-generation"])

# Integrations: OAuth-linked social media accounts
from app.features.integrations.router import router as integrations_router

api_router.include_router(integrations_router, prefix="/v1", tags=["integrations"])

# Usage: Quota tracking and rate limiting
from app.features.usage.router import router as usage_router

api_router.include_router(usage_router, prefix="/v1", tags=["usage"])

# Teams: Multi-user team management and collaboration
from app.features.team.router import router as teams_router

api_router.include_router(teams_router, prefix="/v1", tags=["teams"])

# Billing: Stripe subscription and payment management
from app.lib.polar.router import router as billing_router

api_router.include_router(billing_router, prefix="/v1", tags=["billing"])

# Analytics: Post performance tracking and metrics
from app.features.analytics.router import router as analytics_router

api_router.include_router(analytics_router, prefix="/v1", tags=["analytics"])

# Variants: A/B testing with template variants
from app.features.variants.router import router as variants_router

api_router.include_router(variants_router, prefix="/v1", tags=["variants"])

# Blog: Public blog content and admin blog generation endpoints
from app.features.blog.router import router as blog_router
from app.features.blog.router import admin_router as admin_blog_router

api_router.include_router(blog_router, prefix="/v1", tags=["blog"])
api_router.include_router(admin_blog_router, tags=["admin-blog"])
