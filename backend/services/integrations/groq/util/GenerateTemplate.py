import json

from app.features.generate.genai.prompts import build_generation_prompt

# Import groq client lazily inside the function to avoid heavy network or setup at import-time


TEMPLATE_SYSTEM_PROMPT = """You are a Social Media Content Architect.
You generate JSON blueprints for TikTok/Instagram slideshow templates.

## CRITICAL RULES
1. **template_format MUST BE EXACTLY ONE of**: listicle, step_by_step, journal_prompts, before_after, quote_carousel, faq, ranking_countdown, myth_busting, affirmations. Never append content_mode or anything else.

2. **EVERY slide must have a format_spec** — even FREE_WRITE slides. format_spec is the writing instruction:
   - FOLLOW_EXACTLY slides: exact sentence structure/pattern to reproduce
   - FREE_WRITE slides: guidance on what to write (e.g., "Write a hook that creates curiosity about [Subject]" or "Provide social proof that [Action] works")
   - Never leave format_spec empty

3. **USER INTENT PRIORITY**:
   - If the user specified a slide structure or hook pattern, USE IT for all relevant slides
   - User-specified structures override generic patterns
   - When a user structure exists, it's OK for multiple slides to share the same format_spec structure (they'll be filled with different content)
   - Only enforce distinctness when NO user structure was provided

4. **Format_spec as Template**:
   - format_spec fields contain [Placeholder] variables like [Number], [Subject], [Action], [Result], [Niche], [Trait]
   - NEVER substitute these placeholders with actual content - keep the brackets
   - The content generation model fills these in later based on the actual topic

Return only raw JSON. No markdown. No explanation. No code fences."""

TEMPLATE_SCHEMA = """{
  "template_id": "T-[CATEGORY]-[NN]",
  "name": "summarizing title string",
  "template_format": "listicle|step_by_step|journal_prompts|before_after|quote_carousel|faq|ranking_countdown|myth_busting|affirmations|framework",
  "content_mode": "STRUCTURAL|GENERATIVE",
  "category": "educational|transformation|myth-busting|comparison|authority|lifestyle|utility|growth",
  "logic_engine": {
    "goal": "saves|shares|comments|follows",
    "psychological_trigger": "string — one of: Loss Aversion, Curiosity Gap, Social Proof, Identity Affirmation, FOMO",
    "pacing_style": "Slow Build|Rapid Fire|Data Dump|Reveal Sequence"
  },
  "content_blueprint": {
    "hook_strategy": "string — specific mechanic (e.g. Result-First, Shocking Statistic, Forbidden Truth)",
    "slides": [
      {
        "slide_number": "integer",
        "stage": "string",
        "output_mode": "FOLLOW_EXACTLY|FREE_WRITE",
        "format_spec": "string",
        "word_count": "integer"
      }
    ],
    "writing_constraints": {
      "forbidden_cliches": ["string", "string", "string"],
      "required_rhythm": "Short-Short-Long|All Short|Varied"
    }
  }
}"""


TEMPLATE_USER_PROMPT = """\
## REQUEST (THE USER'S ACTUAL TOPIC — USE THIS, NOT GENERIC EXAMPLES)
{REQUEST}

## FORMAT
{FORMAT} | {CONTENT_MODE} | {ITEM_COUNT} items

## HOOK INSTRUCTION
{HOOK_INSTRUCTION}

## STAGE SEQUENCE
{STAGE_SEQUENCE}

## CONTENT MODE RULE
{CONTENT_MODE_INSTRUCTION}

## OUTPUT_MODE ASSIGNMENT
{OUTPUT_MODE_RULE}

## REQUIRED FORMAT_SPEC FOR EACH STAGE
HOOK: Use the instruction provided above (output_mode determined by hook instruction)
ITEM/MECHANISM/STEP/RANK/MYTH/TRUTH/QUOTE/QA/PROMPT/AFFIRMATION:
  - If user provided explicit slide structure (check CONTENT MODE RULE section), use THAT structure for format_spec
  - Otherwise, use simple placeholdered patterns appropriate for the format
  - Always preserve [Placeholder] variables - never substitute real content
  - Each slide's format_spec should guide content generation, not BE the final content
CONTEXT: Explain why [Niche] should care about [REQUEST], what's at stake
PROOF: Describe social proof or expert consensus supporting the [REQUEST] solution
NUANCE: Describe the cost, effort, or knowledge requirement for [REQUEST]
REFLECTION/TURNING_POINT: Provide perspective or mindset shift related to [REQUEST]
REVEAL: The final/ultimate item or answer to [REQUEST]
CTA: Direct command to start applying [REQUEST] immediately

## CRITICAL: HONORING USER INTENT
- If the user specified slide structure (e.g., "[Number]. [1 sentence habit]"), use it for ALL item slides
- If the user provided a hook pattern, preserve it exactly with placeholders
- Do NOT force generic patterns like "Foundation", "Quick win", etc. unless user request implies them
- The format_spec is a TEMPLATE that the content generator will fill - keep [Placeholders] intact
- User-specified structures ALWAYS take precedence over generic defaults

## UNIQUENESS (only when user didn't specify structure)
If no explicit user structure exists, repeating slides should have somewhat distinct format_specs.
But NEVER override user-specified structures for the sake of uniqueness.

## LAWS
- Slide count = stages above exactly. No more. No fewer.
- word_count = integer only.
- template_format = ONLY ONE of: listicle, step_by_step, journal_prompts, before_after, quote_carousel, faq, ranking_countdown, myth_busting, affirmations
- ALL format_specs must contain [Niche], [Action], [Subject], [Result], [Number], or [Trait] placeholders
- Every format_spec field must have guidance text — NEVER empty
- No narrative_flow field.
- No capitalized common nouns.
- template name = must reflect the REQUEST topic, not generic content
- RESPECT user-specified structures over generic patterns

{SCHEMA}

Start with {{ end with }}"""




CLASSIFIER_SYSTEM_PROMPT = """You are a content format classifier.
Analyze the user's request and return ONLY a JSON object. No explanation. No markdown.

Return exactly this structure:
{
  "template_format": "journal_prompts|listicle|step_by_step|before_after|quote_carousel|faq|ranking_countdown|product_showcase|myth_busting|affirmations",
  "content_mode": "GENERATIVE|STRUCTURAL",
  "item_count": <integer between 4 and 7>,
  "hook_text": "<exact hook text if provided by user, else null>",
  "hook_pattern": "<if hook has a reusable pattern with variables, extract it using [variable] placeholders (e.g., 'I used to lack [trait]. These [number] habits allowed me to fix that'), else null>",
  "niche": "<detected topic/niche, else null>",
  "slide_structure_request": "<user's explicit slide structure request if provided (e.g., '[Number]. [1 sentence habit]'), else null>"
}

content_mode rules:
- GENERATIVE: journal_prompts, quote_carousel, faq, affirmations
- STRUCTURAL: everything else

Pattern extraction rules:
- If hook has a clear pattern with variables, extract it with [variable] placeholders
- If user specifies slide structure, capture it exactly
- Preserve user intent over generic patterns"""

CLASSIFIER_USER_PROMPT = """User request: {REQUEST}"""


def _validate_and_fix_template(template: dict) -> None:
    """
    Validate and fix template structure issues.
    Enforces: 4-7 total slides (Hook=first, CTA=last)
    Raises ValueError if validation fails.
    """
    # Fix malformed template_format (e.g., "listicle|STRUCTURAL" -> "listicle")
    valid_formats = [
        "listicle", "step_by_step", "journal_prompts", "before_after",
        "quote_carousel", "faq", "ranking_countdown", "myth_busting", "affirmations"
    ]

    fmt = template.get("template_format", "")
    if "|" in fmt:
        # Extract just the first part before the pipe
        fmt = fmt.split("|")[0].strip()
        template["template_format"] = fmt

    if fmt not in valid_formats:
        raise ValueError(
            f"Invalid template_format '{fmt}'. Must be one of: {', '.join(valid_formats)}"
        )

    # Validate and fix slides
    slides = template.get("content_blueprint", {}).get("slides", [])
    total_slide_count = len(slides)
    
    # CRITICAL: Enforce 4-7 slide maximum (Hook + CTA included)
    if total_slide_count > 7:
        raise ValueError(
            f"Generated template has {total_slide_count} slides, exceeds 7-slide maximum. "
            f"Total must be 4-7 (includes HOOK + CTA). Reduce item_count or structure complexity."
        )
    if total_slide_count < 4:
        raise ValueError(
            f"Generated template has {total_slide_count} slides, below 4-slide minimum. "
            f"Total must be 4-7 (includes HOOK + CTA). Increase item_count or add stages."
        )
    
    for i, slide in enumerate(slides):
        # Ensure format_spec is never empty
        if not slide.get("format_spec") or slide["format_spec"].strip() == "":
            stage = slide.get("stage", f"SLIDE_{i}")
            raise ValueError(
                f"Slide {slide.get('slide_number', i+1)} ({stage}) has empty format_spec. "
                f"Every slide must have a format_spec with guidance, even FREE_WRITE slides."
            )


def generate_template(guideline_prompt: str):
    from ..client import groq

    # CLASSIFY THE FORMAT GOAL
    response = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": CLASSIFIER_SYSTEM_PROMPT},
            {"role": "user", "content": CLASSIFIER_USER_PROMPT.format(REQUEST=guideline_prompt)},
        ],
        temperature=0.6,
        top_p=0.9,
        presence_penalty=0.1,
        frequency_penalty=0.2,
        max_completion_tokens=3000,
    )
    
    classification_res = response.choices[0].message.content

    if not classification_res or not classification_res.strip():
        ValueError("Failed to get classification response")

    classifier_output = json.loads(classification_res)
    # Preserve the user's original request in the classifier output
    classifier_output["original_request"] = guideline_prompt
    
    # CRITICAL: Enforce 4-7 total slides by capping item_count per format
    # Rule: Total = HOOK(1) + Items + Other Stages + CTA(1) <= 7
    # So: Items + Other Stages <= 5
    fmt = classifier_output.get("template_format", "listicle")
    overhead = FORMAT_CONFIG[fmt].get("_overhead", 2)  # Default HOOK + CTA
    max_item_count = max(2, 7 - overhead)  # Minimum 2 content items
    item_count = classifier_output.get("item_count", 5)
    if item_count > max_item_count:
        classifier_output["item_count"] = max_item_count

    generator_prompt = _build_template_prompt(classifier_output)

    response = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": TEMPLATE_SYSTEM_PROMPT},
            {"role": "user", "content": generator_prompt},
        ],
        temperature=0.6,
        top_p=0.9,
        presence_penalty=0.1,
        frequency_penalty=0.2,
        max_completion_tokens=3000,
    )

    response_text = response.choices[0].message.content

    print("Template Generation Response:", response_text)

    # Defensive parsing: try direct JSON first, then attempt to extract the first balanced JSON object
    if not response_text or not response_text.strip():
        raise ValueError(
            f"No response_text received from Gemini/Groq API. Raw response: {response}"
        )

    raw = response_text.strip()

    try:
        parsed_template = json.loads(raw)
    except json.JSONDecodeError:
        # Try to extract the first balanced JSON object from the response
        def extract_first_json(s: str):
            start = s.find("{")
            if start == -1:
                return None
            depth = 0
            for i in range(start, len(s)):
                ch = s[i]
                if ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        return s[start : i + 1]
            return None

        candidate = extract_first_json(raw)
        if candidate:
            try:
                parsed_template = json.loads(candidate)
            except json.JSONDecodeError:
                # fall through to error below
                raise ValueError(
                    f"Failed to parse JSON from model response. Raw response: {raw}"
                )
        else:
            raise ValueError(
                f"Failed to parse JSON from model response. Raw response: {raw}"
            )

    # Validate and fix the parsed template
    _validate_and_fix_template(parsed_template)

    return parsed_template




FORMAT_CONFIG = {
    "journal_prompts": {
        "content_mode": "GENERATIVE",
        "_overhead": 3,  # HOOK, INTRO, CTA
        "stage_sequence": lambda n: ["HOOK", "INTRO"] + [f"PROMPT_{i}" for i in range(1, n+1)] + ["CTA"],
        "content_mode_instruction": (
            "Journal prompts are generative content. format_spec provides guidance for what to generate.\n"
            "Example pattern: 'Write a journal prompt about: [topic]. [1 constraint].'\n"
            "The content generator will create the actual prompt at generation time."
        ),
        "output_mode_rule": "PROMPT slides: FOLLOW_EXACTLY. HOOK, INTRO: FREE_WRITE. CTA: FOLLOW_EXACTLY."
    },
    "affirmations": {
        "content_mode": "GENERATIVE",
        "_overhead": 2,  # HOOK, CTA
        "stage_sequence": lambda n: ["HOOK"] + [f"AFFIRMATION_{i}" for i in range(1, n+1)] + ["CTA"],
        "content_mode_instruction": (
            "Affirmations are generative content. format_spec provides guidance for what to generate.\n"
            "Example pattern: 'Write an affirmation about: [topic]. Second person. Present tense. Max 12 words.'\n"
            "The content generator will create the actual affirmation at generation time."
        ),
        "output_mode_rule": "AFFIRMATION slides: FOLLOW_EXACTLY. HOOK: FREE_WRITE. CTA: FOLLOW_EXACTLY."
    },
    "quote_carousel": {
        "content_mode": "GENERATIVE",
        "_overhead": 3,  # HOOK, REFLECTION, CTA
        "stage_sequence": lambda n: ["HOOK"] + [f"QUOTE_{i}" for i in range(1, n+1)] + ["REFLECTION", "CTA"],
        "content_mode_instruction": (
            "Quotes are generative content. format_spec provides guidance for what to generate.\n"
            "Example pattern: 'Write a quote about: [topic]. [tone]. Include 1-sentence interpretation.'\n"
            "The content generator will create the actual quote at generation time."
        ),
        "output_mode_rule": "QUOTE slides: FOLLOW_EXACTLY. HOOK, REFLECTION: FREE_WRITE. CTA: FOLLOW_EXACTLY."
    },
    "faq": {
        "content_mode": "GENERATIVE",
        "_overhead": 2,  # HOOK, CTA
        "stage_sequence": lambda n: ["HOOK"] + [f"QA_{i}" for i in range(1, n+1)] + ["CTA"],
        "content_mode_instruction": (
            "FAQ content is generative. format_spec provides guidance for what to generate.\n"
            "Example pattern: 'Write a Q&A about: [topic]. [audience level]. Answer: 2 sentences, direct.'\n"
            "The content generator will create the actual questions and answers at generation time."
        ),
        "output_mode_rule": "QA slides: FOLLOW_EXACTLY. HOOK: FREE_WRITE. CTA: FOLLOW_EXACTLY."
    },
    "listicle": {
        "content_mode": "STRUCTURAL",
        "_overhead": 2,  # HOOK, CTA
        "stage_sequence": lambda n: ["HOOK"] + [f"ITEM_{i}" for i in range(1, n+1)] + ["CTA"],
        "content_mode_instruction": (
            "Listicles are numbered lists. Each ITEM slide is ONE list item.\n\n"
            "PRIORITY: Use user's requested structure if provided (check 'slide_structure_request').\n"
            "If no user structure, use a simple placeholdered pattern: '[Number]. [Brief description/benefit]'\n\n"
            "Available placeholders: [Number], [Subject], [Action], [Result], [Niche], [Trait]\n\n"
            "The format_spec should be a TEMPLATE with placeholders, not final content.\n"
            "User-specified structures ALWAYS override generic suggestions."
        ),
        "output_mode_rule": "ITEM slides: FOLLOW_EXACTLY. HOOK: depends on pattern (see hook logic). CTA: FOLLOW_EXACTLY."
    },
    "step_by_step": {
        "content_mode": "STRUCTURAL",
        "_overhead": 4,  # HOOK, CONTEXT, PROOF, CTA
        "stage_sequence": lambda n: ["HOOK", "CONTEXT"] + [f"STEP_{i}" for i in range(1, n+1)] + ["PROOF", "CTA"],
        "content_mode_instruction": (
            "Step-by-step guides show sequential actions.\n\n"
            "PRIORITY: Use user's requested structure if provided (check 'slide_structure_request').\n"
            "If no user structure, use placeholdered pattern: 'Step [Number]: [Imperative verb] [Subject/Action] to [Result]'\n\n"
            "Available placeholders: [Number], [Subject], [Action], [Result], [Niche], [Trait]\n\n"
            "User-specified structures ALWAYS override generic suggestions."
        ),
        "output_mode_rule": "STEP slides: FOLLOW_EXACTLY. HOOK, CONTEXT, PROOF: FREE_WRITE. CTA: FOLLOW_EXACTLY."
    },
    "before_after": {
        "content_mode": "STRUCTURAL",
        "_overhead": 5,  # HOOK, BEFORE, TURNING_POINT, AFTER, CTA (fixed 5 slides)
        "stage_sequence": lambda _: ["HOOK", "BEFORE", "TURNING_POINT", "AFTER", "CTA"],
        "content_mode_instruction": (
            "Before/After format shows transformation.\n\n"
            "BEFORE format_spec example: '[Subject] before [Action]: [Negative state]'\n"
            "AFTER format_spec example: '[Subject] after [Action]: [Positive result]'\n\n"
            "Both should use parallel structure when possible. Use user structure if provided."
        ),
        "output_mode_rule": "BEFORE, AFTER: FOLLOW_EXACTLY. HOOK, TURNING_POINT: FREE_WRITE. CTA: FOLLOW_EXACTLY."
    },
    "myth_busting": {
        "content_mode": "STRUCTURAL",
        "_overhead": 3,  # HOOK, PROOF, CTA (each myth/truth pair counts as items)
        "stage_sequence": lambda n: ["HOOK"] + sum([[f"MYTH_{i}", f"TRUTH_{i}"] for i in range(1, n+1)], []) + ["PROOF", "CTA"],
        "content_mode_instruction": (
            "Myth-busting format pairs false beliefs with corrections.\n\n"
            "MYTH format_spec example: 'Myth: [False belief about Subject]'\n"
            "TRUTH format_spec example: 'Truth: [Factual correction]'\n\n"
            "Each MYTH slide is followed by its TRUTH slide. Use user structure if provided."
        ),
        "output_mode_rule": "MYTH, TRUTH slides: FOLLOW_EXACTLY. HOOK, PROOF: FREE_WRITE. CTA: FOLLOW_EXACTLY."
    },
    "ranking_countdown": {
        "content_mode": "STRUCTURAL",
        "_overhead": 3,  # HOOK, REVEAL, CTA
        "stage_sequence": lambda n: ["HOOK"] + [f"RANK_{i}" for i in range(n, 0, -1)] + ["REVEAL", "CTA"],
        "content_mode_instruction": (
            "Countdown format builds suspense by revealing ranks from lowest to highest.\n\n"
            "PRIORITY: Use user's requested structure if provided (check 'slide_structure_request').\n"
            "If no user structure, use: 'Rank [Number]: [Subject/title] — [brief reason]'\n\n"
            "REVEAL is the final #1 rank. Use user structure if provided."
        ),
        "output_mode_rule": "RANK slides: FOLLOW_EXACTLY. HOOK, REVEAL: FREE_WRITE. CTA: FOLLOW_EXACTLY."
    }
}


def _build_template_prompt(classifier_output: dict) -> str:
    fmt = classifier_output["template_format"]
    config = FORMAT_CONFIG[fmt]
    item_count = classifier_output.get("item_count", 5)

    # Build HOOK instruction with pattern awareness
    hook_text = classifier_output.get("hook_text")
    hook_pattern = classifier_output.get("hook_pattern")

    if hook_pattern:
        # User provided a reusable pattern - use it
        hook_instruction = (
            f"The hook should follow this pattern:\n\"{hook_pattern}\"\n\n"
            f"This is a PATTERN with placeholder variables in [brackets]. "
            f"The content generation model will fill these variables based on the topic.\n"
            f"Mark this slide as FOLLOW_EXACTLY since it has a defined structure."
        )
        hook_output_mode = "FOLLOW_EXACTLY"
    elif hook_text:
        # User provided exact text - use it exactly
        hook_instruction = (
            f"Use exactly this hook text:\n\"{hook_text}\"\n\n"
            f"Do not modify it. This is the exact hook to use.\n"
            f"Mark this slide as FOLLOW_EXACTLY."
        )
        hook_output_mode = "FOLLOW_EXACTLY"
    else:
        # No specific hook - create guidance
        hook_instruction = (
            "Write a hook instruction customized for the REQUEST topic that creates curiosity or urgency.\n"
            "Example format: 'Write a compelling hook about [topic] that creates urgency for [Niche]'\n"
            "Mark this slide as FREE_WRITE since it's flexible guidance."
        )
        hook_output_mode = "FREE_WRITE"

    stage_sequence = config["stage_sequence"](item_count)

    # Build item/slide structure guidance
    slide_structure_request = classifier_output.get("slide_structure_request")
    structure_guidance = ""

    if slide_structure_request and fmt in ["listicle", "step_by_step", "ranking_countdown"]:
        # User provided explicit structure - use it
        structure_guidance = f"\n\nUSER'S REQUESTED SLIDE STRUCTURE (use this EXACTLY for all {fmt.upper().replace('_', ' ')} slides):\n"
        structure_guidance += f"\"{slide_structure_request}\"\n\n"
        structure_guidance += "DO NOT modify this structure. Apply it to each item/step/rank slide.\n"
        structure_guidance += "Available placeholders: [Number], [Subject], [Action], [Result], [Niche], [Trait]\n"

    # Add original request context for reference
    original_request = classifier_output.get("original_request", "")
    context_section = f"\n\n## USER'S ORIGINAL REQUEST (for context)\n{original_request}\n\n"
    context_section += "Use this to understand the user's intent, topic, and desired style.\n"
    context_section += "If the request specifies slide structure or content patterns, honor them.\n"

    user_prompt = TEMPLATE_USER_PROMPT.format(
        REQUEST=original_request,
        FORMAT=fmt,
        CONTENT_MODE=config["content_mode"],
        ITEM_COUNT=item_count,
        HOOK_INSTRUCTION=hook_instruction,
        STAGE_SEQUENCE=" → ".join(stage_sequence),
        CONTENT_MODE_INSTRUCTION=config["content_mode_instruction"] + structure_guidance + context_section,
        OUTPUT_MODE_RULE=config["output_mode_rule"].replace(
            "HOOK: FREE_WRITE" if "FREE_WRITE" in config["output_mode_rule"] else "HOOK: FOLLOW_EXACTLY",
            f"HOOK: {hook_output_mode}"
        ),
        SCHEMA=TEMPLATE_SCHEMA
    )

    return user_prompt