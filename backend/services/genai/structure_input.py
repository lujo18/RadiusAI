from typing import List, Dict, Any
from app.features.templates.schemas import Template
from app.features.user.schemas import BrandSettings

def build_gemini_slide_structure(
  template: Template,
  brand_settings: BrandSettings,
  count: int
) -> dict[str, Any]:
  """
  Convert template structure into Gemini-ready format.
  Maps each text element with context about its role.
  """
  
  style_config = template.style_config
  
  slides_structure = []
  
  # Use the template's slide sequence
  for sequence in style_config.slide_sequence:
    
    design = next(
      (design for design in template.style_config.slide_designs if design.id == sequence.design_id), 
      None
    )
    
    if not design or not design.dynamic:
      continue # Skip if design not found or is static page
    
    text_elements = {}
    for element in design.elements:
      if element.type == "text":
        text_elements[element.id] = {
          "content": element.content
        }
        
        
    slides_structure.append({
      "slideNumber": sequence.slide_number,
      "designId": design.id,
      "designName": design.name,
      "textElements": text_elements
    })
    
  return {
    "slides": slides_structure,
      "brandContext": {
        "niche": brand_settings.niche,
        "aesthetic": brand_settings.aesthetic,
        "tone": brand_settings.tone_of_voice,
        "emojiUsage": brand_settings.emoji_usage,
        "forbidden": brand_settings.forbidden_words,
        "preferred": brand_settings.preferred_words
      },
      # "templateRules": {
      #   "format": style_config.contentRules.format,
      #   "perspective": style_config.contentRules.perspective,
      #   "depthLevel": style_config.contentRules.depthLevel,
      #   "topicFocus": style_config.contentRules.topicFocus,
      #   "hookStyle": style_config.contentRules.hookStyle,
      #   "bodyStyle": style_config.contentRules.bodyStyle,
      #   "ctaStyle": style_config.contentRules.ctaStyle
      # },
      # "contentGoal": style_config.contentRules.topicFocus
  }
  