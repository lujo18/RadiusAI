"""
Post CRUD operations for Supabase.
Mirrors frontend PostRepository pattern.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from app.features.posts.schemas import PostContent
from app.features.integrations.supabase.client import get_supabase
from app.features.posts.schemas import Post, CreatePostRequest, UpdatePostRequest
from app.features.analytics.service import create_analytic_tracker


# ==================== READ OPERATIONS ====================

def get_post(post_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a single post by ID.
    
    Args:
        post_id: Post UUID
    
    Returns:
        Post dict or None if not found
    """
    supabase = get_supabase()
    response = supabase.from_('posts').select('*').eq('id', post_id).single().execute()
    
    print("got post in post.py")
    
    # Handle not found gracefully
    if not response.data:
        return None
    
    return response.data


def get_post_by_external_id(external_post_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a post by external_post_id (from PostForMe webhook).
    Used to map webhook events back to Supabase posts.
    
    Args:
        external_post_id: External post ID from PostForMe
    
    Returns:
        Post dict or None if not found
    """
    supabase = get_supabase()
    try:
        response = supabase.from_('posts').select('*').eq('external_post_id', external_post_id).single().execute()
    except Exception as e:
        # Supabase/PostgREST will raise when .single() finds 0 rows (PGRST116).
        # Treat 'no rows' as not-found and return None; re-raise unexpected errors.
        msg = str(e)
        if 'Cannot coerce the result to a single JSON object' in msg or 'PGRST116' in msg:
            return None
        # Log and re-raise other exceptions so callers can handle them
        raise

    if not response.data:
        return None

    return response.data


def get_posts(brand_id: str) -> List[Dict[str, Any]]:
    """
    Get all posts for a brand, ordered by creation date (newest first).
    
    Args:
        brand_id: Brand UUID
    
    Returns:
        List of post dicts
    """
    supabase = get_supabase()
    response = supabase.from_('posts')\
        .select('*')\
        .eq('brand_id', brand_id)\
        .order('created_at', desc=True)\
        .execute()
    
    return response.data or []

def get_posts_by_status(brand_id: str, status: str) -> List[Dict[str, Any]]:
    """
    Get posts by brand and status.
    
    Args:
        brand_id: Brand UUID
        status: Post status string
    
    Returns:
        List of post dicts
    """
    supabase = get_supabase()
    response = supabase.from_('posts')\
        .select('*')\
        .eq('brand_id', brand_id)\
        .eq('status', status)\
        .order('created_at', desc=True)\
        .execute()
    
    return response.data or []


def get_posts_by_template(brand_id: str, template_id: str) -> List[Dict[str, Any]]:
    """
    Get all posts created from a specific template for a brand.
    
    Args:
        brand_id: Brand UUID
        template_id: Template UUID
    
    Returns:
        List of post dicts
    """
    supabase = get_supabase()
    response = supabase.from_('posts')\
        .select('*')\
        .eq('brand_id', brand_id)\
        .eq('template_id', template_id)\
        .order('created_at', desc=True)\
        .execute()
    
    return response.data or []


def get_scheduled_posts(brand_id: str) -> List[Dict[str, Any]]:
    """
    Get all scheduled posts for a brand, ordered by scheduled time (earliest first).
    
    Args:
        brand_id: Brand UUID
    
    Returns:
        List of scheduled post dicts
    """
    supabase = get_supabase()
    response = supabase.from_('posts')\
        .select('*')\
        .eq('brand_id', brand_id)\
        .eq('status', 'scheduled')\
        .order('scheduled_time', desc=False)\
        .execute()
    
    return response.data or []


def get_posts_by_variant_set(brand_id: str, variant_set_id: str) -> List[Dict[str, Any]]:
    """
    Get all posts in a variant set (for A/B testing) for a brand.
    
    Args:
        brand_id: Brand UUID
        variant_set_id: Variant set UUID
    
    Returns:
        List of post dicts
    """
    supabase = get_supabase()
    response = supabase.from_('posts')\
        .select('*')\
        .eq('brand_id', brand_id)\
        .eq('variant_set_id', variant_set_id)\
        .order('created_at', desc=True)\
        .execute()
    
    return response.data or []


# ==================== CREATE OPERATIONS ====================

def create_post(
    brand_id: str,
    template_id: str,
    platform: str = "tiktok",
    content: Dict[str, Any] = None, 
    status: str = "draft",
    scheduled_time: Optional[str] = None,
    variant_set_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a new post.
    
    Args:
        brand_id: Brand UUID (required)
        template_id: Template UUID
        platform: Platform name (instagram, tiktok)
        content: PostContent dict (title, caption, hashtags, slides)
        status: Post status (default: draft)
        scheduled_time: Optional ISO datetime string
        variant_set_id: Optional variant set UUID for A/B testing
        metadata: Optional metadata dict (variant_label, generation_params)
    
    Returns:
        Created post dict
    """
    supabase = get_supabase()
    
    post_data = {
        'brand_id': brand_id,
        'platform': platform,
        'status': status,
        'content': content,
        'created_at': datetime.now().isoformat(),
        'storage_urls': {'slides': [], 'thumbnail': None},
        'metadata': metadata or {}
    }
    
    if template_id:
        post_data['template_id'] = template_id
    
    if scheduled_time:
        post_data['scheduled_time'] = scheduled_time
    
    if variant_set_id:
        post_data['variant_set_id'] = variant_set_id
    
    
    response = supabase.from_('posts')\
        .insert([post_data])\
        .execute()
        
    
    if not response.data:
        raise Exception("Failed to create post")
    
    return response.data[0]


# ==================== UPDATE OPERATIONS ====================

def update_post(
    post_id: str,
    updates: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update post fields.
    
    Args:
        post_id: Post UUID
        updates: Dict of fields to update
    
    Returns:
        Updated post dict
    """
    supabase = get_supabase()
    
    # Add updated_at timestamp
    updates['updated_at'] = datetime.now().isoformat()
    
    response = (supabase.from_('posts')
        .update(updates)
        .eq('id', post_id)
        .execute())
    
    if not response.data:
        raise Exception(f"Failed to update post {post_id}")
    
    return response.data[0]


def update_post_status(
    post_id: str,
    status: str,
    published_at: Optional[str] = None,
    social_post_id: Optional[str] = None,
    error_message: Optional[str] = None
) -> bool:
    """
    Update post status with optional webhook data.
    Automatically starts analytics tracking when a post is published.
    
    Args:
        post_id: Post UUID
        status: New status (draft, scheduled, published, failed)
        published_at: ISO timestamp from webhook
        social_post_id: Social media post ID (Instagram, TikTok)
        error_message: Error details if status is failed
    
    Returns:
        True if successful
    """
    import asyncio
    
    supabase = get_supabase()
    
    update_data = {
        'status': status,
        'updated_at': datetime.now().isoformat()
    }
    
    if status == 'posted':
        update_data['published_time'] = published_at or datetime.now().isoformat()
        if social_post_id:
            update_data['external_post_id'] = social_post_id  # Store as external_post_id for analytics
    
    if status == 'failed' and error_message:
        update_data['error_message'] = error_message
    
    response = supabase.from_('posts').update(update_data).eq('id', post_id).execute()
    
    # If post is now published, start analytics tracking
    if status == 'published':
        try:
            # Run the async tracker creation
            asyncio.run(create_analytic_tracker(post_id))
        except Exception as e:
            # Don't fail the post update if analytics tracking fails
            print(f"Warning: Failed to start analytics tracking for post {post_id}: {e}")
    
    return True


def update_post_storage_urls(
    post_id: str,
    slide_urls: List[str] = None,
    thumbnail_url: Optional[str] = None
) -> dict:
    """
    Update storage URLs for post slides and thumbnail.
    
    Args:
        post_id: Post UUID
        slide_urls: List of slide image URLs
        thumbnail_url: Optional thumbnail URL
    
    Returns:
        Updated post dict
    """
    supabase = get_supabase()
    
    storage_urls = {
        'slides': slide_urls or [],
        'thumbnail': thumbnail_url
    }
    
    response = supabase.from_('posts')\
        .update({
            'storage_urls': storage_urls,
            'updated_at': datetime.now().isoformat()
        })\
        .eq('id', post_id)\
        .execute()
    
    # Return the updated post if response has data
    if response.data and len(response.data) > 0:
        return response.data[0]
    
    # Fallback: fetch the post if update didn't return it
    fetch_response = supabase.from_('posts')\
        .select('*')\
        .eq('id', post_id)\
        .single()\
        .execute()
    
    return fetch_response.data if fetch_response.data else {}


def update_post_content(
    post_id: str,
    content: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update post content (slides, caption, etc.).
    
    Args:
        post_id: Post UUID
        content: PostContent dict
    
    Returns:
        Updated post dict
    """
    return update_post(
        post_id=post_id,
        updates={'content': content}
    )


def update_post_metadata(
    post_id: str,
    metadata: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update post metadata (variant_label, generation_params, etc.).
    
    Args:
        post_id: Post UUID
        metadata: Metadata dict
    
    Returns:
        Updated post dict
    """
    return update_post(
        post_id=post_id,
        updates={'metadata': metadata}
    )


# ==================== DELETE OPERATIONS ====================

def delete_post(post_id: str) -> bool:
    """
    Delete a post.
    
    Args:
        post_id: Post UUID
    
    Returns:
        True if successful
    """
    supabase = get_supabase()
    
    response = supabase.from_('posts')\
        .delete()\
        .eq('id', post_id)\
        .execute()
    
    return True


# ==================== HELPER FUNCTIONS ====================

def get_post_content(post: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extract content from post dict.
    
    Args:
        post: Post dict from Supabase
    
    Returns:
        PostContent dict or None
    """
    return post.get('content')


def get_storage_urls(post: Dict[str, Any]) -> Dict[str, List[str]]:
    """
    Extract storage URLs from post dict.
    
    Args:
        post: Post dict from Supabase
    
    Returns:
        Dict with 'slides' (list) and 'thumbnail' (str or None)
    """
    urls = post.get('storage_urls', {})
    return {
        'slides': urls.get('slides', []),
        'thumbnail': urls.get('thumbnail')
    }


def get_post_metadata(post: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract metadata from post dict.
    
    Args:
        post: Post dict from Supabase
    
    Returns:
        Dict with 'variant_label' and 'generation_params'
    """
    metadata = post.get('metadata', {})
    return {
        'variant_label': metadata.get('variant_label'),
        'generation_params': metadata.get('generation_params', {})
    }


def get_slide_count(post: Dict[str, Any]) -> int:
    """
    Get number of slides in post content.
    
    Args:
        post: Post dict from Supabase
    
    Returns:
        Number of slides
    """
    content = get_post_content(post)
    if not content:
        return 0
    
    slides = content.get('slides', [])
    return len(slides)


def is_post_published(post: Dict[str, Any]) -> bool:
    """
    Check if post has been published.
    
    Args:
        post: Post dict from Supabase
    
    Returns:
        True if status is 'published'
    """
    return post.get('status') == 'published'


def is_post_scheduled(post: Dict[str, Any]) -> bool:
    """
    Check if post is scheduled.
    
    Args:
        post: Post dict from Supabase
    
    Returns:
        True if status is 'scheduled'
    """
    return post.get('status') == 'scheduled'


# ==================== BATCH OPERATIONS ====================

def create_posts_bulk(posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Create multiple posts in a single transaction.
    
    Args:
        posts: List of post data dicts
    
    Returns:
        List of created post dicts
    """
    supabase = get_supabase()
    
    # Add timestamps to all posts
    now = datetime.now().isoformat()
    for post in posts:
        if 'created_at' not in post:
            post['created_at'] = now
        if 'storage_urls' not in post:
            post['storage_urls'] = {'slides': [], 'thumbnail': None}
        if 'metadata' not in post:
            post['metadata'] = {}
    
    response = supabase.from_('posts')\
        .insert(posts)\
        .execute()
    
    if not response.data:
        raise Exception("Failed to create posts in bulk")
    
    return response.data


def delete_posts_by_template(brand_id: str, template_id: str) -> bool:
    """
    Delete all posts for a specific template in a brand.
    Useful when deleting a template.
    
    Args:
        brand_id: Brand UUID
        template_id: Template UUID
    
    Returns:
        True if successful
    """
    supabase = get_supabase()
    
    response = supabase.from_('posts')\
        .delete()\
        .eq('brand_id', brand_id)\
        .eq('template_id', template_id)\
        .execute()
    
    return True


def count_posts_by_template(brand_id: str, template_id: str) -> int:
    """
    Count total posts for a template in a brand.
    
    Args:
        brand_id: Brand UUID
        template_id: Template UUID
    
    Returns:
        Number of posts
    """
    posts = get_posts_by_template(brand_id, template_id)
    return len(posts)
