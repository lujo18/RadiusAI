# Gemini 2.0 Flash Integration Service

import json
from typing import List, Dict, Any

from app.features.generate.genai.prompts import build_generation_prompt
from app.features.generate.genai.structure_input import build_gemini_slide_structure
from app.db.models import Template, BrandSettings
from app.db.models.slide import PostContent, LayoutConfig
from app.config import Config

# Lazy import of genai to avoid protobuf issues on module load
from .client import client 
from google.genai import types

def generate_content_with_gemini(
    template: Template, 
    brandSettings: BrandSettings,
    count: int = 1
) -> List[PostContent]:
    """
    Generate carousel content using Gemini 2.0 Flash.
    Returns structured JSON parsed into GeminiCarouselResponse objects.
    """
    
    print("Building Gemini slide structure...")
    
    request_data = build_gemini_slide_structure(template, brandSettings, count)
    
    print("Request data prepared for Gemini:")
    print(request_data)
    
    prompt = build_generation_prompt(request_data, count)
    
    print("Prompt generated: ")
    print(prompt)
    
    # Generate content with JSON mode
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.85,
            max_output_tokens=2048,
            response_mime_type="application/json"
        )
    )
    
    print("Response received from Gemini.")
    
    # Parse response
    response_text = response.text.strip()
   
    generated_data = json.loads(response_text)
    
    print("Gemini response:", generated_data)
    
    # Ensure response is an array
    if not isinstance(generated_data, list):
        raise ValueError("Gemini response must be an array of post variations")
    
    _validate_gemini_response(generated_data, request_data)
    
    print(f"Passed validation for {len(generated_data)} post variations")
    
    # Convert each generated post to PostContent
    post_contents = [
        _convert_to_post_content(generated_post, template, request_data)
        for generated_post in generated_data
    ]
    
    print(f"Converted {len(post_contents)} posts successfully")
    
    return post_contents

def _validate_gemini_response(generated: List[Dict], request: Dict) -> None:
    """Ensure Gemini filled all required text elements for each post variation"""
    for post_idx, generated_post in enumerate(generated):
        for req_slide in request["slides"]:
            slide_num = req_slide["slideNumber"]
            
            # Find corresponding generated slide
            gen_slide = next(
                (s for s in generated_post["slides"] if s["slideNumber"] == slide_num),
                None
            )
            
            if not gen_slide:
                raise ValueError(f"Post {post_idx + 1}: Gemini didn't generate slide {slide_num}")
            
            # Check all elements were filled
            for elem_id in req_slide["textElements"].keys():
                if elem_id not in gen_slide["textElements"]:
                    raise ValueError(f"Post {post_idx + 1}: Gemini didn't fill element {elem_id} in slide {slide_num}")
                
                content = gen_slide["textElements"][elem_id]
                # max_len = req_slide["textElements"][elem_id]["maxLength"] Todo add max length constraints
                
                # if len(content) > max_len:
                #     print(f"Warning: Element {elem_id} exceeds max length ({len(content)} > {max_len})")

def _convert_to_post_content(
    generated: Dict,
    template: Template,
    request: Dict
) -> PostContent:
    """
    Convert a single Gemini-generated post into PostContent structure.
    Maps generated text back to slide elements.
    """
    post_slides = []
    
    for gen_slide in generated["slides"]:
        slide_num = gen_slide["slideNumber"]
        
        # Find original slide design
        seq = next(s for s in template.style_config.slide_sequence if s.slide_number == slide_num)
        design = next(d for d in template.style_config.slide_designs if d.id == seq.design_id)
        
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
            "slide_number": slide_num,
            "design_id": design.id,
            "background": design.background.dict(),
            "dynamic": design.dynamic,
            "elements": filled_elements,
            "image_prompt": None  # Could add AI background prompts later
        })
        
    
    
    return PostContent(
        slides=post_slides,
        layout=LayoutConfig(**template.style_config.layout.dict()),
        caption=generated["caption"],
        hashtags=generated["hashtags"]
    )
