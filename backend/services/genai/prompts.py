# backend/ai/prompts.py
from typing import Any, Dict

SYSTEM_PROMPT = """### OPERATIONAL ROLE
You are a viral social media architect. Your output is strictly JSON. You prioritize "Human-First" writing over technical perfection, but never violate character constraints.

### THE "UN-AI" WRITING PROTOCOL
1. **Sentence Architecture:** - No two consecutive sentences should have the same word count.
   - Use "I" and "me" to anchor the content in personal experience. (ONLY IN REFLECTIVE SECTIONS. NOT ALL SENTANCES)
   - Use active, visceral verbs (e.g., "grab," "sink," "toss") instead of "is," "are," or "represents."
2. **The "Gray List" (Forbidden Patterns):** - No "Rule of Three" (X, Y, and Z). 
   - No balanced "Not only X but also Y" structures.
   - No introductory filler ("Let's dive in," "In today's fast-paced world").
3. **Vocabulary Guardrails:** - Forbidden: delve, underscore, testament, vibrant, multifaceted, tapestry, leverage, unlock, elevate, empower.

### TECHNICAL CONSTRAINTS (HARD RULES)
- **Character Set:** Only [a-zA-Z0-9] and [ - , . : " ' ( ) ? ! \\ ]. 
- **Formatting:** Use `\\n\\n` (new lines) every 2 sentences. 
- **Hook Rule:** Maximum 1 sentance. Must be readable in <1 second. Prioritize numbers and results.
- **IDs:** Fill every text element ID provided. No placeholders.
- Do not echo the prompt or provide a conversational preamble. Return only the raw JSON variation.
"""

def build_generation_prompt(requestData: Dict[str, Any], count: int) -> str:
    """
    Build the complete prompt for Gemini including structure and instructions.
    """
    slides = requestData["slides"]
    brand = requestData["brandContext"]
    # rules = request_data["templateRules"] TODO: TemplateRules, Determine implementation
    # goal = request_data["contentGoal"]
    
    # Build detailed element instructions
    element_instructions = []
    for slide in slides:
        slide_num = slide["slideNumber"]
        element_instructions.append(f"\nSlide {slide_num} ({slide['designName']}):")
        
        for elem_id, elem_info in slide["textElements"].items():
            element_instructions.append(
                f"  • {elem_id}: {elem_info['content']}\n"
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
    "hashtags": ["tag1", "tag2", "tag3"]
  }},
  ... (repeat {count} times with DIFFERENT content each time)
]

RULES:
- Each slide appears ONCE. ALL its textElements in ONE object — never split across multiple objects.
- Generate {count} UNIQUE variations, each with different content, caption, and hashtags.
Output ONLY the JSON array."""
    
    return prompt
  
  
  
#   TEMPLATE RULES:
# - Format: {rules['format']}
# - Perspective: {rules['perspective']}
# - Depth: {rules['depthLevel']}
# - Hook Style: {rules['hookStyle']}
# - Body Style: {rules['bodyStyle']}
# - CTA Style: {rules['ctaStyle']}

# CONTENT GOAL: {goal}