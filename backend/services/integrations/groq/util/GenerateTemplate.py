import json

# Import groq client lazily inside the function to avoid heavy network or setup at import-time


TEMPLATE_SYSTEM_PROMPT = """You are a Social Media Strategy Architect. Your goal is to generate one valid JSON blueprint for a high-performing carousel or slideshow based on the user's niche/format description."""

TEMPLATE_SCHEMA = """{
  "template_id": "T-CATEGORY-NN",
  "name": "Short Catchy Template Name",
  "category": "educational|transformation|myth-busting|comparison|authority|lifestyle|community|curation|utility|growth|reach|pattern|checklist",
  "logic_engine": {
    "goal": "Saves / Shares / Conversation",
    "narrative_flow": "The exact 'story arc' this follows (e.g., Agitate -> Solution -> Proof)",
    "psychological_trigger": "The core bias or emotion used (e.g., Loss Aversion, Curiosity Gap, Social Proof)",
    "pacing_style": "How the information is revealed (e.g., Slow Build, Rapid Fire, Data Dump)"
  },
  "content_blueprint": {
    "hook_strategy": "The specific mechanic of the first slide (e.g., Result-First, The Forbidden Truth)",
    "structure": {
      "slide_1": "PURPOSE: [Goal]. ACTION: [Specific Instruction]. FORMAT: [Length/Style].",
      "slide_2": "PURPOSE: [Goal]. ACTION: [Specific Instruction]. FORMAT: [Length/Style].",
      "slide_3": "PURPOSE: [Goal]. ACTION: [Specific Instruction]. FORMAT: [Length/Style].",
      "slide_4": "PURPOSE: [Goal]. ACTION: [Specific Instruction]. FORMAT: [Length/Style].",
      "slide_5": "PURPOSE: [Goal]. ACTION: [Specific Instruction]. FORMAT: [Length/Style].",
      "slide_6": "PURPOSE: CTA. ACTION: [Specific Instruction]. FORMAT: [Length/Style]."
    },
    "writing_constraints": {
      "forbidden_cliches": ["3-5 phrases or structures to avoid specifically for this format"],
      "required_rhythm": "Instruction on sentence length (e.g., Short-Short-Long)",
      "visual_cues": "2-3 word descriptions of what should be happening visually per slide"
    }
  }
}"""


def generate_template(guideline_prompt: str):
    from ..client import groq

    prompt_template = """### ROLE
You are a Social Media Strategy Architect. Your task is to transform a raw user description into a high-conversion content blueprint.

USER DESCRIPTION: "{GUIDELINE}"

### THE NARRATIVE ARCHITECTURE
Every template you generate must follow this 6-stage psychological flow to ensure coherence:
1. THE HOOK: A high-contrast disruption (Statistic, Negative Constraint, or Bold Claim).
2. THE CONTEXT: Validating the "why." Why does this matter to the niche right now?
3. THE MECHANISM: The "meat." A step-by-step, a list, or a framework.
4. THE PROOF: A micro-story, case study, or "I" statement showing the result.
5. THE NUANCE: A pro-tip, a common mistake, or a "soft" variation.
6. THE CONVERSION: A direct, low-friction CTA based on the template goal.

### GENERATION RULES
- **ABSTRACT PLACEHOLDERS:** Use `[Subject]`, `[Action]`, and `[Result]` in your slide descriptions. NEVER inject specific topics (like "fitness" or "AI") unless explicitly stated in the User Description.
- **LOGICAL THREADING:** Each slide must explicitly reference the content of the previous slide to maintain a single "train of thought."
- **NO FLUFF:** Describe the purpose and the writing style for each slide, not generic "be engaging" advice.

### EXACT JSON SCHEMA
{SCHEMA}

### CRITICAL CONSTRAINTS
- **template_id:** Format "T-[CATEGORY]-[NUMBER]".
- **hook_style:** Specify the psychological trigger (e.g., "Curiosity Gap", "Fear of Missing Out").
- **Return ONLY the JSON object.**"""

    safe_guideline = guideline_prompt.replace('"', '\\"') if guideline_prompt else ""
    prompt = prompt_template.replace("{GUIDELINE}", safe_guideline).replace("{SCHEMA}", TEMPLATE_SCHEMA)

    response = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": TEMPLATE_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
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
        raise ValueError(f"No response_text received from Gemini/Groq API. Raw response: {response}")

    raw = response_text.strip()

    try:
        return json.loads(raw)
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
                return json.loads(candidate)
            except json.JSONDecodeError:
                # fall through to error below
                pass

        # If we get here, parsing failed — raise a helpful error including the raw response
        raise ValueError(f"Failed to parse JSON from model response. Raw response: {raw}")
