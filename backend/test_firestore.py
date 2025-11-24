# Quick Test Script for Firestore Implementation
# This demonstrates how to use the Firestore service

import asyncio
from datetime import datetime
from pathlib import Path
import sys

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from services.firestore_service import (
    create_template,
    get_template,
    get_user_templates,
    create_post,
    get_post,
    track_post_analytics,
    upload_slide_image,
)
from models import (
    CreateTemplateRequest,
    CreatePostRequest,
    TrackAnalyticsRequest,
    StyleConfig,
    LayoutConfig,
    VisualConfig,
    ContentRules,
    BackgroundConfig,
    FontConfig,
    PostContent,
    Slide,
    PostMetrics,
)

async def test_firestore():
    """Test Firestore operations"""
    
    print("🔥 Testing Firestore Integration\n")
    
    # Test user ID (replace with real Firebase Auth UID)
    user_id = "test_user_123"
    
    # ==================== TEST 1: Create Template ====================
    print("1️⃣ Creating template...")
    
    template_data = CreateTemplateRequest(
        name="Test Motivational Template",
        category="quote",
        isDefault=True,
        styleConfig=StyleConfig(
            layout=LayoutConfig(
                slideCount=5,
                aspectRatio="9:16",
                structure=["hook", "quote", "context", "application", "cta"]
            ),
            visual=VisualConfig(
                background=BackgroundConfig(
                    type="gradient",
                    colors=["#667eea", "#764ba2"],
                    opacity=1.0
                ),
                font=FontConfig(
                    family="Inter",
                    size=48,
                    color="#FFFFFF",
                    effects=["bold", "shadow"]
                ),
                accentColor="#FFD700"
            ),
            content=ContentRules(
                tone="inspirational",
                hookStyle="question",
                useEmojis=True,
                ctaTemplate="Follow for more!",
                forbiddenWords=[]
            )
        )
    )
    
    try:
        template_id = await create_template(user_id, template_data)
        print(f"✅ Template created: {template_id}\n")
    except Exception as e:
        print(f"❌ Error creating template: {e}\n")
        return
    
    # ==================== TEST 2: Get Template ====================
    print("2️⃣ Fetching template...")
    
    try:
        template = await get_template(template_id)
        print(f"✅ Template fetched: {template['name']}")
        print(f"   Category: {template['category']}")
        print(f"   Total Posts: {template['performance']['totalPosts']}\n")
    except Exception as e:
        print(f"❌ Error fetching template: {e}\n")
    
    # ==================== TEST 3: Create Post ====================
    print("3️⃣ Creating post...")
    
    post_data = CreatePostRequest(
        templateId=template_id,
        platform="instagram",
        content=PostContent(
            slides=[
                Slide(
                    slideNumber=1,
                    text="Why do we fall?",
                    imagePrompt="Person standing on mountain peak at sunrise"
                ),
                Slide(
                    slideNumber=2,
                    text="\"Success is not final, failure is not fatal\"",
                    imagePrompt="Golden quote on gradient background"
                ),
                Slide(
                    slideNumber=3,
                    text="Every setback is a setup for a comeback",
                    imagePrompt="Phoenix rising from ashes"
                ),
                Slide(
                    slideNumber=4,
                    text="Apply this: Start small, stay consistent",
                    imagePrompt="Person taking first step on journey"
                ),
                Slide(
                    slideNumber=5,
                    text="Follow @slideforge for daily motivation",
                    imagePrompt="Call to action with inspiring background"
                ),
            ],
            caption="🔥 Reminder: You're stronger than you think! 💪\n\nEvery challenge is an opportunity to grow. Don't give up!",
            hashtags=["motivation", "inspiration", "growth", "mindset", "success"]
        ),
        scheduledTime=None
    )
    
    try:
        post_id = await create_post(user_id, post_data)
        print(f"✅ Post created: {post_id}\n")
    except Exception as e:
        print(f"❌ Error creating post: {e}\n")
        return
    
    # ==================== TEST 4: Get Post ====================
    print("4️⃣ Fetching post...")
    
    try:
        post = await get_post(post_id)
        print(f"✅ Post fetched")
        print(f"   Status: {post['status']}")
        print(f"   Platform: {post['platform']}")
        print(f"   Slides: {len(post['content']['slides'])}")
        print(f"   Caption: {post['content']['caption'][:50]}...")
        print(f"   Hashtags: {', '.join(post['content']['hashtags'])}\n")
    except Exception as e:
        print(f"❌ Error fetching post: {e}\n")
    
    # ==================== TEST 5: Track Analytics ====================
    print("5️⃣ Tracking analytics...")
    
    analytics_data = TrackAnalyticsRequest(
        postId=post_id,
        templateId=template_id,
        platform="instagram",
        metrics=PostMetrics(
            impressions=2500,
            reach=2000,
            engagement=420,
            saves=85,
            shares=23,
            comments=45,
            profileVisits=67,
            engagementRate=16.8,
            clickThroughRate=2.68
        )
    )
    
    try:
        analytics_id = await track_post_analytics(analytics_data, user_id)
        print(f"✅ Analytics tracked: {analytics_id}")
        print(f"   Impressions: {analytics_data.metrics.impressions}")
        print(f"   Engagement Rate: {analytics_data.metrics.engagementRate}%\n")
    except Exception as e:
        print(f"❌ Error tracking analytics: {e}\n")
    
    # ==================== TEST 6: Get Updated Template ====================
    print("6️⃣ Checking template performance after analytics...")
    
    try:
        template = await get_template(template_id)
        print(f"✅ Template performance updated:")
        print(f"   Total Posts: {template['performance']['totalPosts']}")
        print(f"   Avg Engagement: {template['performance']['avgEngagementRate']:.2f}%")
        print(f"   Avg Saves: {template['performance']['avgSaves']:.0f}")
        print(f"   Avg Impressions: {template['performance']['avgImpressions']:.0f}\n")
    except Exception as e:
        print(f"❌ Error fetching updated template: {e}\n")
    
    # ==================== TEST 7: List User Templates ====================
    print("7️⃣ Listing all user templates...")
    
    try:
        templates = await get_user_templates(user_id)
        print(f"✅ Found {len(templates)} template(s):")
        for t in templates:
            print(f"   - {t['name']} ({t['category']}) - {t.get('postCount', 0)} posts")
        print()
    except Exception as e:
        print(f"❌ Error listing templates: {e}\n")
    
    print("✨ All tests completed!")
    print("\n📝 Next steps:")
    print("   1. Check Firestore Console to see the data")
    print("   2. Test the API routes with curl/Postman")
    print("   3. Test the frontend detail pages")
    print("   4. Upload slide images with upload_slide_image()")

if __name__ == "__main__":
    print("⚠️  Make sure Firebase is initialized in main.py first!")
    print("⚠️  You need a valid serviceAccountKey.json file\n")
    
    # Uncomment to run tests
    # asyncio.run(test_firestore())
    
    print("To run tests, uncomment the last line in this file and run:")
    print("python backend/test_firestore.py")
