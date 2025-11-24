"""
Firestore Service - Database operations for SlideForge

This module handles all Firestore database operations including:
- User management
- Template CRUD
- Post CRUD
- Analytics tracking
- Firebase Storage integration
"""

import firebase_admin
from firebase_admin import firestore, storage
from datetime import datetime
from typing import List, Dict, Any, Optional
from models import (
    Template, 
    Post, 
    Analytics,
    CreateTemplateRequest,
    UpdateTemplateRequest,
    CreatePostRequest,
    TrackAnalyticsRequest,
    TemplatePerformance,
    PostMetrics
)
import json

# Lazy-load Firestore client and Storage bucket
_db = None
_bucket = None

def get_db():
    """Get Firestore client (lazy initialization)"""
    global _db
    if _db is None:
        _db = firestore.client()
    return _db

def get_bucket():
    """Get Storage bucket (lazy initialization)"""
    global _bucket
    if _bucket is None:
        _bucket = storage.bucket()
    return _bucket

# ==================== FIRESTORE STRUCTURE ====================
"""
users/{userId}
  ├── profile: { email, name, plan, defaultTemplateId, createdAt }
  ├── templates/{templateId}
  │     ├── id, userId, name, category, status, styleConfig, performance, createdAt, updatedAt
  │     └── posts/{postId} → Reference to posts collection
  └── stats: { totalPosts, totalTemplates, avgEngagement }

templates/{templateId} (top-level for querying)
  ├── userId, name, category, styleConfig, performance, etc.
  └── Same as user's template but denormalized for fast queries

posts/{postId}
  ├── id, userId, templateId, platform, status, content, metadata
  ├── storageUrls: { slides: [url1, url2...], thumbnail: url }
  ├── createdAt, scheduledTime, publishedTime
  └── analytics → Embedded or reference

analytics/{analyticsId}
  ├── postId, templateId, userId, platform, date
  ├── metrics: { impressions, engagement, saves, shares }
  └── variantSetId (optional)

variantSets/{variantSetId}
  ├── userId, name, templates, status, results
  └── startDate, endDate, postsPerTemplate

REASONING:
- Top-level posts collection for efficient queries across all users
- Denormalized templates for fast access without joins
- Embedded analytics in posts for quick access, separate collection for aggregation
- Firebase Storage for slide images (large files)
"""

# ==================== USER OPERATIONS ====================

async def create_user_profile(user_id: str, email: str, name: str, plan: str = "starter") -> Dict[str, Any]:
    """Create user profile in Firestore"""
    user_ref = get_db().collection('users').document(user_id)
    
    profile_data = {
        'userId': user_id,
        'email': email,
        'name': name,
        'plan': plan,
        'defaultTemplateId': None,
        'createdAt': firestore.SERVER_TIMESTAMP,
        'stats': {
            'totalPosts': 0,
            'totalTemplates': 0,
            'avgEngagement': 0.0
        }
    }
    
    user_ref.set(profile_data)
    return profile_data


async def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user profile"""
    user_ref = get_db().collection('users').document(user_id)
    doc = user_ref.get()
    
    if doc.exists:
        return doc.to_dict()
    return None


# ==================== TEMPLATE OPERATIONS ====================

async def create_template(user_id: str, template_data: CreateTemplateRequest) -> str:
    """
    Create a new template in Firestore
    Stores in both users/{userId}/templates and top-level templates collection
    """
    template_id = get_db().collection('templates').document().id
    
    template_doc = {
        'id': template_id,
        'userId': user_id,
        'name': template_data.name,
        'category': template_data.category,
        'isDefault': template_data.isDefault,
        'status': 'active',
        'styleConfig': template_data.styleConfig.dict(),
        'performance': {
            'totalPosts': 0,
            'avgEngagementRate': 0.0,
            'avgSaves': 0.0,
            'avgShares': 0.0,
            'avgImpressions': 0.0,
            'lastUpdated': None
        },
        'createdAt': firestore.SERVER_TIMESTAMP,
        'updatedAt': firestore.SERVER_TIMESTAMP
    }
    
    # Write to top-level templates collection
    get_db().collection('templates').document(template_id).set(template_doc)
    
    # Write to user's templates subcollection
    get_db().collection('users').document(user_id).collection('templates').document(template_id).set(template_doc)
    
    # If default, update user's defaultTemplateId
    if template_data.isDefault:
        await set_default_template(user_id, template_id)
    
    # Increment user's template count (create user doc if doesn't exist)
    user_ref = get_db().collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        # Create user profile if it doesn't exist
        user_ref.set({
            'userId': user_id,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'stats': {
                'totalTemplates': 1,
                'totalPosts': 0,
                'avgEngagement': 0.0
            }
        })
    else:
        # Update existing user's stats
        user_ref.update({
            'stats.totalTemplates': firestore.Increment(1)
        })
    
    return template_id


async def get_template(template_id: str) -> Optional[Dict[str, Any]]:
    """Get template by ID"""
    doc = get_db().collection('templates').document(template_id).get()
    if doc.exists:
        return doc.to_dict()
    return None


async def get_user_templates(user_id: str) -> List[Dict[str, Any]]:
    """Get all templates for a user"""
    templates_ref = get_db().collection('templates').where('userId', '==', user_id).where('status', '!=', 'archived')
    docs = templates_ref.stream()
    
    templates = []
    for doc in docs:
        template = doc.to_dict()
        # Get post count for this template
        post_count = get_db().collection('posts').where('templateId', '==', doc.id).count().get()[0][0].value
        template['postCount'] = post_count
        templates.append(template)
    
    return templates


async def update_template(template_id: str, updates: UpdateTemplateRequest) -> None:
    """Update template in both locations"""
    update_data = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}
    update_data['updatedAt'] = firestore.SERVER_TIMESTAMP
    
    # Update top-level collection
    get_db().collection('templates').document(template_id).update(update_data)
    
    # Update user's subcollection
    template = await get_template(template_id)
    if template:
        get_db().collection('users').document(template['userId']).collection('templates').document(template_id).update(update_data)


async def delete_template(template_id: str) -> None:
    """Soft delete template (set status to archived)"""
    await update_template(template_id, UpdateTemplateRequest(status='archived'))


async def set_default_template(user_id: str, template_id: str) -> None:
    """Set template as default and unset all others"""
    # Unset all other defaults
    templates_ref = get_db().collection('templates').where('userId', '==', user_id).where('isDefault', '==', True)
    for doc in templates_ref.stream():
        if doc.id != template_id:
            get_db().collection('templates').document(doc.id).update({'isDefault': False})
            get_db().collection('users').document(user_id).collection('templates').document(doc.id).update({'isDefault': False})
    
    # Set new default
    get_db().collection('templates').document(template_id).update({'isDefault': True})
    get_db().collection('users').document(user_id).collection('templates').document(template_id).update({'isDefault': True})
    get_db().collection('users').document(user_id).update({'defaultTemplateId': template_id})


async def get_template_posts(template_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Get all posts created from a specific template"""
    posts_ref = get_db().collection('posts').where('templateId', '==', template_id).order_by('createdAt', direction=firestore.Query.DESCENDING).limit(limit)
    docs = posts_ref.stream()
    
    posts = []
    for doc in docs:
        post = doc.to_dict()
        posts.append(post)
    
    return posts


# ==================== POST OPERATIONS ====================

async def create_post(user_id: str, post_data: CreatePostRequest) -> str:
    """
    Create a new post
    Stores post metadata in Firestore, slide images in Firebase Storage
    """
    post_id = get_db().collection('posts').document().id
    
    post_doc = {
        'id': post_id,
        'userId': user_id,
        'templateId': post_data.templateId,
        'variantSetId': post_data.variantSetId,
        'platform': post_data.platform,
        'status': 'draft',
        'createdAt': firestore.SERVER_TIMESTAMP,
        'scheduledTime': post_data.scheduledTime,
        'publishedTime': None,
        'content': {
            'slides': [slide.dict() for slide in post_data.content.slides],
            'caption': post_data.content.caption,
            'hashtags': post_data.content.hashtags
        },
        'storageUrls': {
            'slides': [],  # Will be populated when images are uploaded
            'thumbnail': None
        },
        'metadata': {
            'variantLabel': None,
            'generationParams': {}
        },
        'analytics': {
            'impressions': 0,
            'engagement': 0,
            'saves': 0,
            'shares': 0,
            'engagementRate': 0.0,
            'lastUpdated': None
        }
    }
    
    get_db().collection('posts').document(post_id).set(post_doc)
    
    # Increment template's post count
    get_db().collection('templates').document(post_data.templateId).update({
        'performance.totalPosts': firestore.Increment(1)
    })
    
    # Increment user's post count
    get_db().collection('users').document(user_id).update({
        'stats.totalPosts': firestore.Increment(1)
    })
    
    return post_id


async def get_post(post_id: str) -> Optional[Dict[str, Any]]:
    """Get post by ID with all details"""
    doc = get_db().collection('posts').document(post_id).get()
    if doc.exists:
        post = doc.to_dict()
        
        # Get template info
        if post.get('templateId'):
            template = await get_template(post['templateId'])
            post['template'] = template
        
        # Get analytics history (last 30 days)
        analytics = await get_post_analytics(post_id)
        post['analyticsHistory'] = analytics
        
        return post
    return None


async def get_user_posts(user_id: str, limit: int = 100, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all posts for a user"""
    query = get_db().collection('posts').where('userId', '==', user_id)
    
    if status:
        query = query.where('status', '==', status)
    
    query = query.order_by('createdAt', direction=firestore.Query.DESCENDING).limit(limit)
    docs = query.stream()
    
    posts = []
    for doc in docs:
        posts.append(doc.to_dict())
    
    return posts


async def update_post(post_id: str, updates: Dict[str, Any]) -> None:
    """Update post"""
    updates['updatedAt'] = firestore.SERVER_TIMESTAMP
    get_db().collection('posts').document(post_id).update(updates)


async def update_post_status(post_id: str, status: str, published_time: Optional[datetime] = None) -> None:
    """Update post status and optionally set published time"""
    update_data = {'status': status}
    if published_time:
        update_data['publishedTime'] = published_time
    
    await update_post(post_id, update_data)


# ==================== FIREBASE STORAGE OPERATIONS ====================

async def upload_slide_image(post_id: str, slide_number: int, image_data: bytes, content_type: str = 'image/png') -> str:
    """
    Upload slide image to Firebase Storage
    Path: posts/{postId}/slides/slide_{slideNumber}.png
    """
    blob_path = f"posts/{post_id}/slides/slide_{slide_number}.png"
    blob = get_bucket().blob(blob_path)
    
    blob.upload_from_string(image_data, content_type=content_type)
    blob.make_public()
    
    # Get public URL
    url = blob.public_url
    
    # Update post with storage URL
    post_ref = get_db().collection('posts').document(post_id)
    post_ref.update({
        f'storageUrls.slides': firestore.ArrayUnion([url])
    })
    
    return url


async def upload_thumbnail(post_id: str, image_data: bytes) -> str:
    """Upload post thumbnail"""
    blob_path = f"posts/{post_id}/thumbnail.png"
    blob = get_bucket().blob(blob_path)
    
    blob.upload_from_string(image_data, content_type='image/png')
    blob.make_public()
    
    url = blob.public_url
    
    # Update post
    get_db().collection('posts').document(post_id).update({
        'storageUrls.thumbnail': url
    })
    
    return url


async def delete_post_images(post_id: str) -> None:
    """Delete all images associated with a post"""
    blobs = get_bucket().list_blobs(prefix=f"posts/{post_id}/")
    for blob in blobs:
        blob.delete()


# ==================== ANALYTICS OPERATIONS ====================

async def track_post_analytics(analytics_data: TrackAnalyticsRequest, user_id: str) -> str:
    """
    Track analytics for a post
    Updates both the analytics collection and embedded analytics in the post
    """
    analytics_id = get_db().collection('analytics').document().id
    
    analytics_doc = {
        'id': analytics_id,
        'postId': analytics_data.postId,
        'templateId': analytics_data.templateId,
        'userId': user_id,
        'platform': analytics_data.platform,
        'date': firestore.SERVER_TIMESTAMP,
        'metrics': analytics_data.metrics.dict(),
        'variantSetId': analytics_data.variantSetId
    }
    
    # Write to analytics collection
    get_db().collection('analytics').document(analytics_id).set(analytics_doc)
    
    # Update embedded analytics in post
    get_db().collection('posts').document(analytics_data.postId).update({
        'analytics': analytics_data.metrics.dict(),
        'analytics.lastUpdated': firestore.SERVER_TIMESTAMP
    })
    
    # Update template performance (aggregate)
    await update_template_performance(analytics_data.templateId, analytics_data.metrics.dict())
    
    return analytics_id


async def update_template_performance(template_id: str, new_metrics: Dict[str, Any]) -> None:
    """Update template aggregate performance"""
    template_ref = get_db().collection('templates').document(template_id)
    template = template_ref.get().to_dict()
    
    if not template:
        return
    
    perf = template['performance']
    total_posts = perf['totalPosts']
    
    # Calculate new averages
    new_total = total_posts + 1
    
    updates = {
        'performance.avgEngagementRate': ((perf['avgEngagementRate'] * total_posts) + new_metrics['engagementRate']) / new_total,
        'performance.avgSaves': ((perf['avgSaves'] * total_posts) + new_metrics['saves']) / new_total,
        'performance.avgShares': ((perf['avgShares'] * total_posts) + new_metrics['shares']) / new_total,
        'performance.avgImpressions': ((perf['avgImpressions'] * total_posts) + new_metrics['impressions']) / new_total,
        'performance.lastUpdated': firestore.SERVER_TIMESTAMP
    }
    
    template_ref.update(updates)
    
    # Also update in user's subcollection
    get_db().collection('users').document(template['userId']).collection('templates').document(template_id).update(updates)


async def get_post_analytics(post_id: str, days: int = 30) -> List[Dict[str, Any]]:
    """Get analytics history for a post"""
    query = get_db().collection('analytics').where('postId', '==', post_id).order_by('date', direction=firestore.Query.DESCENDING).limit(days)
    docs = query.stream()
    
    analytics = []
    for doc in docs:
        analytics.append(doc.to_dict())
    
    return analytics


async def get_template_analytics(template_id: str, days: int = 30) -> List[Dict[str, Any]]:
    """Get all analytics for posts from a template"""
    query = get_db().collection('analytics').where('templateId', '==', template_id).order_by('date', direction=firestore.Query.DESCENDING).limit(days * 10)
    docs = query.stream()
    
    analytics = []
    for doc in docs:
        analytics.append(doc.to_dict())
    
    return analytics


# ==================== VARIANT SET OPERATIONS ====================

async def create_variant_set(user_id: str, name: str, templates: List[str], posts_per_template: int, duration_days: int) -> str:
    """Create A/B testing variant set"""
    variant_set_id = get_db().collection('variantSets').document().id
    
    from datetime import timedelta
    start_date = datetime.now()
    end_date = start_date + timedelta(days=duration_days)
    
    variant_set_doc = {
        'id': variant_set_id,
        'userId': user_id,
        'name': name,
        'templates': templates,
        'postsPerTemplate': posts_per_template,
        'startDate': start_date,
        'endDate': end_date,
        'status': 'running',
        'results': None
    }
    
    get_db().collection('variantSets').document(variant_set_id).set(variant_set_doc)
    return variant_set_id


async def get_variant_set(variant_set_id: str) -> Optional[Dict[str, Any]]:
    """Get variant set by ID"""
    doc = get_db().collection('variantSets').document(variant_set_id).get()
    if doc.exists:
        return doc.to_dict()
    return None


async def analyze_variant_set(variant_set_id: str) -> Dict[str, Any]:
    """Analyze variant set and determine winner"""
    variant_set = await get_variant_set(variant_set_id)
    if not variant_set:
        raise ValueError("Variant set not found")
    
    # Get analytics for all posts in this variant set
    analytics_query = get_db().collection('analytics').where('variantSetId', '==', variant_set_id)
    analytics_docs = analytics_query.stream()
    
    # Group by template
    template_stats = {}
    for doc in analytics_docs:
        data = doc.to_dict()
        template_id = data['templateId']
        
        if template_id not in template_stats:
            template_stats[template_id] = []
        template_stats[template_id].append(data['metrics'])
    
    # Calculate averages
    results = {}
    best_template = None
    best_score = 0
    
    for template_id, metrics_list in template_stats.items():
        avg_saves = sum(m['saves'] for m in metrics_list) / len(metrics_list)
        avg_engagement = sum(m['engagement'] for m in metrics_list) / len(metrics_list)
        
        results[template_id] = {
            'avgSaves': avg_saves,
            'avgEngagement': avg_engagement,
            'totalPosts': len(metrics_list)
        }
        
        if avg_saves > best_score:
            best_score = avg_saves
            best_template = template_id
    
    # Update variant set with results
    get_db().collection('variantSets').document(variant_set_id).update({
        'status': 'completed',
        'results': {
            'winningTemplateId': best_template,
            'stats': results,
            'completedAt': firestore.SERVER_TIMESTAMP
        }
    })
    
    return results
