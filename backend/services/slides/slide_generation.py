import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from backend.models.slide import PostContent
from backend.models.user import BrandSettings
from backend.services.genai.generate_slideshow import generate_slideshow_auto
from backend.services.integrations.supabase.db.post import create_post, update_post_storage_urls
from backend.services.integrations.supabase.storage import upload_post_images_optimized
from backend.services.pillow.renderSlides import SlideRenderer
from backend.util.system_prompt import SYSTEM_PROMPT


logger = logging.getLogger(__name__)

def generate_slideshows(
  user_id: str,
  brand_id: str,
  prompt: str,
  brand_settings: BrandSettings,
  count: int = 1
):
    """
    Generate slideshow content using Gemini 2.0 Flash.
    Returns structured JSON parsed into GeminiSlideshowResponse objects.
    """
    
    print("Generating slideshows with Gemini...")
    
    systemizedPrompt = SYSTEM_PROMPT + '\n' + prompt
    

    
    # 1. Generate full JSON for a post
    post_content_list = generate_slideshow_auto(
        slideshowGoals=systemizedPrompt,
        brandSettings=brand_settings,
        count=count
    )
    
    # 2. Save all posts to Supabase (serialize PostContent to dict)
    posts = [  # Returns dicts from Supabase, not Post models
      create_post(user_id=user_id, brand_id=brand_id, content=post_content.model_dump() if hasattr(post_content, 'model_dump') else post_content.dict()) # TODO: currently no template, default to instagram
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
            
            # Update post with storage URLs
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
      
    # 6. Return List[Posts] with content json and blob links from Supabase
    return return_posts
   
    
    
    
    