"""
Example Usage of AI Package

This file demonstrates how to use the Gemini service for content generation.
"""

from ai import generate_content_with_gemini, generate_week_content, validate_gemini_response
from models import Template, StyleConfig, LayoutConfig, VisualConfig, ContentRules, BackgroundConfig, FontConfig
from datetime import datetime

# ==================== EXAMPLE 1: Generate Single Post ====================

def example_single_post():
    """Generate a single carousel post from a template"""
    
    # Create a test template
    template = Template(
        id="test_123",
        userId="user_123",
        name="Bold Questions Template",
        category="listicle",
        isDefault=True,
        status="active",
        createdAt=datetime.now(),
        updatedAt=datetime.now(),
        styleConfig=StyleConfig(
            layout=LayoutConfig(
                slideCount=7,
                aspectRatio="9:16",
                structure=["hook", "intro", "point", "point", "point", "point", "cta"]
            ),
            visual=VisualConfig(
                background=BackgroundConfig(
                    type="gradient",
                    colors=["#0f0f0f", "#1a1a1a"],
                    opacity=0.9
                ),
                font=FontConfig(
                    family="Inter Bold",
                    size=48,
                    color="#ffffff",
                    effects=["drop-shadow"]
                ),
                accentColor="#ff4f8b"
            ),
            content=ContentRules(
                tone="direct",
                hookStyle="question",
                useEmojis=True,
                ctaTemplate="Save this for later!",
                forbiddenWords=["journey", "game-changer", "unlock"]
            )
        )
    )
    
    # Generate content
    topic = "10 productivity tips for remote workers"
    carousels = generate_content_with_gemini(template, topic, count=1)
    
    # Display result
    print("=" * 60)
    print("GENERATED CAROUSEL")
    print("=" * 60)
    for slide in carousels[0].slides:
        print(f"\nSlide {slide.slideNumber}:")
        print(f"  Text: {slide.text}")
        print(f"  Image: {slide.imagePrompt}")
    
    print(f"\nCaption: {carousels[0].caption}")
    print(f"Hashtags: {', '.join(carousels[0].hashtags)}")
    
    # Validate
    is_valid, violations = validate_gemini_response(carousels[0], template)
    if is_valid:
        print("\n✅ Response is valid!")
    else:
        print("\n❌ Violations found:")
        for v in violations:
            print(f"  - {v}")
    
    return carousels[0]


# ==================== EXAMPLE 2: Generate Week's Content ====================

def example_week_content():
    """Generate a full week of content (7 days × 2 platforms)"""
    
    # Use template from example 1
    template = Template(
        id="test_123",
        userId="user_123",
        name="Bold Questions Template",
        category="listicle",
        isDefault=True,
        status="active",
        createdAt=datetime.now(),
        updatedAt=datetime.now(),
        styleConfig=StyleConfig(
            layout=LayoutConfig(slideCount=7, aspectRatio="9:16", structure=["hook", "intro", "point", "point", "point", "point", "cta"]),
            visual=VisualConfig(
                background=BackgroundConfig(type="gradient", colors=["#0f0f0f", "#1a1a1a"], opacity=0.9),
                font=FontConfig(family="Inter Bold", size=48, color="#ffffff", effects=[]),
                accentColor="#ff4f8b"
            ),
            content=ContentRules(tone="direct", hookStyle="question", useEmojis=True, ctaTemplate="Save!", forbiddenWords=[])
        )
    )
    
    # Topics for the week
    topics = [
        "5 morning habits that changed my life",
        "The truth about productivity hacks",
        "Why you're procrastinating (and how to stop)",
        "3 books that will shift your mindset",
        "How I doubled my income in 6 months",
        "The biggest mistake new entrepreneurs make",
        "Simple trick to wake up at 5 AM"
    ]
    
    # Generate
    week_content = generate_week_content(template, topics)
    
    print("\n" + "=" * 60)
    print("WEEK'S CONTENT GENERATED")
    print("=" * 60)
    for platform, posts in week_content.items():
        print(f"\n{platform.upper()}: {len(posts)} posts")
        for i, post in enumerate(posts, 1):
            print(f"  Day {i}: {post.caption[:50]}...")
    
    return week_content


# ==================== EXAMPLE 3: A/B Testing Content ====================

def example_ab_testing():
    """Generate content for A/B testing across multiple templates"""
    
    from ai import generate_variant_set_content
    
    # Template A: Question hooks
    template_a = Template(
        id="template_a",
        userId="user_123",
        name="Question Hooks",
        category="listicle",
        isDefault=False,
        status="testing",
        createdAt=datetime.now(),
        updatedAt=datetime.now(),
        styleConfig=StyleConfig(
            layout=LayoutConfig(slideCount=7, aspectRatio="9:16", structure=["hook", "intro", "point", "point", "point", "point", "cta"]),
            visual=VisualConfig(
                background=BackgroundConfig(type="gradient", colors=["#0f0f0f", "#1a1a1a"], opacity=0.9),
                font=FontConfig(family="Inter Bold", size=48, color="#ffffff", effects=[]),
                accentColor="#ff4f8b"
            ),
            content=ContentRules(tone="direct", hookStyle="question", useEmojis=True, ctaTemplate="Save!", forbiddenWords=[])
        )
    )
    
    # Template B: Statement hooks
    template_b = Template(
        id="template_b",
        userId="user_123",
        name="Statement Hooks",
        category="listicle",
        isDefault=False,
        status="testing",
        createdAt=datetime.now(),
        updatedAt=datetime.now(),
        styleConfig=StyleConfig(
            layout=LayoutConfig(slideCount=7, aspectRatio="9:16", structure=["hook", "intro", "point", "point", "point", "point", "cta"]),
            visual=VisualConfig(
                background=BackgroundConfig(type="gradient", colors=["#0f0f0f", "#1a1a1a"], opacity=0.9),
                font=FontConfig(family="Inter Bold", size=48, color="#ffffff", effects=[]),
                accentColor="#ff4f8b"
            ),
            content=ContentRules(tone="direct", hookStyle="statement", useEmojis=True, ctaTemplate="Save!", forbiddenWords=[])
        )
    )
    
    # Topics
    topics = [
        "Productivity tips",
        "Morning routine",
        "Time management",
        "Focus strategies"
    ]
    
    # Generate variant set
    variant_posts = generate_variant_set_content(
        templates=[template_a, template_b],
        topics=topics,
        posts_per_template=4
    )
    
    print("\n" + "=" * 60)
    print("A/B TEST CONTENT GENERATED")
    print("=" * 60)
    for template_id, posts in variant_posts.items():
        print(f"\n{template_id}: {len(posts)} posts")
        for i, post in enumerate(posts, 1):
            print(f"  Post {i}: {post.slides[0].text[:50]}...")
    
    return variant_posts


# ==================== RUN EXAMPLES ====================

if __name__ == "__main__":
    print("SlideForge AI Service - Usage Examples\n")
    
    # Example 1
    print("\n🎯 EXAMPLE 1: Generate Single Post")
    print("-" * 60)
    example_single_post()
    
    # Example 2
    print("\n\n📅 EXAMPLE 2: Generate Week's Content")
    print("-" * 60)
    example_week_content()
    
    # Example 3
    print("\n\n🧪 EXAMPLE 3: A/B Testing Content")
    print("-" * 60)
    example_ab_testing()
    
    print("\n\n✅ All examples completed successfully!")
