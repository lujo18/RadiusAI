#!/usr/bin/env python3
"""Quick test to verify BrandSettings and Template model parsing"""

import json
from models.user import BrandSettings
from models.template import Template

# Test 1: BrandSettings with missing fields (like from Supabase)
print("=" * 60)
print("TEST 1: BrandSettings with partial data (from database)")
print("=" * 60)

brand_settings_json = {
    'id': 'brand-123',
    'brand_id': 'brand-456',
    'name': 'Tech Blog',
    'niche': 'Technology',
    # Missing: aesthetic, target_audience, brand_voice, content_pillars
    # But BrandSettings should accept this now with optional fields
}

try:
    brand_settings = BrandSettings(**brand_settings_json)
    print(f"✅ BrandSettings parsed successfully!")
    print(f"   ID: {brand_settings.id}")
    print(f"   Brand ID: {brand_settings.brand_id}")
    print(f"   Name: {brand_settings.name}")
    print(f"   Niche: {brand_settings.niche}")
    print(f"   Aesthetic: {brand_settings.aesthetic}")  # Should be ""
    print(f"   Tone: {brand_settings.tone_of_voice}")  # Should be "casual"
except Exception as e:
    print(f"❌ BrandSettings parsing failed: {e}")

# Test 2: Template with minimal required fields
print("\n" + "=" * 60)
print("TEST 2: Template with minimal data")
print("=" * 60)

template_json = {
    'id': 'template-123',
    'name': 'My Template',
    'user_id': 'user-456',
    'category': 'listicle',
    'status': 'active',
}

try:
    template = Template(**template_json)
    print(f"✅ Template parsed successfully!")
    print(f"   ID: {template.id}")
    print(f"   Name: {template.name}")
    print(f"   User ID: {template.user_id}")
    print(f"   Category: {template.category}")
    print(f"   Content Rules: {template.content_rules}")  # Should be None
    print(f"   Brand ID: {template.brand_id}")  # Should be None
except Exception as e:
    print(f"❌ Template parsing failed: {e}")

# Test 3: Full BrandSettings from database
print("\n" + "=" * 60)
print("TEST 3: BrandSettings with all fields")
print("=" * 60)

full_brand_settings = {
    'id': 'bs-789',
    'brand_id': 'brand-789',
    'name': 'Tech Community',
    'niche': 'Tech & AI',
    'aesthetic': 'Modern, Minimalist',
    'target_audience': 'Software Developers',
    'brand_voice': 'Expert, Helpful',
    'content_pillars': ['tutorials', 'tips', 'trends'],
    'tone_of_voice': 'professional',
    'emoji_usage': 'minimal',
    'forbidden_words': ['obvious', 'basic'],
    'preferred_words': ['innovative', 'elegant'],
    'hashtag_style': 'niche',
    'hashtag_count': 15,
    'hashtags': ['#python', '#javascript', '#webdev'],
    'created_at': '2026-02-01T10:00:00Z',
    'updated_at': '2026-02-02T15:30:00Z',
}

try:
    brand_settings = BrandSettings(**full_brand_settings)
    print(f"✅ Full BrandSettings parsed successfully!")
    print(f"   Name: {brand_settings.name}")
    print(f"   Tone: {brand_settings.tone_of_voice}")
    print(f"   Hashtag Count: {brand_settings.hashtag_count}")
    print(f"   Created: {brand_settings.created_at}")
except Exception as e:
    print(f"❌ Full BrandSettings parsing failed: {e}")

print("\n" + "=" * 60)
print("All tests completed!")
print("=" * 60)
