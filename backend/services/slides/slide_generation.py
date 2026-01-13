import logging
from backend.models.slide import PostContent
from backend.models.user import BrandSettings
from backend.services.genai.generate_slideshow import generate_slideshow_auto
from backend.services.integrations.supabase.db.post import create_post, update_post_storage_urls
from backend.services.integrations.supabase.storage import upload_post_images_optimized
from backend.services.pillow.renderSlides import SlideRenderer


logger = logging.getLogger(__name__)

def generate_slideshows(
  user_id: str,
  prompt: str,
  brand_settings: BrandSettings,
  count: int = 1
):
    """
    Generate slideshow content using Gemini 2.0 Flash.
    Returns structured JSON parsed into GeminiSlideshowResponse objects.
    """
    
    print("Generating slideshows with Gemini...")
    
    # 1. Generate full JSON for a post
    post_content_list = generate_slideshow_auto(
        slideshowGoals=prompt,
        brandSettings=brand_settings,
        count=count
    )
    
    # 2. Save all posts to Supabase (serialize PostContent to dict)
    posts = [  # Returns dicts from Supabase, not Post models
      create_post(user_id=user_id, content=post_content.model_dump() if hasattr(post_content, 'model_dump') else post_content.dict()) # TODO: currently no template, default to instagram
      for post_content in post_content_list
    ]
    
    # 3. Render the generated slides
    renderer = SlideRenderer()
    
    return_posts = []
    
    for post in posts:
      
      logger.info(f"Processing post: {post['id']}")
      
      # Convert dict to PostContent Pydantic model so render_slides can use dot notation
      post_content = PostContent(**post['content'])
      
      # Now post_content.slides is a list of PostSlide Pydantic objects
      slide_images = renderer.render_slides(post_content.slides)
      
      
      # TODO: Integrate Late API here --->
      
      
       # 4. Optimize all slides for Supabase
       # 5. Save all slides to supabase buckets
      result = upload_post_images_optimized(
        user_id=user_id,
        post_id=post['id'],
        slide_images=slide_images,
        optimize=True
      )
      
      post = update_post_storage_urls(
        post_id=post['id'],
        user_id=user_id,
        slide_urls=result["slide_urls"],
        thumbnail_url=result["thumbnail_url"]
      )
      
      return_posts.append(post)
      
    # 6. Return List[Posts] with content json and blob links from Supabase
    return return_posts
   
    
    
    
    