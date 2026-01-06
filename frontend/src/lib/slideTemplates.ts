/**
 * Hardcoded Slide Templates for TikTok Content Generation
 * 
 * These are pre-built slide layouts used by the AI to generate consistent,
 * on-brand carousel content. Each template defines the structure and design
 * of slides (hook, body, CTA, etc.)
 */

import { z } from 'zod';

// ==================== TYPE DEFINITIONS ====================

export const SlideElementSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  content: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  font_size: z.number(),
  font_family: z.string(),
  font_style: z.enum(['normal', 'bold', 'italic']),
  color: z.string(),
  align: z.enum(['left', 'center', 'right']),
  // Optional TikTok styling
  stroke: z.string().optional(),
  stroke_width: z.number().optional(),
  shadow_color: z.string().optional(),
  shadow_blur: z.number().optional(),
  shadow_offset_x: z.number().optional(),
  shadow_offset_y: z.number().optional(),
  shadow_opacity: z.number().optional(),
  letter_spacing: z.number().optional(),
  line_height: z.number().optional(),
});

export const SlideBackgroundSchema = z.object({
  type: z.enum(['solid', 'gradient', 'image']),
  color: z.string().optional(),
  gradient_colors: z.array(z.string()).optional(),
  gradient_angle: z.number().optional(),
  image_url: z.string().optional(),
});

export const SlideDesignSchema = z.object({
  id: z.string(),
  name: z.string(),
  dynamic: z.boolean(), // If true, AI fills content; if false, static text
  elements: z.array(SlideElementSchema),
  background: SlideBackgroundSchema,
});

export const SlideTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['viral', 'educational', 'story', 'listicle', 'quote', 'comparison']),
  slide_count: z.number(),
  slides: z.array(SlideDesignSchema),
});

export type SlideElement = z.infer<typeof SlideElementSchema>;
export type SlideBackground = z.infer<typeof SlideBackgroundSchema>;
export type SlideDesign = z.infer<typeof SlideDesignSchema>;
export type SlideTemplate = z.infer<typeof SlideTemplateSchema>;

// ==================== SLIDE TEMPLATES ====================

export const SLIDE_TEMPLATES: Record<string, SlideTemplate> = {
  
  // ========== 1-SLIDE TEMPLATES ==========
  
  hook_only: {
    id: 'hook_only',
    name: 'Hook Only',
    description: 'Single impactful slide with just a hook statement',
    category: 'viral',
    slide_count: 1,
    slides: [
      // HOOK SLIDE
      // TODO: Paste your "Hook Slide" design here
      // Expected slide type: Hook/Statement
      {
        id: 'S1',
        name: 'Hook Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' }, // REPLACE WITH YOUR DESIGN
      },
    ],
  },

  // ========== 2-SLIDE TEMPLATES ==========

  hook_cta: {
    id: 'hook_cta',
    name: 'Hook + CTA',
    description: 'Quick hook followed by call-to-action',
    category: 'viral',
    slide_count: 2,
    slides: [
      // HOOK SLIDE
      // TODO: Paste your "Hook Slide" design here
      {
        id: 'S1',
        name: 'Hook Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' }, // REPLACE WITH YOUR DESIGN
      },
      // CTA SLIDE
      // TODO: Paste your "CTA Slide" design here
      // Expected slide type: CTA/Call-to-Action
      {
        id: 'S2',
        name: 'CTA Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' }, // REPLACE WITH YOUR DESIGN
      },
    ],
  },

  // ========== 3-SLIDE TEMPLATES ==========

  hook_body_cta: {
    id: 'hook_body_cta',
    name: 'Hook + Body + CTA',
    description: 'Classic 3-slide format: Hook → Main Content → CTA',
    category: 'viral',
    slide_count: 3,
    slides: [
      // HOOK SLIDE
      {
        id: 'S1',
        name: 'Hook Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // BODY SLIDE
      // TODO: Paste your "Body/Content Slide" design here
      // Expected slide type: Body/Main Content
      {
        id: 'S2',
        name: 'Body Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // CTA SLIDE
      {
        id: 'S3',
        name: 'CTA Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
    ],
  },

  // ========== 5-SLIDE TEMPLATES ==========

  hook_3_value_cta: {
    id: 'hook_3_value_cta',
    name: 'Hook + 3 Value Points + CTA',
    description: 'Hook, then 3 value/benefit slides, ending with CTA',
    category: 'listicle',
    slide_count: 5,
    slides: [
      // HOOK SLIDE
      {
        id: 'S1',
        name: 'Hook Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // VALUE POINT 1
      // TODO: Paste your "Value Point/List Item Slide" design here
      // Expected slide type: Value Point/List Item #1
      {
        id: 'S2',
        name: 'Value Point 1',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // VALUE POINT 2
      {
        id: 'S3',
        name: 'Value Point 2',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // VALUE POINT 3
      {
        id: 'S4',
        name: 'Value Point 3',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // CTA SLIDE
      {
        id: 'S5',
        name: 'CTA Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
    ],
  },

  educational_5_slide: {
    id: 'educational_5_slide',
    name: 'Educational 5-Slide',
    description: 'Hook → Problem → Solution → Example → CTA',
    category: 'educational',
    slide_count: 5,
    slides: [
      // HOOK SLIDE
      {
        id: 'S1',
        name: 'Hook Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // PROBLEM SLIDE
      // TODO: Paste your "Problem Slide" design here
      // Expected slide type: Problem/Pain Point
      {
        id: 'S2',
        name: 'Problem Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // SOLUTION SLIDE
      // TODO: Paste your "Solution Slide" design here
      // Expected slide type: Solution/Resolution
      {
        id: 'S3',
        name: 'Solution Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // EXAMPLE SLIDE
      // TODO: Paste your "Example/Proof Slide" design here
      // Expected slide type: Example/Case Study
      {
        id: 'S4',
        name: 'Example Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // CTA SLIDE
      {
        id: 'S5',
        name: 'CTA Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
    ],
  },

  // ========== 6-SLIDE TEMPLATES ==========

  story_arc: {
    id: 'story_arc',
    name: 'Story Arc',
    description: 'Narrative storytelling: Hook → Setup → Conflict → Resolution → Lesson → CTA',
    category: 'story',
    slide_count: 6,
    slides: [
      // HOOK SLIDE
      {
        id: 'S1',
        name: 'Hook Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // SETUP SLIDE
      // TODO: Paste your "Setup/Introduction Slide" design here
      // Expected slide type: Setup/Context
      {
        id: 'S2',
        name: 'Setup Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // CONFLICT SLIDE
      // TODO: Paste your "Conflict/Challenge Slide" design here
      // Expected slide type: Conflict/Problem
      {
        id: 'S3',
        name: 'Conflict Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // RESOLUTION SLIDE
      {
        id: 'S4',
        name: 'Resolution Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // LESSON SLIDE
      // TODO: Paste your "Lesson/Takeaway Slide" design here
      // Expected slide type: Lesson/Key Takeaway
      {
        id: 'S5',
        name: 'Lesson Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // CTA SLIDE
      {
        id: 'S6',
        name: 'CTA Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
    ],
  },

  // ========== 7-SLIDE TEMPLATES ==========

  listicle_7_slide: {
    id: 'listicle_7_slide',
    name: '7-Slide Listicle',
    description: 'Hook + 5 List Items + CTA',
    category: 'listicle',
    slide_count: 7,
    slides: [
      // HOOK SLIDE
      {
        id: 'S1',
        name: 'Hook Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // LIST ITEM 1
      {
        id: 'S2',
        name: 'List Item 1',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // LIST ITEM 2
      {
        id: 'S3',
        name: 'List Item 2',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // LIST ITEM 3
      {
        id: 'S4',
        name: 'List Item 3',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // LIST ITEM 4
      {
        id: 'S5',
        name: 'List Item 4',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // LIST ITEM 5
      {
        id: 'S6',
        name: 'List Item 5',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // CTA SLIDE
      {
        id: 'S7',
        name: 'CTA Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
    ],
  },

  quote_carousel: {
    id: 'quote_carousel',
    name: 'Quote Carousel',
    description: 'Hook + 3 Powerful Quotes + CTA',
    category: 'quote',
    slide_count: 5,
    slides: [
      // HOOK SLIDE
      {
        id: 'S1',
        name: 'Hook Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // QUOTE 1
      // TODO: Paste your "Quote Slide" design here
      // Expected slide type: Quote/Statement with large text
      {
        id: 'S2',
        name: 'Quote 1',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // QUOTE 2
      {
        id: 'S3',
        name: 'Quote 2',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // QUOTE 3
      {
        id: 'S4',
        name: 'Quote 3',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // CTA SLIDE
      {
        id: 'S5',
        name: 'CTA Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
    ],
  },

  before_after: {
    id: 'before_after',
    name: 'Before/After Transformation',
    description: 'Hook → Before State → Problem → Solution → After State → CTA',
    category: 'comparison',
    slide_count: 6,
    slides: [
      // HOOK SLIDE
      {
        id: 'S1',
        name: 'Hook Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // BEFORE SLIDE
      // TODO: Paste your "Before State Slide" design here
      // Expected slide type: Before/Starting Point
      {
        id: 'S2',
        name: 'Before Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // PROBLEM SLIDE
      {
        id: 'S3',
        name: 'Problem Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // SOLUTION SLIDE
      {
        id: 'S4',
        name: 'Solution Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // AFTER SLIDE
      // TODO: Paste your "After State Slide" design here
      // Expected slide type: After/Transformed State
      {
        id: 'S5',
        name: 'After Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // CTA SLIDE
      {
        id: 'S6',
        name: 'CTA Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
    ],
  },

  how_to_tutorial: {
    id: 'how_to_tutorial',
    name: 'How-To Tutorial',
    description: 'Hook → Step 1 → Step 2 → Step 3 → Results → CTA',
    category: 'educational',
    slide_count: 6,
    slides: [
      // HOOK SLIDE
      {
        id: 'S1',
        name: 'Hook Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // STEP 1
      // TODO: Paste your "Step/Instruction Slide" design here
      // Expected slide type: Step 1
      {
        id: 'S2',
        name: 'Step 1',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // STEP 2
      {
        id: 'S3',
        name: 'Step 2',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // STEP 3
      {
        id: 'S4',
        name: 'Step 3',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // RESULTS SLIDE
      // TODO: Paste your "Results/Outcome Slide" design here
      // Expected slide type: Results/What You'll Get
      {
        id: 'S5',
        name: 'Results Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // CTA SLIDE
      {
        id: 'S6',
        name: 'CTA Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
    ],
  },

  myth_busting: {
    id: 'myth_busting',
    name: 'Myth Busting',
    description: 'Hook → Myth 1 + Truth → Myth 2 + Truth → Myth 3 + Truth → CTA',
    category: 'educational',
    slide_count: 8,
    slides: [
      // HOOK SLIDE
      {
        id: 'S1',
        name: 'Hook Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // MYTH 1
      // TODO: Paste your "Myth Slide" design here
      // Expected slide type: Myth/False Belief
      {
        id: 'S2',
        name: 'Myth 1',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // TRUTH 1
      // TODO: Paste your "Truth Slide" design here
      // Expected slide type: Truth/Reality
      {
        id: 'S3',
        name: 'Truth 1',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // MYTH 2
      {
        id: 'S4',
        name: 'Myth 2',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // TRUTH 2
      {
        id: 'S5',
        name: 'Truth 2',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // MYTH 3
      {
        id: 'S6',
        name: 'Myth 3',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // TRUTH 3
      {
        id: 'S7',
        name: 'Truth 3',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
      // CTA SLIDE
      {
        id: 'S8',
        name: 'CTA Slide',
        dynamic: true,
        elements: [], // REPLACE WITH YOUR DESIGN
        background: { type: 'solid', color: '#000000' },
      },
    ],
  },

};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get a slide template by ID
 */
export function getSlideTemplate(templateId: string): SlideTemplate | undefined {
  return SLIDE_TEMPLATES[templateId];
}

/**
 * Get all available template IDs
 */
export function getSlideTemplateIds(): string[] {
  return Object.keys(SLIDE_TEMPLATES);
}

/**
 * Get templates by category
 */
export function getSlideTemplatesByCategory(category: SlideTemplate['category']): SlideTemplate[] {
  return Object.values(SLIDE_TEMPLATES).filter(t => t.category === category);
}

/**
 * Get templates by slide count
 */
export function getSlideTemplatesByCount(count: number): SlideTemplate[] {
  return Object.values(SLIDE_TEMPLATES).filter(t => t.slide_count === count);
}

/**
 * List all templates with basic info
 */
export function listAllTemplates(): Array<{ id: string; name: string; description: string; category: string; slide_count: number }> {
  return Object.values(SLIDE_TEMPLATES).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    slide_count: t.slide_count,
  }));
}

export default SLIDE_TEMPLATES;
