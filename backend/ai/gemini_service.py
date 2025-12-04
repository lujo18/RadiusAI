# Gemini 2.0 Flash Integration Service

import json
from typing import List, Dict, Any
from google import genai
from google.genai import types

from backend.ai.prompts import build_generation_prompt
from backend.ai.structure_input import build_gemini_slide_structure
from models import (
    Template, 
    BrandSettings
)
from .client import client
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

def generate_content_with_gemini(
    template: Template, 
    brandSettings: BrandSettings,
    count: int = 1
) -> Dict[str, Any]:
    """
    Generate carousel content using Gemini 2.0 Flash.
    Returns structured JSON parsed into GeminiCarouselResponse objects.
    """
    
    request_data = build_gemini_slide_structure(template, brandSettings)
    
    prompt = build_generation_prompt(request_data)
    
    print("Prompt generated: ")
    print(prompt)
    

    # Generate content using client with JSON mode
    response = client.models.generate_content(
        model='gemini-2.0-flash-exp',
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.85,
            # top_p=0.95,
            # top_k=40,
            max_output_tokens=2048,
            response_mime_type="application/json"
        )
    )
    
    # Parse response
    response_text = response.text.strip()
    generated_data = json.loads(response_text)
    
    _validate_gemini_response(generated_data, request_data)
    
    post_content = _convert_to_post_content(
        generated_data, 
        template,
        request_data
    )
    
    return post_content

def _validate_gemini_response(generated: Dict, request: Dict) -> None:
    """Ensure Gemini filled all required text elements"""
    for req_slide in request["slides"]:
        slide_num = req_slide["slideNumber"]
        
        # Find corresponding generated slide
        gen_slide = next(
            (s for s in generated["slides"] if s["slideNumber"] == slide_num),
            None
        )
        
        if not gen_slide:
            raise ValueError(f"Gemini didn't generate slide {slide_num}")
        
        # Check all elements were filled
        for elem_id in req_slide["textElements"].keys():
            if elem_id not in gen_slide["textElements"]:
                raise ValueError(f"Gemini didn't fill element {elem_id} in slide {slide_num}")
            
            content = gen_slide["textElements"][elem_id]
            max_len = req_slide["textElements"][elem_id]["maxLength"]
            
            if len(content) > max_len:
                print(f"Warning: Element {elem_id} exceeds max length ({len(content)} > {max_len})")

def _convert_to_post_content(
    generated: Dict,
    template: Template,
    request: Dict
) -> Dict[str, Any]:
    """
    Convert Gemini's response into PostContent structure.
    Maps generated text back to slide elements.
    """
    post_slides = []
    
    for gen_slide in generated["slides"]:
        slide_num = gen_slide["slideNumber"]
        
        # Find original slide design
        seq = next(s for s in template.styleConfig.slideSequence if s.slideNumber == slide_num)
        design = next(d for d in template.styleConfig.slideDesigns if d.id == seq.designId)
        
        # Clone design elements and fill with generated content
        filled_elements = []
        for element in design.elements:
            if element.type == "text" and element.id in gen_slide["textElements"]:
                # Fill element with Gemini's content
                filled_elements.append({
                    **element.dict(),
                    "content": gen_slide["textElements"][element.id]
                })
            else:
                # Keep non-text elements as-is
                filled_elements.append(element.dict())
        
        post_slides.append({
            "slideNumber": slide_num,
            "designId": design.id,
            "background": design.background.dict(),
            "dynamic": design.dynamic,
            "elements": filled_elements,
            "imagePrompt": None  # Could add AI background prompts later
        })
    
    return {
        "slides": post_slides,
        "layout": template.styleConfig.layout.dict(),
        "caption": generated["caption"],
        "hashtags": generated["hashtags"]
    }

# ==================== USAGE EXAMPLES ====================

"""
# Example 1: Generate single post
template = get_template_from_firestore("template_id_123")
topic = "10 productivity tips for remote workers"
carousels = generate_content_with_gemini(template, topic, count=1)

# Example 2: Generate week's content
topics = [
    "5 morning habits that changed my life",
    "The truth about productivity hacks",
    "Why you're procrastinating (and how to stop)",
    "3 books that will change your mindset",
    "How I doubled my income in 6 months",
    "The biggest mistake new entrepreneurs make",
    "Simple trick to wake up at 5 AM"
]
week_content = generate_week_content(template, topics)

# Example 3: A/B testing
template_a = get_template("template_a")
template_b = get_template("template_b")
template_c = get_template("template_c")

variant_posts = generate_variant_set_content(
    templates=[template_a, template_b, template_c],
    topics=topics,
    posts_per_template=14
)

# Example 4: Validate response
carousel = carousels[0]
is_valid, violations = validate_gemini_response(carousel, template)
if not is_valid:
    print("Violations found:")
    for v in violations:
        print(f"  - {v}")
"""
