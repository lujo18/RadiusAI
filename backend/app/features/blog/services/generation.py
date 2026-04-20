import json
import logging
import re
from datetime import UTC, datetime
from typing import Any
from urllib.parse import quote_plus

import requests

from app.core.config import settings
from app.features.blog.schemas import BlogDraftResponse, BlogPublishRequest
from app.features.blog.services.repository import BlogRepository
from app.features.integrations.unsplash import queryUnsplashOnePhoto
from app.lib.ai_client import AIProvider, ai_client

logger = logging.getLogger(__name__)


class BlogGenerationService:
    def __init__(self, repository: BlogRepository | None = None):
        self.repository = repository or BlogRepository()

    def generate_draft(self, *, keyword: str, tone: str, audience: str | None = None) -> BlogDraftResponse:
        provider = self._resolve_provider(settings.DEFAULT_AI_PROVIDER)
        system_prompt = self._build_system_prompt()
        main_prompt = self._build_main_prompt(keyword=keyword, tone=tone, audience=audience)

        response_text = ai_client.call_ai(
            provider=provider,
            model_id="openai/gpt-oss-120b",
            system_prompt=system_prompt,
            main_prompt=main_prompt,
            temperature=0.6,
            top_p=0.9,
            max_completion_tokens=3500,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "seo_blog_draft",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "minLength": 10, "maxLength": 220},
                            "slug": {"type": "string", "minLength": 4, "maxLength": 240},
                            "excerpt": {"type": "string", "minLength": 50, "maxLength": 320},
                            "content": {"type": "string", "minLength": 800},
                            "seo_keywords": {
                                "type": "array",
                                "items": {"type": "string", "minLength": 2, "maxLength": 80},
                                "minItems": 3,
                                "maxItems": 12,
                            },
                        },
                        "required": ["title", "slug", "excerpt", "content", "seo_keywords"],
                    },
                },
            },
        )

        draft_data = json.loads(response_text.strip())
        title = str(draft_data.get("title") or "").strip()
        excerpt = str(draft_data.get("excerpt") or "").strip()
        content = str(draft_data.get("content") or "").strip()
        raw_slug = str(draft_data.get("slug") or "").strip()

        if not title or not excerpt or not content:
            raise ValueError("AI generation returned incomplete blog fields")

        slug = self._make_slug(raw_slug or title)
        seo_keywords = [str(item).strip() for item in (draft_data.get("seo_keywords") or []) if str(item).strip()]
        cover_image_url = queryUnsplashOnePhoto(keyword) if keyword else None

        return BlogDraftResponse(
            title=title,
            slug=slug,
            excerpt=excerpt,
            content=content,
            cover_image_url=cover_image_url,
            seo_keywords=seo_keywords,
        )

    def publish(self, payload: BlogPublishRequest, author_id: str) -> dict[str, Any]:
        slug = self._ensure_unique_slug(self._make_slug(payload.slug or payload.title))
        now = datetime.now(UTC).isoformat()

        post = self.repository.create(
            {
                "title": payload.title.strip(),
                "slug": slug,
                "excerpt": payload.excerpt.strip(),
                "content": payload.content.strip(),
                "cover_image_url": payload.cover_image_url,
                "seo_keywords": payload.seo_keywords,
                "author_id": author_id,
                "is_published": payload.is_published,
                "published_at": now if payload.is_published else None,
            }
        )

        if payload.is_published:
            self._ping_google_sitemap()

        return post

    def list_admin_posts(self, limit: int = 200) -> list[dict[str, Any]]:
        return self.repository.list_all(limit=limit)

    def list_published_posts(self, limit: int = 50) -> list[dict[str, Any]]:
        return self.repository.list_published(limit=limit)

    def get_published_post(self, slug: str) -> dict[str, Any] | None:
        return self.repository.get_by_slug(slug=slug, published_only=True)

    def _resolve_provider(self, provider: str | None) -> AIProvider:
        normalized = (provider or "groq").strip().lower()
        if normalized in {"groq", "openrouter"}:
            return normalized  # type: ignore[return-value]
        return "groq"

    def _build_system_prompt(self) -> str:
        return (
            "You are a senior SEO content strategist for B2B SaaS. "
            "Write practical, nuanced, non-fluffy content with clear structure. "
            "Output must be valid JSON only and content must be markdown."
        )

    def _build_main_prompt(self, *, keyword: str, tone: str, audience: str | None) -> str:
        audience_text = audience.strip() if audience else "solo online business owners and agencies"
        return f"""
Create a complete, high-quality blog draft targeting this primary keyword: {keyword}
Tone: {tone}
Audience: {audience_text}

Requirements:
- Markdown output in the content field
- Include a compelling H1 and logical H2/H3 structure
- Include practical examples and clear action steps
- If it improves clarity, include at most one Mermaid diagram fenced as ```mermaid with valid syntax
- Avoid generic filler and avoid repeating the same sentence patterns
- Excerpt should be concise and click-worthy
- SEO keywords list should include long-tail and semantically related phrases
- Slug must be lowercase and hyphenated
- Do not include markdown frontmatter
- Do not include references or citations unless relevant and factual

Return JSON object with keys: title, slug, excerpt, content, seo_keywords
""".strip()

    def _make_slug(self, source: str) -> str:
        candidate = re.sub(r"[^a-z0-9]+", "-", source.lower()).strip("-")
        return candidate[:120] or "radius-blog-post"

    def _ensure_unique_slug(self, slug: str) -> str:
        current = slug
        suffix = 2
        while self.repository.get_by_slug(current, published_only=False):
            current = f"{slug}-{suffix}"
            suffix += 1
        return current

    def _ping_google_sitemap(self) -> None:
        base = (settings.FRONTEND_URL or "").strip().rstrip("/")
        if not base:
            logger.warning("Skipping sitemap ping because FRONTEND_URL is not configured")
            return

        sitemap_url = f"{base}/sitemap.xml"
        ping_url = f"https://www.google.com/ping?sitemap={quote_plus(sitemap_url)}"

        try:
            response = requests.get(ping_url, timeout=6)
            if response.status_code == 200:
                logger.info("Successfully notified Google of sitemap update")
            else:
                logger.warning(
                    "Google sitemap ping returned status %s for %s",
                    response.status_code,
                    sitemap_url,
                )
        except Exception as exc:
            logger.warning("Google sitemap ping failed for %s: %s", sitemap_url, exc)
