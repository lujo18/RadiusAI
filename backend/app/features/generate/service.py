"""
Generate Service - AI-powered content generation wrapper

Orchestrates Gemini/Groq API calls for carousel generation.
Acts as a service layer (no HTTP endpoints) called by Posts feature.
"""

import logging
import json
from typing import Optional

from app.core.config import settings
from app.core.exceptions import ExternalServiceError, ValidationError
from app.lib.ai_client import ai_client

logger = logging.getLogger(__name__)


class GenerateService:
    """
    Content generation orchestration service.

    Wraps GenAI providers (Gemini, Groq) with error handling,
    validation, and structured output.

    Future: Extensible for multiple LLM providers (Claude, GPT-4, etc.)
    """

    def __init__(self):
        """Initialize with lazy-loaded GenAI clients"""
        self._ai_client = None
        self._gemini_client = None

    @property
    def llm_client(self):
        """Lazy-load shared AI client"""
        if self._ai_client is None:
            self._ai_client = ai_client
        return self._ai_client

    @property
    def gemini_client(self):
        """Lazy-load Gemini client"""
        if self._gemini_client is None:
            try:
                from app.features.generate.genai.client import client

                self._gemini_client = client
            except ImportError:
                raise ExternalServiceError("Gemini client not configured")
        return self._gemini_client

    async def generate_carousel_content(
        self,
        topic: str,
        brand_settings: dict,
        content_rules: dict,
        template_structure: dict,
        count: int = 1,
        provider: str = settings.DEFAULT_AI_PROVIDER,
    ) -> list[dict]:
        """
        Generate carousel content (multiple slide variations) for a topic.

        Args:
            topic: Content topic/goal
            brand_settings: Brand voice, tone, aesthetic, forbidden words, etc.
            content_rules: Format, depth level, hook style, etc.
            template_structure: Slide count, designs, text element placeholders
            count: Number of variations to generate
            provider: LLM provider to use (groq, openrouter, gemini)

        Returns:
            List of carousel objects with slides, caption, hashtags

        Raises:
            ValidationError: If inputs are invalid
            ExternalServiceError: If LLM call fails
        """

        if count < 1 or count > 10:
            raise ValidationError("Count must be between 1 and 10")

        if not topic or not topic.strip():
            raise ValidationError("Topic cannot be empty")

        logger.info(f"Generating {count} carousel variations via {provider}")

        try:
            if provider == "groq":
                return await self._generate_via_groq(
                    topic, brand_settings, content_rules, template_structure, count
                )
            elif provider == "openrouter":
                return await self._generate_via_openrouter(
                    topic, brand_settings, content_rules, template_structure, count
                )
            elif provider == "gemini":
                return await self._generate_via_gemini(
                    topic, brand_settings, content_rules, template_structure, count
                )
            else:
                raise ValidationError(f"Unknown provider: {provider}")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            raise ExternalServiceError("LLM returned invalid JSON format")
        except Exception as e:
            logger.error(f"Content generation failed: {e}", exc_info=True)
            raise ExternalServiceError(f"Content generation failed: {str(e)}")

    async def _generate_via_groq(
        self,
        topic: str,
        brand_settings: dict,
        content_rules: dict,
        template_structure: dict,
        count: int,
    ) -> list[dict]:
        """Generate content using Groq API (GPT-OSS 120B + Llama)"""
        return await self._generate_via_chat_provider(
            provider="groq",
            topic=topic,
            brand_settings=brand_settings,
            content_rules=content_rules,
            template_structure=template_structure,
            count=count,
        )

    async def _generate_via_openrouter(
        self,
        topic: str,
        brand_settings: dict,
        content_rules: dict,
        template_structure: dict,
        count: int,
    ) -> list[dict]:
        """Generate content via OpenRouter using the same chat payload."""
        return await self._generate_via_chat_provider(
            provider="openrouter",
            topic=topic,
            brand_settings=brand_settings,
            content_rules=content_rules,
            template_structure=template_structure,
            count=count,
        )

    async def _generate_via_chat_provider(
        self,
        provider: str,
        topic: str,
        brand_settings: dict,
        content_rules: dict,
        template_structure: dict,
        count: int,
    ) -> list[dict]:
        """Generate content using a provider that supports chat completions."""

        # Build prompt from template structure and brand settings
        prompt = self._build_content_prompt(
            topic, brand_settings, content_rules, template_structure, count
        )

        logger.debug(f"{provider} request prompt length: {len(prompt)} chars")

        # Call selected provider with the existing JSON schema contract.
        response_text = self.llm_client.call_ai(
            provider=provider,
            model_id="openai/gpt-oss-120b",
            system_prompt=self._get_system_prompt(brand_settings),
            main_prompt=prompt,
            temperature=0.7,
            top_p=0.95,
            max_completion_tokens=6000,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "carousel_variations",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "variations": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "slides": {"type": "array"},
                                        "caption": {"type": "string"},
                                        "hashtags": {"type": "array"},
                                    },
                                    "required": ["slides", "caption", "hashtags"],
                                },
                            },
                        },
                        "required": ["variations"],
                    },
                },
            },
        )

        generated_data = json.loads(response_text.strip())

        # Extract variations array
        if "variations" in generated_data:
            variations = generated_data["variations"]
        elif isinstance(generated_data, list):
            variations = generated_data
        else:
            raise ValidationError(f"Unexpected {provider} response structure")

        logger.info(f"Generated {len(variations)} carousel variations via {provider}")
        return variations

    async def _generate_via_gemini(
        self,
        topic: str,
        brand_settings: dict,
        content_rules: dict,
        template_structure: dict,
        count: int,
    ) -> list[dict]:
        """
        Generate content using Gemini API.

        TODO: Implement when Gemini integration is updated to new API
        """
        raise NotImplementedError(
            "Gemini provider currently under migration. Use Groq for now."
        )

    def _build_content_prompt(
        self,
        topic: str,
        brand_settings: dict,
        content_rules: dict,
        template_structure: dict,
        count: int,
    ) -> str:
        """
        Build detailed generation prompt from template and brand settings.

        Maps template text elements to generation instructions.
        """

        # Build slide-by-slide instructions
        slide_instructions = []
        for slide in template_structure.get("slides", []):
            slide_num = slide.get("slideNumber", 0)
            elements = slide.get("textElements", {})

            slide_instr = f"\nSlide {slide_num}:"
            for elem_id, elem_info in elements.items():
                description = elem_info.get("content", elem_id)
                slide_instr += f"\n  • {elem_id}: {description}"

            slide_instructions.append(slide_instr)

        # Build prompt
        prompt = f"""Generate {count} UNIQUE carousel content variations for TikTok/Instagram.

TOPIC: {topic}

BRAND VOICE:
- Niche: {brand_settings.get("niche", "general")}
- Tone: {brand_settings.get("tone", "friendly")}
- Aesthetic: {brand_settings.get("aesthetic", "modern")}
- Emoji usage: {brand_settings.get("emoji_usage", "moderate")}
- NEVER use: {", ".join(brand_settings.get("forbidden_words", []))}
- PREFER: {", ".join(brand_settings.get("preferred_words", []))}

CONTENT RULES:
- Format: {content_rules.get("format", "listicle")}
- Hook style: {content_rules.get("hook_style", "question")}
- Depth: {content_rules.get("depth_level", "detailed")}

SLIDE STRUCTURE:
{"".join(slide_instructions)}

REQUIREMENTS:
- Each variation must be UNIQUE and offer different perspectives/angles on {topic}
- Fill EVERY text element ID with engaging, authentic content
- Keep text concise and hook-first (first slide max 1 sentence)
- Include relevant emojis per brand voice
- Caption should be engaging and drive engagement
- 5-10 trending hashtags per variation

Return JSON array with {count} carousel variations. Each has: slides[], caption, hashtags[]"""

        return prompt

    def _get_system_prompt(self, brand_settings: dict) -> str:
        """
        Get system prompt for LLM to guide content generation.

        Encoded with brand voice patterns.
        """

        return """You are a viral TikTok/Instagram content strategist.

INSTRUCTIONS:
- Output ONLY valid JSON, no explanations
- Sound like a real person, not AI - use contractions, conversational tone
- Maximum energy and engagement focus
- Follow brand voice guidelines strictly
- Each slide should progress the story/argument forward
- Use formatting tricks: line breaks, capital letters for emphasis
- No filler content like "let's dive in" or "here's the thing"

OUTPUT FORMAT: JSON array of carousel objects"""

    async def validate_carousel_response(
        self, response: list[dict], template_structure: dict
    ) -> bool:
        """
        Validate LLM response meets template requirements.

        Checks:
        - All required slides present
        - All text elements filled
        - No empty values

        Returns:
            True if valid, raises ValidationError if invalid
        """

        required_slides = {
            s["slideNumber"] for s in template_structure.get("slides", [])
        }

        for idx, carousel in enumerate(response):
            if not isinstance(carousel, dict):
                raise ValidationError(f"Carousel {idx} is not an object")

            if "slides" not in carousel:
                raise ValidationError(f"Carousel {idx} missing 'slides' field")

            # Validate slides exist
            carousel_slides = {s.get("slide_number"): s for s in carousel["slides"]}

            if not required_slides.issubset(carousel_slides.keys()):
                missing = required_slides - carousel_slides.keys()
                raise ValidationError(f"Carousel {idx} missing slides: {missing}")

            # Validate text elements are filled (not empty)
            for slide_num, slide_data in carousel_slides.items():
                text_elements = slide_data.get("text_elements", {})
                for elem_id, content in text_elements.items():
                    if not content or not str(content).strip():
                        raise ValidationError(
                            f"Carousel {idx}, Slide {slide_num}, Element {elem_id} is empty"
                        )

        logger.debug(f"Validated {len(response)} carousel responses")
        return True


# Singleton instance
generate_service = GenerateService()
