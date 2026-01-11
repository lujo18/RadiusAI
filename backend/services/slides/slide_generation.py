from backend.models.user import BrandSettings
from backend.services.genai.generate_slideshow import generate_slideshow_auto
from backend.services.integrations.supabase.db.post import create_post, update_post_storage_urls
from backend.services.integrations.supabase.storage import upload_post_images_optimized
from backend.services.pillow.renderSlides import SlideRenderer


def generate_slideshows(
  user_id: str,
  prompt: str,
  BrandSettings: BrandSettings,
  count: int = 1
):
    """
    Generate slideshow content using Gemini 2.0 Flash.
    Returns structured JSON parsed into GeminiSlideshowResponse objects.
    """
    
    print("Generating slideshows with Gemini...")
    
    # 1. Generate full JSON for a post
    posts = generate_slideshow_auto(
        slideshowGoals=prompt,
        brandSettings=BrandSettings,
        count=count
    )
    
    # 2. Save all posts to Supabase
    posts = [
      create_post(user_id, "", "", post) # TODO: currently no template or platform
      for post in posts
    ]
    
    # 3. Render the generated slides
    renderer = SlideRenderer()
    
    return_posts = []
    
    for post in posts:
      slide_images = renderer.render_slides(post.content.slides)
      
      
      # TODO: Integrate Late API here --->
      
      
       # 4. Optimize all slides for Supabase
       # 5. Save all slides to supabase buckets
      result = upload_post_images_optimized(
        user_id=user_id,
        post_id=post.id,
        slide_images=slide_images,
        optimize=True
      )
      
      post = update_post_storage_urls(
        post_id=post.id,
        user_id=user_id,
        slide_urls=result["slide_urls"],
        thumbnail_url=result["thumbnail_url"]
      )
      
      return_posts.append(post)
      
    # 6. Return List[Posts] with content json and blob links from Supabase
    return return_posts
   
    
    
    
    