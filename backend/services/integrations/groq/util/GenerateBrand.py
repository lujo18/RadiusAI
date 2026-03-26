import json

# Import groq client lazily inside the function to avoid heavy network or setup at import-time


BRAND_SYSTEM_PROMPT = """
You are a Brand Strategist. Your task is to transform the user's specific guidelines into a cohesive JSON brand identity. 
- You MUST use the niche and topics provided by the user. 
- Do NOT invent a new industry. 
- Create a name that is creative and relevant to the user's input.
- INFER reading_level from target audience + niche. Examples:
  - "Wellness/mental health, young professionals" → "conversational"
  - "B2B SaaS, CTOs/founders" → "expert"
  - "Gen Z fitness/lifestyle" → "high school"
  - "Personal development, all ages" → "conversational"
- Return ONLY valid JSON.
"""


def generate_brand(guideline_prompt: str):
    from ..client import groq

    # Build a safe prompt by replacing a placeholder (avoids accidental brace interpolation)
    prompt_template = """
USER GUIDELINES: "{GUIDELINE}"

Based on the guidelines above, generate a BrandSettings JSON object describing the brand.
OUTPUT RULES (STRICT):
1) Return ONLY a single JSON object and nothing else (no markdown, no commentary, no surrounding text).
2) Use double quotes for keys and string values, no trailing commas.
3) Provide the exact keys listed in the sample below. Use the guideline to fill sensible, specific values.

SAMPLE OUTPUT (exact shape and types expected):
{
  "name": str "Stellar Brand",
  "niche": str "vegan skincare for busy professionals",
  "aesthetic": str "minimal, high-contrast, muted pastels",
  "target_audience": str "young professionals seeking low-effort premium self-care; pain points: time, price sensitivity",
  "brand_voice": str "friendly-expert",
  "reading_level": str "conversational",
  "content_pillars": str[] ["how-to", "product-benefits", "customer-stories"],
  "tone_of_voice": str "professional",
  "emoji_usage": str "minimal",
  "forbidden_words": str[] ["game-changer", "journey"],
  "preferred_words": str[] ["clinically-tested", "clean"],
  "hashtag_style": str "niche" | "trending" | "mixed",
  "hashtag_count": 5,
  "hashtags": str[] ["veganbeauty", "skincaretips", "cleanbeauty"]
}

If you cannot produce valid JSON for any reason, try to produce the best-effort JSON object above. Do not include any explanation.
"""

    # Escape double-quotes in the guideline when injecting
    safe_guideline = guideline_prompt.replace('"', '\\"') if guideline_prompt else ""
    prompt = prompt_template.replace("{GUIDELINE}", safe_guideline)
    response = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": BRAND_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.4,
        top_p=0.9,
        presence_penalty=0.1,
        frequency_penalty=0.1,
        max_completion_tokens=2048,
    )

    response_text = response.choices[0].message.content

    print("Brand Generation Response:", response_text)

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
