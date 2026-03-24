#!/usr/bin/env python3
"""Test script for template generation improvements"""

import json
import sys
# Add backend to path
sys.path.insert(0, 'backend')

from backend.services.integrations.groq.util.GenerateTemplate import generate_template

def test_listicle_with_specific_structure():
    """Test the example from the user"""
    user_input = """Listicle slideshow with the hook: "I used to lack confidence. These 5 (realistic) habits allowed me to fix that". The following slides should be listed habits [Number]. [1 sentance habit]. Then end with CTA, no other content."""

    print("=" * 80)
    print("Testing Template Generation")
    print("=" * 80)
    print(f"Input: {user_input}\n")

    try:
        result = generate_template(user_input)
        print("\nGenerated Template:")
        print(json.dumps(result, indent=2))

        print("\n" + "=" * 80)
        print("Analysis:")
        print("=" * 80)

        # Check the hook
        hook_slide = result["content_blueprint"]["slides"][0]
        print(f"\n1. Hook Slide:")
        print(f"   - Stage: {hook_slide['stage']}")
        print(f"   - Output Mode: {hook_slide['output_mode']}")
        print(f"   - Format Spec: {hook_slide['format_spec'][:100]}...")

        # Check if hook preserves pattern
        if "[trait]" in hook_slide['format_spec'].lower() or "I used to lack" in hook_slide['format_spec']:
            print("   ✓ Hook pattern preserved!")
        else:
            print("   ✗ Hook pattern NOT preserved")

        # Check the item slides
        print(f"\n2. Item Slides:")
        item_slides = [s for s in result["content_blueprint"]["slides"] if s["stage"].startswith("ITEM_")]

        for i, slide in enumerate(item_slides[:3], 1):  # Show first 3
            print(f"\n   Item {i}:")
            print(f"   - Stage: {slide['stage']}")
            print(f"   - Output Mode: {slide['output_mode']}")
            print(f"   - Format Spec: {slide['format_spec']}")

        # Check if items follow simple structure
        simple_structure = all(
            "[Number]" in s['format_spec'] and
            not any(word in s['format_spec'] for word in ["Foundation:", "Quick win:", "Deep dive:"])
            for s in item_slides
        )

        if simple_structure:
            print("\n   ✓ Items follow simple user-requested structure!")
        else:
            print("\n   ✗ Items use generic patterns instead of user request")

        # Check CTA
        cta_slide = result["content_blueprint"]["slides"][-1]
        print(f"\n3. CTA Slide:")
        print(f"   - Stage: {cta_slide['stage']}")
        print(f"   - Output Mode: {cta_slide['output_mode']}")
        print(f"   - Format Spec: {cta_slide['format_spec'][:100]}...")

        print("\n" + "=" * 80)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_listicle_with_specific_structure()
