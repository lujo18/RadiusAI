from typing import List, Dict, Any
from models import Template, BrandSettings

def build_gemini_slide_structure(
  template: Template,
  brand_settings: BrandSettings
) -> dict[str, Any]:
  """
  Convert template structure into Gemini-ready format.
  Maps each text element with context about its role.
  """
  
  style_config = template.styleConfig
  
  slides_structure = []
  
  # Use the template's slide sequence
  for sequence in style_config.slideSequence:
    
    design = next(
      (design for design in template.styleConfig.slideDesigns if design.id == sequence.designId), 
      None
    )
    
    if not design or not design.dynamic:
      continue # Skip if design not found or is static page
    
    text_elements = {}
    for element in design.elements:
      if element.type == "text":
        text_elements[element.id] = {
          "content": element.content,  # Placeholder for generated text
          "role": None, # TODO: Determine role (could be passed from frontend)
          "constraints": None # TODO: Add any constraints like character limits
        }
        
        
    slides_structure.append({
      "slideNumber": sequence.slideNumber,
      "designId": design.id,
      "designName": design.name,
      "textElements": text_elements
    })
    
  return {
    "slides": slides_structure,
      "brandContext": {
        "niche": brand_settings.niche,
        "aesthetic": brand_settings.aesthetic,
        "tone": brand_settings.toneOfVoice,
        "emojiUsage": brand_settings.emojiUsage,
        "forbidden": brand_settings.forbiddenWords,
        "preferred": brand_settings.preferredWords
      },
      "templateRules": {
        "format": style_config.contentRules.format,
        "perspective": style_config.contentRules.perspective,
        "depthLevel": style_config.contentRules.depthLevel,
        "topicFocus": style_config.contentRules.topicFocus,
        "hookStyle": style_config.contentRules.hookStyle,
        "bodyStyle": style_config.contentRules.bodyStyle,
        "ctaStyle": style_config.contentRules.ctaStyle
      },
      "contentGoal": style_config.contentRules.topicFocus
  }
  