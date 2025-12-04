"""
Take in the slide JSON
Parse it for it's text content and image/background
Build the entire slide using Pillow or a better library
""" 


from backend.models.slide import LayoutConfig, PostSlide

def build_generation_prompt(
    user_profile: dict,
    template: dict,
    topic: str = None
) -> str:
    """
    Combine all three layers into final Gemini prompt
    """
    brand = user_profile['brandSettings']
    rules = template['contentRules']
    
    prompt = f"""
{SYSTEM_PROMPT}

BRAND CONTEXT (Apply to ALL content):
- Niche: {brand['niche']}
- Aesthetic: {brand['aesthetic']}
- Target Audience: {brand['targetAudience']}
- Brand Voice: {brand['brandVoice']}
- Tone: {brand['toneOfVoice']}
- Emoji Usage: {brand['emojiUsage']}
- NEVER use these words: {', '.join(brand['forbiddenWords'])}
- Prefer these words: {', '.join(brand['preferredWords'])}

TEMPLATE-SPECIFIC RULES:
- Format: {rules['format']}
- Perspective: Write as a {rules['perspective']}
- Depth: {rules['depthLevel']} - {"Go deep with examples and how-tos" if rules['depthLevel'] == 'detailed' else 'Keep it concise'}
- Topic Focus: {rules['topicFocus']}
- Hook Style: {rules['hookStyle']}
- Body Style: {rules['bodyStyle']}
- CTA Style: {rules['ctaStyle']}

{"Include real-world examples for each point." if rules.get('includeExamples') else ""}
{"Add a relevant statistic or data point if possible." if rules.get('includeStatistics') else ""}
{"Weave in a brief personal anecdote." if rules.get('personalStory') else ""}

SLIDE STRUCTURE:
{_build_slide_structure(template['styleConfig']['slideSequence'], rules)}

{"SPECIFIC TOPIC: " + topic if topic else "Choose a trending topic within: " + rules['topicFocus']}

Now generate the carousel content following ALL rules above.
"""
    return prompt

def _build_slide_structure(sequence: list, rules: dict) -> str:
    """Generate slide-by-slide instructions"""
    structure = []
    
    for i, slide in enumerate(sequence, 1):
        if i == 1:
            structure.append(f"Slide {i} (Hook): {rules['hookStyle']} - Create immediate curiosity")
        elif i == len(sequence):
            structure.append(f"Slide {i} (CTA): {rules['ctaStyle']} - Natural call-to-action")
        else:
            structure.append(f"Slide {i} (Body): {rules['bodyStyle']} - Deliver core value")
    
    return "\n".join(structure)

def build_slide (slideFormat: PostSlide, slideIndex: int, layout: LayoutConfig) -> bytes:
  """Create one slide
  
  1. Take the designated slide design json (handled in other function)
  2. Index of slide
  3. Fomat data
  
  Generate text that fills the konvaText objects inside of the slide data
  1. Parse out the konvaText and the rules for the specific text
  2. Get the "id" of the text (so we can plug in the generated response into the slide)
  """
  """
    Build a slide image from validated Pydantic models.
    
    Args:
        slide: PostSlide object with background and elements
        layout: LayoutConfig with dimensions
        
    Returns:
        PIL Image object
  """
    
  