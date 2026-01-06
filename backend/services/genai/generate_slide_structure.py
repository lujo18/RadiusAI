from .client import client 
from .slide_layouts import create_slide_from_layout, get_available_layouts
from google.genai import types


def generate_slide_structure(hook: str, slideshowType: str):
    """
    Generate slide structure based on the provided hook and slideshow type.
    
    Args:
        hook: The hook text for the slideshow
        slideshowType: Type of slideshow structure to generate
                      Options: 'hook_only', 'hook_body_cta', '3_value_points', etc.
    
    Returns:
        List of slide designs ready for frontend rendering
    """
    
    slideOptions = get_available_layouts()
    
    prompt = f"""
    You are an expert slide designer. Create a slide structure for a slideshow based on the following hook: "{hook}".
    The slideshow type is "{slideshowType}". The slideshow should consist of multiple slides, each with a specific layout. The available slide layouts are described by keys: {', '.join(slideOptions)}.
    Provide an array of the slide layout keys that best fit the slideshow type.
    
    Use a consistent layout pattern, ex: {"hook", "body", "body", "body"}
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.85,
            max_output_tokens=2048,
            response_mime_type="application/json"
        )
    )
   
  
  