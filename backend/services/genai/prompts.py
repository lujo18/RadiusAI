# backend/ai/prompts.py
import json
from typing import Any, Dict

SYSTEM_PROMPT = """
You are a viral social media content creator. You will receive a carousel post structure 
with SPECIFIC text element IDs that you must fill with appropriate content.

CRITICAL RULES:
1. You MUST fill every text element ID provided - no skipping
2. Respect max length for each element (character count)
3. Follow the role/context for each element
4. Maintain brand voice and tone throughout
5. Never use forbidden words
6. Output ONLY valid JSON matching the exact structure provided

Your output will be directly inserted into a visual design, so accuracy is critical.
"""

def build_generation_prompt(request_data: Dict[str, Any], count: int) -> str:
    """
    Build the complete prompt for Gemini including structure and instructions.
    """
    slides = request_data["slides"]
    brand = request_data["brandContext"]
    # rules = request_data["templateRules"] TODO: TemplateRules, Determine implementation
    # goal = request_data["contentGoal"]
    
    # Build detailed element instructions
    element_instructions = []
    for slide in slides:
        slide_num = slide["slideNumber"]
        element_instructions.append(f"\nSlide {slide_num} ({slide['designName']}):")
        
        for elem_id, elem_info in slide["textElements"].items():
            element_instructions.append(
                f"  • {elem_id} ({elem_info['role']}): {elem_info['content']}\n"
                # f"    Max {elem_info['maxLength']} characters" TODO: Add maxLength, as last resort if gemini occasionally generates way too much text (not sure if this is a problem)
            )
    
    prompt = f"""{SYSTEM_PROMPT}

BRAND CONTEXT:
- Niche: {brand['niche']}
- Aesthetic: {brand['aesthetic']}
- Tone: {brand['tone']}
- Emoji Usage: {brand['emojiUsage']}
- NEVER use: {', '.join(brand['forbidden'])}
- Prefer using: {', '.join(brand['preferred'])}

TEXT ELEMENTS TO FILL:
{''.join(element_instructions)}

REQUIRED OUTPUT FORMAT (strict JSON array with {count} different variations):
[
  {{
    "slides": [
      {{
        "slideNumber": 1,
        "textElements": {{
          "element-id-1": "your generated text here",
          "element-id-2": "another text here"
        }}
      }},
      {{
        "slideNumber": 2,
        "textElements": {{
          "element-id-3": "text for slide 2 element 1",
          "element-id-4": "text for slide 2 element 2"
        }}
      }}
    ],
    "caption": "Instagram caption (engaging, {brand['tone']}, includes topic keywords)",
    "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  }},
  ... (repeat {count} times with DIFFERENT content each time)
]

INPUT STRUCTURE (you must fill the textElements for each slide):
{json.dumps(request_data['slides'], indent=2)}

CRITICAL RULES:
1. Each slide object appears ONLY ONCE in the slides array
2. ALL textElements for a slide MUST be in the SAME slide object
3. DO NOT create separate objects for each text element
4. Each slide groups ALL its text elements together in ONE textElements object

EXAMPLE - CORRECT:
{{
  "slideNumber": 2,
  "textElements": {{
    "elem-A": "First text",
    "elem-B": "Second text",
    "elem-C": "Third text"
  }}
}}

EXAMPLE - WRONG (DO NOT DO THIS):
{{
  "slideNumber": 2,
  "textElements": {{"elem-A": "First text"}}
}},
{{
  "slideNumber": 2,
  "textElements": {{"elem-B": "Second text"}}
}}

Generate {count} UNIQUE variations. Each variation should have:
- Different content for all text elements
- Different caption and hashtags
- Same structure but completely different creative execution

Now generate {count} complete posts that fill ALL text elements while following ALL brand and template rules.
Output ONLY the JSON array with {count} variations."""
    
    return prompt
  
  
  
#   TEMPLATE RULES:
# - Format: {rules['format']}
# - Perspective: {rules['perspective']}
# - Depth: {rules['depthLevel']}
# - Hook Style: {rules['hookStyle']}
# - Body Style: {rules['bodyStyle']}
# - CTA Style: {rules['ctaStyle']}

# CONTENT GOAL: {goal}