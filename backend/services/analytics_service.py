# Analytics Service
# Helper functions for analytics operations

from typing import Optional
from services.integrations.supabase.client import get_supabase
from models.analytics import PostAnalyticsRecord
from services.workers.analytics.create_analytic_tracker import create_analytic_tracker
from datetime import datetime, timezone

supabase = get_supabase()


async def start_tracking_post_analytics(post_id: str) -> bool:
    """
    Start tracking analytics for a post after it's published.
    Creates a record in post_tracking_metadata to schedule periodic collection.
    
    Args:
        post_id: The Supabase post ID
    
    Returns:
        True if successful, False if error
    """
    try:
        await create_analytic_tracker(post_id)
        return True
    except Exception as e:
        print(f"Error starting analytics tracking for post {post_id}: {e}")
        return False


def get_post_analytics(post_id: str) -> Optional[dict]:
    """
    Get the latest analytics snapshot for a post.
    
    Args:
        post_id: The Supabase post ID
    
    Returns:
        Analytics record dict, or None if not found
    """
    try:
        response = supabase.table("post_analytics").select("*").eq("post_id", post_id).single().execute()
        
        if not response.data:
            return None
        
        return response.data
    except Exception as e:
        print(f"Error fetching analytics for post {post_id}: {e}")
        return None


def get_post_tracking_metadata(post_id: str) -> Optional[dict]:
    """
    Get tracking metadata for a post (collection schedule info).
    
    Args:
        post_id: The Supabase post ID
    
    Returns:
        Tracking metadata dict, or None if not found
    """
    try:
        response = supabase.table("post_tracking_metadata").select("*").eq("post_id", post_id).single().execute()
        
        if not response.data:
            return None
        
        return response.data
    except Exception as e:
        print(f"Error fetching tracking metadata for post {post_id}: {e}")
        return None


def get_brand_analytics_summary(brand_id: str) -> Optional[dict]:
    """
    Get aggregated analytics summary for all posts in a brand.
    
    Args:
        brand_id: The Supabase brand ID
    
    Returns:
        Summary dict with aggregated metrics, or None if error
    """
    try:
        # Get all posts for this brand
        posts_response = supabase.table("posts").select("id").eq("brand_id", brand_id).execute()
        
        if not posts_response.data:
            return {
                "brand_id": brand_id,
                "total_posts": 0,
                "total_likes": 0,
                "total_comments": 0,
                "total_shares": 0,
                "total_saves": 0,
                "total_impressions": 0,
                "avg_engagement_rate": 0,
            }
        
        post_ids = [p["id"] for p in posts_response.data]
        
        # Get analytics for all posts
        analytics_response = supabase.table("post_analytics").select("*").in_("post_id", post_ids).execute()
        
        if not analytics_response.data:
            return {
                "brand_id": brand_id,
                "total_posts": len(post_ids),
                "total_likes": 0,
                "total_comments": 0,
                "total_shares": 0,
                "total_saves": 0,
                "total_impressions": 0,
                "avg_engagement_rate": 0,
            }
        
        # Aggregate metrics
        total_likes = sum(a.get("likes", 0) for a in analytics_response.data)
        total_comments = sum(a.get("comments", 0) for a in analytics_response.data)
        total_shares = sum(a.get("shares", 0) for a in analytics_response.data)
        total_saves = sum(a.get("saves", 0) for a in analytics_response.data)
        total_impressions = sum(a.get("impressions", 0) for a in analytics_response.data)
        
        engagement_rates = [a.get("engagement_rate", 0) for a in analytics_response.data if a.get("engagement_rate")]
        avg_engagement_rate = sum(engagement_rates) / len(engagement_rates) if engagement_rates else 0
        
        return {
            "brand_id": brand_id,
            "total_posts": len(post_ids),
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_shares": total_shares,
            "total_saves": total_saves,
            "total_impressions": total_impressions,
            "avg_engagement_rate": round(avg_engagement_rate, 4),
        }
    
    except Exception as e:
        print(f"Error computing brand analytics summary for brand {brand_id}: {e}")
        return None
