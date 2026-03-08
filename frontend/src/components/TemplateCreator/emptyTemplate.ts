/**
 * EMPTY_CONTENT_RULES
 *
 * Default "blank slate" for all content_rules fields found in system templates.
 * Used when creating a custom template from scratch so the DynamicJSONForm
 * renders all fields with editable (empty) inputs instead of a blank page.
 */
export const EMPTY_CONTENT_RULES = {
  goal: "",
  platform_optimized: ["Instagram", "TikTok"],
  slide_count: 5,
  avg_performance: {
    estimated_engagement_lift: "",
    swipe_through_rate: "",
    save_rate: "",
    benchmark: "",
  },
  hook_style: "",
  text_density: "",
  structure: {
    slide_1: "",
    slide_2: "",
    slide_3: "",
    slide_4: "",
    slide_5: "",
  },
  key_success_factors: [""],
  brand_integration_notes: {
    aesthetic_requirement: "",
    tone_compatibility: "",
    emoji_usage: "",
    suggested_brand_addition: "",
  },
};
