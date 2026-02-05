import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from models.slide import PostContent
from models.template import Template
from models.user import BrandSettings
from services.genai.generate_slideshow import generate_slideshow_auto
from services.usage import service as usage_service
from services.integrations.supabase.db.post import create_post, update_post_storage_urls
from services.integrations.supabase.storage import upload_post_images_optimized
from services.pillow.renderSlides import SlideRenderer
from util.system_prompt import SYSTEM_PROMPT
import json


logger = logging.getLogger(__name__)

def generate_slideshows(
  user_id: str,
  brand_id: str,
  template: Template,
  brand_settings: BrandSettings,
  count: int = 1,
  cta: dict = None
):
    """
    Generate slideshow content using Gemini 2.0 Flash.
    Returns structured JSON parsed into GeminiSlideshowResponse objects.
    """
    
    print("Generating slideshows with Gemini...")
    
    # Convert content_rules dict to string for prompt
    prompt = json.dumps(template.content_rules)
    
    logger.info("Prompt from template", prompt)
    
    # 1. Check usage allowance and reserve generation tokens
    check = usage_service.check_and_consume(user_id, product_id="slides_generation", amount=count)
    if not check.get('allowed'):
        raise RuntimeError(f"Slide generation not allowed: remaining={check.get('remaining')} limit={check.get('limit')}")

    # 2. Generate full JSON for a post
    post_content_list = generate_slideshow_auto(
        slideshowGoals=prompt,
        brandSettings=brand_settings,
        count=count,
        cta=cta
    )
    
    # 2. Save all posts to Supabase (serialize PostContent to dict)
    posts = [  # Returns dicts from Supabase, not Post models
      create_post(user_id=user_id, brand_id=brand_id, template_id=template.id, content=post_content.model_dump() if hasattr(post_content, 'model_dump') else post_content.dict()) # TODO: currently no template, default to instagram
      for post_content in post_content_list
    ]
    
    # 3. Render and process posts in parallel
    renderer = SlideRenderer()
    return_posts = []
    
    def process_post(post):
        """Process a single post: render slides, upload to storage, update DB"""
        try:
            logger.info(f"Processing post: {post['id']}")
            
            # Convert dict to PostContent Pydantic model
            post_content = PostContent(**post['content'])
            
            # Render all slides (now happens in parallel within render_slides)
            slide_images = renderer.render_slides(post_content.slides)
            
            # Upload images to Supabase
            result = upload_post_images_optimized(
                user_id=post.get('user_id'),
                post_id=post['id'],
                slide_images=slide_images,
                optimize=True
            )
            
            # Update post with storage URLs and get the updated post back
            updated_post = update_post_storage_urls(
                post_id=post['id'],
                user_id=post.get('user_id'),
                slide_urls=result["slide_urls"],
                thumbnail_url=result["thumbnail_url"]
            )
            
            return updated_post
        except Exception as e:
            logger.error(f"Failed to process post {post['id']}: {e}", exc_info=True)
            raise
    
    # Process multiple posts in parallel (up to 2 concurrent post processing)
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(process_post, post): post for post in posts}
        
        for future in as_completed(futures):
            try:
                processed_post = future.result()
                return_posts.append(processed_post)
            except Exception as e:
                post = futures[future]
                logger.error(f"Error processing post {post['id']}: {e}")
      
    # 6. Record slides generated for successful posts and return results
    try:
        total_slides = 0
        for p in return_posts:
            content = p.get('content') or {}
            slides = content.get('slides') if isinstance(content, dict) else None
            if slides:
                total_slides += len(slides)

        if total_slides > 0:
            usage_service.track_slides_generated(user_id, total_slides)
    except Exception as e:
        logger.warning(f"Failed to record slides generated usage: {e}")

    return return_posts
   
    
    
    
    