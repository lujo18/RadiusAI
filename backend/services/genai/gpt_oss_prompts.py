"""
GPT-OSS 120B Modular Prompt Builders

Implements the modular injection architecture for GPT-OSS 120B on Groq.
Follows: Groq prompt caching best practices (static first, dynamic last)
Structure: Persona → Constraints → Format → Components

Each builder returns a formatted section for use in _generate_prompt().
"""

import json
from typing import Optional, Dict, Any, List
from app.features.user.schemas import BrandSettings


def build_system_role(
    brand: BrandSettings, classifier_context: Optional[Dict[str, Any]] = None
) -> str:
    """
    Build SYSTEM ROLE block with persona, reasoning effort, and constraints.

    Per GPT-OSS 120B docs:
    - Specific persona activates right MoE experts
    - Explicit constraint blocks tether the model
    - Reasoning effort controls depth

    Args:
        brand: BrandSettings object containing voice info
        classifier_context: Template format, content_mode, niche (from classifier)

    Returns:
        Formatted system role block
    """
    reading_level = brand.reading_level or "conversational"
    brand_voice = brand.brand_voice or "friendly expert"
    niche = brand.niche or "general"
    template_format = (
        classifier_context.get("template_format", "listicle")
        if classifier_context
        else "listicle"
    )
    content_mode = (
        classifier_context.get("content_mode", "STRUCTURAL")
        if classifier_context
        else "STRUCTURAL"
    )

    # Determine reasoning effort per stage
    reasoning_effort = "HIGH" if content_mode == "GENERATIVE" else "MEDIUM"

    # Build hook-specific guidance if GENERATIVE
    hook_guidance = ""
    if content_mode == "GENERATIVE":
        hook_guidance = f"""

HOOK REQUIREMENTS ({template_format.upper()}, GENERATIVE MODE):
- Signal clear VALUE/BENEFIT upfront (not just curiosity)
- Result-first or outcome-first framing
- Max 1 sentence, <15 words
- Examples of GOOD hooks:
  - "Save 10 mins/day with AI journaling"
  - "Never forget a thought again"
  - "Reduce anxiety before bed in 3 steps"
- Examples of BAD hooks (too generic):
  - "Did you journal today?"
  - "Let's explore journaling"
  - "Journaling changed my life"
"""

    system_role = f"""### SYSTEM ROLE

You are a TikTok/Instagram content strategist specializing in [{niche}] content.

VOICE PROFILE:
- Reading level: {reading_level} (adjust vocabulary, sentence complexity accordingly)
- Brand voice: {brand_voice} (maintain this voice throughout)
- Authenticity: Sound like a real person, not AI. Use contractions, conversational tone.

REASONING EFFORT: {reasoning_effort}
- Explore 2-3 approaches before settling on final content
- For GENERATIVE hooks, prioritize value signal clarity

CONSTRAINT BLOCKS:

1. FAIL FAST:
   - If a required field is missing or ambiguous, do not guess
   - Ask for clarification rather than hallucinating
   - Do not invent brand guidelines or template rules

2. OUTPUT BUDGET:
   - Hooks: 1 sentence, max 15 words, <100 characters
   - Header slides: 1 sentence, max 15 words
   - Body slides: 2-3 sentences, max 40 words per slide
   - CTA: 1-2 sentences, max 20 words
   - No filler, no preamble, no "In today's..." openings

3. SOURCE PRIORITY:
   - Use brand_guidelines tone, emoji_usage, and forbidden_words ALWAYS
   - Follow template_architecture stage sequence EXACTLY
   - Never override template-defined rules for creativity
   - Placeholder variables ([Niche], [Action], etc.) stay in brackets
{hook_guidance}

JSON OUTPUT RULES:
- Return ONLY valid JSON matching output_schema
- Fill EVERY text_element ID - no placeholders, no skipping
- Use layout_type from output_schema definitions ONLY
- Match word counts to layout type specifications
"""

    return system_role


def build_brand_component(brand: BrandSettings) -> str:
    """
    Build BRAND GUIDELINES component.

    Static content that defines tone, voice, and rules.
    Wrapped in <brand_guidelines> tags for clarity.

    Args:
        brand: BrandSettings object

    Returns:
        XML-tagged brand guidelines JSON
    """
    brand_dict = {
        "name": brand.name or "",
        "niche": brand.niche or "",
        "aesthetic": brand.aesthetic or "",
        "target_audience": brand.target_audience or "",
        "brand_voice": brand.brand_voice or "",
        "reading_level": brand.reading_level or "conversational",
        "tone_of_voice": brand.tone_of_voice or "casual",
        "emoji_usage": brand.emoji_usage or "moderate",
        "content_pillars": brand.content_pillars or [],
        "forbidden_words": brand.forbidden_words or [],
        "preferred_words": brand.preferred_words or [],
    }

    # Remove None/empty values for cleaner JSON
    brand_dict = {k: v for k, v in brand_dict.items() if v}

    return f"""<brand_guidelines>
{json.dumps(brand_dict, indent=2)}
</brand_guidelines>"""


def build_template_component(slideshow_goals: str) -> str:
    """
    Build TEMPLATE ARCHITECTURE component.

    Wraps slideshow_goals (template structure) in XML tags.
    Defines slide stages, format_spec, output_modes.

    Args:
        slideshow_goals: Template JSON string describing slide structure

    Returns:
        XML-tagged template architecture
    """
    return f"""<template_architecture>
{slideshow_goals}
</template_architecture>"""


def build_output_schema(layout_options: Dict[str, Any]) -> str:
    """
    Build TEXT OUTPUT SCHEMA component.

    Defines layout types, word limits, and expected JSON structure.
    Provides examples for each layout type.

    Args:
        layout_options: Layout definitions from slide_layouts.py

    Returns:
        Formatted output schema with layout definitions and examples
    """
    schema = """<output_schema>
LAYOUT DEFINITIONS & WORD LIMITS:

- hook: High-impact, value-signaling. Max 1 sentence, <15 words, <100 characters.
  Purpose: Grab attention and signal clear benefit or outcome.

- header: Title only. Max 1 sentence, <20 words.
  Purpose: Slide label/section marker.

- header_and_body: Header (title) + body text.
  Header: 1 sentence, <15 words.
  Body: 2-3 sentences, <40 words total.
  Purpose: Educational, builds on hook, provides context.

- body: Longer paragraph without header.
  Content: 2-4 sentences, <80 words.
  Purpose: Deep explanation, story, or detailed guidance.

- body_and_media_label: Body text with media reference.
  Content: 1-2 sentences, <35 words.
  Purpose: Describe an image or video element.

EXAMPLE OUTPUT STRUCTURE:
{
  "variations": [
    {
      "slides": [
        {
          "slide_number": 1,
          "layout_type": "hook",
          "text_elements": {
            "text-hook-1": "Never lose a thought again. Capture ideas in 3 minutes."
          }
        },
        {
          "slide_number": 2,
          "layout_type": "header_and_body",
          "text_elements": {
            "text-header-1": "Prompt 1: Morning Clarity",
            "text-body-1": "Start your day with this simple question: What am I avoiding? Write for 2 minutes without editing. This reveals hidden anxieties."
          }
        },
        {
          "slide_number": 3,
          "layout_type": "body",
          "text_elements": {
            "text-body-2": "Research shows that journaling for just 10 minutes daily reduces stress by 27%. When you externalize thoughts, your brain stops looping them."
          }
        }
      ],
      "caption": "3 journal prompts to ease anxiety before bed. Try them tonight.",
      "hashtags": ["#journaling", "#anxiety", "#mentalhealth", "#sleep"],
      "background_query": "calm notebook desk evening light"
    }
  ]
}

STRICT RULES:
- Fill EVERY text_element ID. No placeholders like {{placeholder}} allowed.
- Use ONLY layout_type values from definitions above.
- Respect word count limits per layout type.
- No em-dashes (–), use hyphens (-).
- No unicode or special characters outside ASCII + standard punctuation.
- Caption: 1-2 sentences, <80 words, engaging and action-oriented.
- Hashtags: 4-6 hashtags, relevant to niche.
- background_query: 2-3 words only, describing image needed for slides.
</output_schema>"""

    return schema


def build_cta_component(cta: Optional[Dict[str, Any]]) -> str:
    """
    Build CTA OVERRIDES component (optional, dynamic).

    Only included if CTA is provided.
    Specifies exact CTA text and URL for final slide.

    Args:
        cta: CTA dictionary with cta_text, cta_url, etc.

    Returns:
        XML-tagged CTA overrides, or empty string if no CTA
    """
    if not cta:
        return ""

    cta_dict = {
        "cta_text": cta.get("cta_text", ""),
        "cta_url": cta.get("cta_url", ""),
        "position": cta.get("position", "last_slide"),
    }

    return f"""\n<cta_overrides>
{json.dumps(cta_dict, indent=2)}
</cta_overrides>"""


def build_input_topic(
    topic: str, classifier_context: Optional[Dict[str, Any]] = None, count: int = 1
) -> str:
    """
    Build INPUT TOPIC section (dynamic, last).

    Includes task instructions and the actual user input.
    Classifier context helps the model understand the template format.

    Args:
        topic: User's content goal/topic
        classifier_context: Template format, niche, hook_pattern, etc. from classifier
        count: Number of variations to generate

    Returns:
        Formatted task instructions and input
    """
    template_format = (
        classifier_context.get("template_format", "listicle")
        if classifier_context
        else "listicle"
    )
    content_mode = (
        classifier_context.get("content_mode", "STRUCTURAL")
        if classifier_context
        else "STRUCTURAL"
    )
    niche = classifier_context.get("niche") if classifier_context else ""

    context_block = ""
    if classifier_context:
        context_block = f"""
CLASSIFIER CONTEXT:
- Template Format: {template_format}
- Content Mode: {content_mode}
- Niche: {niche}
- Hook Pattern: {classifier_context.get("hook_pattern") or "Free-write (no pattern)"}
- Audience Motivation: {classifier_context.get("audience_motivation") or "Not specified"}
"""

    input_section = f"""### TASK INSTRUCTIONS

1. Analyze the input topic below
2. Apply brand voice from <brand_guidelines>
3. Follow template_architecture stage sequence EXACTLY
4. Generate output using <output_schema> format
5. Use <cta_overrides> for final slide (if provided)
6. Generate {count} unique variation(s) with different content each time

### INPUT TOPIC
{topic}
{context_block}

### OUTPUT FORMAT
Generate a JSON object with this exact structure:
{{
  "variations": [
    {{
      "slides": [...],
      "caption": "...",
      "hashtags": [...],
      "background_query": "..."
    }}
  ]
}}

Return ONLY valid JSON. No markdown, no explanations, no preamble.
"""

    return input_section


def assemble_generation_prompt(
    layout_options: Dict[str, Any],
    slideshow_goals: str,
    brand: BrandSettings,
    topic: str,
    count: int = 1,
    cta: Optional[Dict[str, Any]] = None,
    classifier_context: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Assemble complete generation prompt using modular components.

    Order: Static → Dynamic (for Groq caching optimization)
    1. SYSTEM ROLE (static, varies per brand)
    2. BRAND GUIDELINES (static)
    3. TEMPLATE ARCHITECTURE (static)
    4. OUTPUT SCHEMA (static, global)
    5. CTA OVERRIDES (dynamic, optional)
    6. INPUT TOPIC (dynamic, last)

    Args:
        layout_options: Slide layout definitions
        slideshow_goals: Template structure JSON
        brand: BrandSettings
        topic: User's content goal
        count: Number of variations
        cta: Optional CTA override
        classifier_context: Template format, niche, etc. (from classifier)

    Returns:
        Complete prompt string ready for GPT-OSS 120B
    """

    system_role = build_system_role(brand, classifier_context)
    brand_component = build_brand_component(brand)
    template_component = build_template_component(slideshow_goals)
    output_schema = build_output_schema(layout_options)
    cta_component = build_cta_component(cta)
    input_topic = build_input_topic(topic, classifier_context, count)

    # Assemble with static first, dynamic last
    prompt = f"""{system_role}

### COMPONENT 1: BRAND GUIDELINES
{brand_component}

### COMPONENT 2: TEMPLATE ARCHITECTURE
{template_component}

### COMPONENT 3: TEXT OUTPUT SCHEMA
{output_schema}
{cta_component}

{input_topic}"""

    return prompt
