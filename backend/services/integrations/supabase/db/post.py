"""
Post CRUD operations for Supabase.
Mirrors frontend PostRepository pattern.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from backend.models.slide import PostContent
from backend.services.integrations.supabase.client import get_supabase
from backend.models.post import Post, CreatePostRequest, UpdatePostRequest


# ==================== READ OPERATIONS ====================

def get_post(post_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Get a single post by ID.
    
    Args:
        post_id: Post UUID
        user_id: Optional user_id for RLS filtering
    
    Returns:
        Post dict or None if not found
    """
    supabase = get_supabase()
    query = supabase.from_('posts').select('*').eq('id', post_id)
    
    if user_id:
        query = query.eq('user_id', user_id)
    
    response = query.single().execute()
    
    # Handle not found gracefully
    if not response.data:
        return None
    
    return response.data


def get_posts(user_id: str) -> List[Dict[str, Any]]:
    """
    Get all posts for a user, ordered by creation date (newest first).
    
    Args:
        user_id: User UUID
    
    Returns:
        List of post dicts
    """
    supabase = get_supabase()
    response = supabase.from_('posts')\
        .select('*')\
        .eq('user_id', user_id)\
        .order('created_at', desc=True)\
        .execute()
    
    return response.data or []


def get_posts_by_status(user_id: str, status: str) -> List[Dict[str, Any]]:
    """
    Get posts filtered by status (draft, scheduled, published, failed).
    
    Args:
        user_id: User UUID
        status: Post status string
    
    Returns:
        List of post dicts
    """
    supabase = get_supabase()
    response = supabase.from_('posts')\
        .select('*')\
        .eq('user_id', user_id)\
        .eq('status', status)\
        .order('created_at', desc=True)\
        .execute()
    
    return response.data or []


def get_posts_by_template(user_id: str, template_id: str) -> List[Dict[str, Any]]:
    """
    Get all posts created from a specific template.
    
    Args:
        user_id: User UUID
        template_id: Template UUID
    
    Returns:
        List of post dicts
    """
    supabase = get_supabase()
    response = supabase.from_('posts')\
        .select('*')\
        .eq('user_id', user_id)\
        .eq('template_id', template_id)\
        .order('created_at', desc=True)\
        .execute()
    
    return response.data or []


def get_scheduled_posts(user_id: str) -> List[Dict[str, Any]]:
    """
    Get all scheduled posts ordered by scheduled time (earliest first).
    
    Args:
        user_id: User UUID
    
    Returns:
        List of scheduled post dicts
    """
    supabase = get_supabase()
    response = supabase.from_('posts')\
        .select('*')\
        .eq('user_id', user_id)\
        .eq('status', 'scheduled')\
        .order('scheduled_time', desc=False)\
        .execute()
    
    return response.data or []


def get_posts_by_variant_set(user_id: str, variant_set_id: str) -> List[Dict[str, Any]]:
    """
    Get all posts in a variant set (for A/B testing).
    
    Args:
        user_id: User UUID
        variant_set_id: Variant set UUID
    
    Returns:
        List of post dicts
    """
    supabase = get_supabase()
    response = supabase.from_('posts')\
        .select('*')\
        .eq('user_id', user_id)\
        .eq('variant_set_id', variant_set_id)\
        .order('created_at', desc=True)\
        .execute()
    
    return response.data or []


# ==================== CREATE OPERATIONS ====================

def create_post(
    user_id: str,
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
        user_id: User UUID
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
        'user_id': user_id,
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
    updates: Dict[str, Any],
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Update post fields.
    
    Args:
        post_id: Post UUID
        updates: Dict of fields to update
        user_id: Optional user_id for RLS filtering
    
    Returns:
        Updated post dict
    """
    supabase = get_supabase()
    
    # Add updated_at timestamp
    updates['updated_at'] = datetime.now().isoformat()
    
    query = supabase.from_('posts')\
        .update(updates)\
        .eq('id', post_id)
    
    if user_id:
        query = query.eq('user_id', user_id)
    
    response = query.execute()
    
    if not response.data:
        raise Exception(f"Failed to update post {post_id}")
    
    return response.data[0]


def update_post_status(
    post_id: str,
    status: str,
    user_id: str
) -> bool:
    """
    Update post status and set published_time if status is 'published'.
    
    Args:
        post_id: Post UUID
        status: New status (draft, scheduled, published, failed)
        user_id: User UUID
    
    Returns:
        True if successful
    """
    supabase = get_supabase()
    
    update_data = {
        'status': status,
        'updated_at': datetime.now().isoformat()
    }
    
    if status == 'published':
        update_data['published_time'] = datetime.now().isoformat()
    
    response = supabase.from_('posts')\
        .update(update_data)\
        .eq('id', post_id)\
        .eq('user_id', user_id)\
        .execute()
    
    return True


def update_post_storage_urls(
    post_id: str,
    user_id: str,
    slide_urls: List[str],
    thumbnail_url: Optional[str] = None
) -> dict:
    """
    Update storage URLs for post slides and thumbnail.
    
    Args:
        post_id: Post UUID
        user_id: User UUID
        slide_urls: List of slide image URLs
        thumbnail_url: Optional thumbnail URL
    
    Returns:
        Updated post dict
    """
    supabase = get_supabase()
    
    storage_urls = {
        'slides': slide_urls,
        'thumbnail': thumbnail_url
    }
    
    response = supabase.from_('posts')\
        .update({
            'storage_urls': storage_urls,
            'updated_at': datetime.now().isoformat()
        })\
        .eq('id', post_id)\
        .eq('user_id', user_id)\
        .execute()
    
    # Return the updated post if response has data
    if response.data and len(response.data) > 0:
        return response.data[0]
    
    # Fallback: fetch the post if update didn't return it
    fetch_response = supabase.from_('posts')\
        .select('*')\
        .eq('id', post_id)\
        .eq('user_id', user_id)\
        .single()\
        .execute()
    
    return fetch_response.data if fetch_response.data else {}


def update_post_content(
    post_id: str,
    user_id: str,
    content: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update post content (slides, caption, etc.).
    
    Args:
        post_id: Post UUID
        user_id: User UUID
        content: PostContent dict
    
    Returns:
        Updated post dict
    """
    return update_post(
        post_id=post_id,
        updates={'content': content},
        user_id=user_id
    )


def update_post_metadata(
    post_id: str,
    user_id: str,
    metadata: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update post metadata (variant_label, generation_params, etc.).
    
    Args:
        post_id: Post UUID
        user_id: User UUID
        metadata: Metadata dict
    
    Returns:
        Updated post dict
    """
    return update_post(
        post_id=post_id,
        updates={'metadata': metadata},
        user_id=user_id
    )


# ==================== DELETE OPERATIONS ====================

def delete_post(post_id: str, user_id: Optional[str] = None) -> bool:
    """
    Delete a post.
    
    Args:
        post_id: Post UUID
        user_id: Optional user_id for RLS filtering
    
    Returns:
        True if successful
    """
    supabase = get_supabase()
    
    query = supabase.from_('posts')\
        .delete()\
        .eq('id', post_id)
    
    if user_id:
        query = query.eq('user_id', user_id)
    
    response = query.execute()
    
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


def delete_posts_by_template(user_id: str, template_id: str) -> bool:
    """
    Delete all posts for a specific template.
    Useful when deleting a template.
    
    Args:
        user_id: User UUID
        template_id: Template UUID
    
    Returns:
        True if successful
    """
    supabase = get_supabase()
    
    response = supabase.from_('posts')\
        .delete()\
        .eq('user_id', user_id)\
        .eq('template_id', template_id)\
        .execute()
    
    return True


def count_posts_by_template(user_id: str, template_id: str) -> int:
    """
    Count total posts for a template.
    
    Args:
        user_id: User UUID
        template_id: Template UUID
    
    Returns:
        Number of posts
    """
    posts = get_posts_by_template(user_id, template_id)
    return len(posts)
