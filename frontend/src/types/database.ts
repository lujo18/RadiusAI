/**
 * Database Types - Single Source of Truth
 * 
 * All types derived from Supabase generated types.
 * Regenerate supabase.ts when schema changes:
 *   npx supabase gen types typescript --linked > src/types/supabase.ts
 */

import type { Database } from './supabase';

// =============================================================================
// CORE TYPE HELPERS
// =============================================================================

/** All table names */
export type TableName = keyof Database['public']['Tables'];

/** Get Row type for a table */
export type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];

/** Get Insert type for a table */
export type Insert<T extends TableName> = Database['public']['Tables'][T]['Insert'];

/** Get Update type for a table */
export type Update<T extends TableName> = Database['public']['Tables'][T]['Update'];

/** JSON type from Supabase */
export type Json = Database['public']['Tables']['posts']['Row']['content'];

// =============================================================================
// DATABASE ROW TYPES (snake_case - direct from Supabase)
// =============================================================================

// These are the raw types returned by Supabase queries
export type DbUser = Row<'users'>;
export type DbProfile = Row<'profiles'>;
export type DbBrandSettings = Row<'brand_settings'>;
export type DbPlatformIntegration = Row<'platform_integrations'>;

export type DbTemplate = Row<'templates'>;
export type DbLayoutConfig = Row<'layout_configs'>;
export type DbContentRules = Row<'content_rules'>;
export type DbSlideDesign = Row<'slide_designs'>;
export type DbTextElement = Row<'text_elements'>;
export type DbTemplatePerformance = Row<'template_performance'>;

export type DbPost = Row<'posts'>;
export type DbPostSlide = Row<'post_slides'>;
export type DbPostSlideTextElement = Row<'post_slide_text_elements'>;
export type DbPostMetadata = Row<'post_metadata'>;
export type DbStorageUrls = Row<'storage_urls'>;
export type DbPostAnalytics = Row<'post_analytics'>;

export type DbVariantSet = Row<'variant_sets'>;
export type DbVariantSetTemplate = Row<'variant_set_templates'>;
export type DbVariantSetStats = Row<'variant_set_stats'>;

export type DbTestimonial = Row<'testimonials'>;

// =============================================================================
// APPLICATION TYPES (camelCase - for frontend use)
// These provide a friendlier interface while still being Supabase-backed
// =============================================================================

/** User type - use snake_case fields directly from Supabase */
export type User = DbUser;

/** Profile - direct from Supabase */  
export type Profile = DbProfile;

/** Brand Settings - direct from DB or legacy interface */
export interface BrandSettings {
  // From DB (snake_case)
  id?: string;
  profile_id?: string;
  name: string;
  niche: string;
  aesthetic: string;
  target_audience: string;
  brand_voice: string;
  content_pillars: string[];
  tone_of_voice: ToneOfVoice;
  emoji_usage: EmojiUsage;
  forbidden_words: string[];
  preferred_words: string[];
  hashtag_style: HashtagStyle;
  hashtag_count: number;
  hashtags?: string[] | null;
  created_at?: string;
  updated_at?: string;
  
  // Legacy camelCase aliases (optional, for gradual migration)
  targetAudience?: string;
  brandVoice?: string;
  contentPillars?: string[];
  toneOfVoice?: ToneOfVoice;
  emojiUsage?: EmojiUsage;
  forbiddenWords?: string[];
  preferredWords?: string[];
  hashtagStyle?: HashtagStyle;
  hashtagCount?: number;
}

/** Platform Integration */
export type PlatformIntegration = DbPlatformIntegration;

/** User Profile - extends DB type with legacy camelCase aliases */
export interface UserProfile extends DbProfile {
  // Legacy camelCase aliases for backward compatibility
  userId?: string;
  brandSettings?: BrandSettings;
  templateCount?: number;
  postCount?: number;
  createdAt?: Date;
  profileId?: string; // alias for id
  integrations?: PlatformIntegration[];
}

// Template types - use DB types directly
export type Template = DbTemplate;
export type LayoutConfig = DbLayoutConfig;
export type ContentRules = DbContentRules;
export type SlideDesign = DbSlideDesign;
export type TextElement = DbTextElement;
export type TemplatePerformance = DbTemplatePerformance;

// Post types - use DB types directly
export type Post = DbPost;
export type PostSlide = DbPostSlide;
export type PostSlideTextElement = DbPostSlideTextElement;
export type PostMetadata = DbPostMetadata;
export type StorageUrls = DbStorageUrls;
export type PostAnalytics = DbPostAnalytics;

// Variant types - use DB types directly
export type VariantSet = DbVariantSet;
export type VariantSetTemplate = DbVariantSetTemplate;
export type VariantSetStats = DbVariantSetStats;

export type Testimonial = DbTestimonial;

// =============================================================================
// INSERT TYPES (Create new records)
// =============================================================================

export type UserInsert = Insert<'users'>;
export type ProfileInsert = Insert<'profiles'>;
export type BrandSettingsInsert = Insert<'brand_settings'>;
export type PlatformIntegrationInsert = Insert<'platform_integrations'>;

export type TemplateInsert = Insert<'templates'>;
export type LayoutConfigInsert = Insert<'layout_configs'>;
export type ContentRulesInsert = Insert<'content_rules'>;
export type SlideDesignInsert = Insert<'slide_designs'>;
export type TextElementInsert = Insert<'text_elements'>;

export type PostInsert = Insert<'posts'>;
export type PostSlideInsert = Insert<'post_slides'>;
export type PostSlideTextElementInsert = Insert<'post_slide_text_elements'>;
export type PostMetadataInsert = Insert<'post_metadata'>;
export type StorageUrlsInsert = Insert<'storage_urls'>;
export type PostAnalyticsInsert = Insert<'post_analytics'>;

export type VariantSetInsert = Insert<'variant_sets'>;
export type VariantSetTemplateInsert = Insert<'variant_set_templates'>;
export type VariantSetStatsInsert = Insert<'variant_set_stats'>;

// =============================================================================
// UPDATE TYPES (Partial updates)
// =============================================================================

export type UserUpdate = Update<'users'>;
export type ProfileUpdate = Update<'profiles'>;
export type BrandSettingsUpdate = Update<'brand_settings'>;
export type PlatformIntegrationUpdate = Update<'platform_integrations'>;

export type TemplateUpdate = Update<'templates'>;
export type LayoutConfigUpdate = Update<'layout_configs'>;
export type ContentRulesUpdate = Update<'content_rules'>;
export type SlideDesignUpdate = Update<'slide_designs'>;
export type TextElementUpdate = Update<'text_elements'>;

export type PostUpdate = Update<'posts'>;
export type PostSlideUpdate = Update<'post_slides'>;
export type PostMetadataUpdate = Update<'post_metadata'>;
export type StorageUrlsUpdate = Update<'storage_urls'>;
export type PostAnalyticsUpdate = Update<'post_analytics'>;

export type VariantSetUpdate = Update<'variant_sets'>;
export type VariantSetStatsUpdate = Update<'variant_set_stats'>;

// =============================================================================
// RELATIONS / JOINED TYPES
// =============================================================================

/** User with all profiles */
export type UserWithProfiles = User & {
  profiles: Profile[];
};

/** Profile with brand settings and integrations */
export type ProfileWithDetails = Profile & {
  brand_settings: BrandSettings | null;
  platform_integrations: PlatformIntegration[];
};

/** Template with all related config */
export type TemplateWithConfig = Template & {
  layout_configs: LayoutConfig | null;
  content_rules: ContentRules | null;
  slide_designs: SlideDesignWithElements[];
  template_performance: TemplatePerformance | null;
};

/** Slide design with text elements */
export type SlideDesignWithElements = SlideDesign & {
  text_elements: TextElement[];
};

/** Post with all related data */
export type PostWithDetails = Post & {
  templates: Template | null;
  post_slides: PostSlideWithElements[];
  post_metadata: PostMetadata | null;
  storage_urls: StorageUrls | null;
  post_analytics: PostAnalytics | null;
};

/** Post slide with text elements */
export type PostSlideWithElements = PostSlide & {
  post_slide_text_elements: PostSlideTextElement[];
};

/** Variant set with templates and stats */
export type VariantSetWithDetails = VariantSet & {
  variant_set_templates: (VariantSetTemplate & {
    templates: Template;
  })[];
  variant_set_stats: VariantSetStats[];
};

// =============================================================================
// ENUMS / LITERAL TYPES
// =============================================================================

/** Template categories */
export type TemplateCategory = 
  | 'listicle' 
  | 'quote' 
  | 'story' 
  | 'educational' 
  | 'comparison'
  | 'custom';

/** Template status */
export type TemplateStatus = 'active' | 'archived' | 'testing';

/** Post status */
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

/** Platform */
export type Platform = 'instagram' | 'tiktok';

/** Subscription plans */
export type SubscriptionPlan = 'starter' | 'growth' | 'unlimited';

/** Subscription status */
export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'past_due' 
  | 'unpaid' 
  | 'paused' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'trialing';

/** Aspect ratios */
export type AspectRatio = '1:1' | '4:5' | '3:4' | '9:16';

/** Background types */
export type BackgroundType = 'solid' | 'gradient' | 'image';

/** Font styles */
export type FontStyle = 'normal' | 'bold' | 'italic';

/** Text alignment */
export type TextAlign = 'left' | 'center' | 'right';

/** Depth level */
export type DepthLevel = 'surface' | 'detailed' | 'comprehensive';

/** Hook styles */
export type HookStyle = 'question' | 'statement' | 'number';

/** Tone of voice */
export type ToneOfVoice = 'casual' | 'professional' | 'humorous' | 'edgy' | 'inspirational';

/** Emoji usage */
export type EmojiUsage = 'none' | 'minimal' | 'moderate' | 'heavy';

/** Hashtag style */
export type HashtagStyle = 'niche' | 'trending' | 'mixed';

/** Variant set status */
export type VariantSetStatus = 'running' | 'completed' | 'cancelled';

/** Slide structure types */
export type SlideStructureType = 
  | 'hook' 
  | 'intro' 
  | 'value' 
  | 'point' 
  | 'quote' 
  | 'setup' 
  | 'conflict' 
  | 'resolution' 
  | 'lesson' 
  | 'problem' 
  | 'solution' 
  | 'example' 
  | 'before' 
  | 'after' 
  | 'cta';

// =============================================================================
// CONSTANTS
// =============================================================================

export const ASPECT_RATIOS = {
  '1:1': { width: 1080, height: 1080, label: 'Square (1:1)' },
  '4:5': { width: 1080, height: 1350, label: 'Portrait (4:5)' },
  '3:4': { width: 1080, height: 1440, label: 'Tall Portrait (3:4)' },
  '9:16': { width: 1080, height: 1920, label: 'Stories (9:16)' },
} as const;

export const TEMPLATE_CATEGORIES = {
  listicle: {
    name: 'Listicle',
    structure: ['hook', 'intro', 'point', 'point', 'point', 'point', 'cta'] as SlideStructureType[],
    hookStyles: ['number', 'question'] as HookStyle[],
    bestFor: 'How-to guides, tips, recommendations',
    icon: 'FiList'
  },
  quote: {
    name: 'Bold Quotes',
    structure: ['hook', 'quote', 'quote', 'quote', 'cta'] as SlideStructureType[],
    hookStyles: ['statement'] as HookStyle[],
    bestFor: 'Motivation, inspiration',
    icon: 'FiMessageSquare'
  },
  story: {
    name: 'Story Arc',
    structure: ['hook', 'setup', 'conflict', 'resolution', 'lesson', 'cta'] as SlideStructureType[],
    hookStyles: ['question', 'statement'] as HookStyle[],
    bestFor: 'Personal experiences, case studies',
    icon: 'FiBook'
  },
  educational: {
    name: 'Educational',
    structure: ['hook', 'problem', 'solution', 'example', 'example', 'cta'] as SlideStructureType[],
    hookStyles: ['question'] as HookStyle[],
    bestFor: 'Tutorials, explainers',
    icon: 'FiAward'
  },
  comparison: {
    name: 'Before/After',
    structure: ['hook', 'before', 'problem', 'solution', 'after', 'cta'] as SlideStructureType[],
    hookStyles: ['statement'] as HookStyle[],
    bestFor: 'Transformations, results',
    icon: 'FiRefreshCw'
  },
  custom: {
    name: 'Custom',
    structure: ['hook', 'value', 'value', 'value', 'cta'] as SlideStructureType[],
    hookStyles: ['question', 'statement', 'number'] as HookStyle[],
    bestFor: 'Your own format',
    icon: 'FiEdit'
  }
} as const;

// =============================================================================
// UTILITY TYPES FOR API RESPONSES
// =============================================================================

/** Dashboard stats aggregation */
export interface DashboardStats {
  postsScheduled: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topPerformer: string;
}

/** Variant performance comparison */
export interface VariantPerformance {
  variantId: string;
  name: string;
  postsCount: number;
  avgSaves: number;
  avgShares: number;
  avgEngagementRate: number;
}

// =============================================================================
// LEGACY TYPES (for backward compatibility during migration)
// These types match the old camelCase interfaces used in existing code
// =============================================================================

/** Background config for slides */
export interface BackgroundConfig {
  type: BackgroundType;
  color?: string;
  gradientColors?: [string, string];
  gradientAngle?: number;
  imageUrl?: string;
}

/** Legacy StyleConfig for templates (stored as JSONB) */
export interface StyleConfig {
  layout: {
    slideCount: number;
    aspectRatio: AspectRatio;
    structure?: SlideStructureType[];
  };
  contentRules?: LegacyContentRules;
  slideDesigns: LegacySlideDesign[];
  slideSequence: { slideNumber: number; designId: string }[];
}

/** Legacy Content Rules interface */
export interface LegacyContentRules {
  format: string;
  slideCount: number;
  perspective: string;
  depthLevel: DepthLevel;
  topicFocus: string;
  subtopics?: string[];
  hookStyle: string;
  bodyStyle: string;
  ctaStyle: string;
  includeExamples: boolean;
  includeStatistics: boolean;
  personalStory: boolean;
  avoidTopics?: string[];
  mustInclude?: string[];
}

/** Legacy Text Element type */
export interface LegacyTextElement {
  id: string;
  type: 'text';
  content: string;
  role?: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: FontStyle;
  color: string;
  x: number;
  y: number;
  width: number;
  align: TextAlign;
}

/** Legacy Slide Design interface */
export interface LegacySlideDesign {
  id: string;
  name: string;
  background: BackgroundConfig;
  elements: LegacyTextElement[];
  dynamic?: boolean;
}

/** Legacy Post Content (stored as JSONB in posts table) */
export interface PostContent {
  slides: LegacyPostSlide[];
  layout: {
    slideCount: number;
    aspectRatio: AspectRatio;
    structure?: SlideStructureType[];
  };
  caption: string;
  hashtags: string[];
}

/** Legacy Post Slide */
export interface LegacyPostSlide extends Omit<LegacySlideDesign, 'name'> {
  slideNumber: number;
  designId: string;
  imagePrompt?: string;
}

/** Create Post Request */
export interface CreatePostRequest {
  templateId: string;
  platform: Platform;
  content: PostContent;
  scheduledTime?: Date;
  variantSetId?: string;
}

/** Create Template Input */
export interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  style_config: StyleConfig | Json;
  is_default?: boolean;
}

/** Update Template Input */
export interface UpdateTemplateInput {
  name?: string;
  category?: TemplateCategory;
  status?: TemplateStatus;
  style_config?: StyleConfig | Json;
  is_default?: boolean;
}

/** Update Post Request */
export interface UpdatePostRequest {
  status?: PostStatus;
  scheduledTime?: Date;
  content?: PostContent;
}

/** Post with template info */
export interface PostWithTemplate extends Post {
  template?: {
    id: string;
    name: string;
    category: string;
  };
  analyticsHistory?: PostAnalytics[];
}

/** Category Info for TEMPLATE_CATEGORIES */
export interface CategoryInfo {
  name: string;
  structure: SlideStructureType[];
  hookStyles: HookStyle[];
  bestFor: string;
  icon: string;
}

// =============================================================================
// OLD STYLE CONFIG (for template editor default configs)
// Different from the normalized StyleConfig - includes visual/content sections
// =============================================================================

export interface OldStyleConfig {
  layout: {
    slideCount: number;
    aspectRatio: AspectRatio;
    structure?: SlideStructureType[];
  };
  visual: {
    background: {
      type: BackgroundType;
      colors: string[];
      opacity: number;
    };
    font: {
      family: string;
      size: number;
      color: string;
      effects: string[];
    };
    accentColor: string;
  };
  content: {
    tone: string;
    hookStyle: string;
    useEmojis: boolean;
    ctaTemplate: string;
    forbiddenWords: string[];
  };
}

/** Default style configurations for each template category */
export const DEFAULT_STYLE_CONFIGS: Record<TemplateCategory, OldStyleConfig> = {
  listicle: {
    layout: {
      slideCount: 7,
      aspectRatio: '9:16',
      structure: ['hook', 'intro', 'point', 'point', 'point', 'point', 'cta']
    },
    visual: {
      background: {
        type: 'gradient',
        colors: ['#0f0f0f', '#1a1a1a'],
        opacity: 0.9
      },
      font: {
        family: 'Inter Bold',
        size: 48,
        color: '#ffffff',
        effects: ['drop-shadow']
      },
      accentColor: '#ff4f8b'
    },
    content: {
      tone: 'direct',
      hookStyle: 'number',
      useEmojis: true,
      ctaTemplate: 'Save this for later!',
      forbiddenWords: ['journey', 'game-changer', 'unlock']
    }
  },
  quote: {
    layout: {
      slideCount: 5,
      aspectRatio: '1:1',
      structure: ['hook', 'quote', 'quote', 'quote', 'cta']
    },
    visual: {
      background: {
        type: 'solid',
        colors: ['#000000'],
        opacity: 1.0
      },
      font: {
        family: 'Montserrat Bold',
        size: 56,
        color: '#ffffff',
        effects: ['outline']
      },
      accentColor: '#ffd700'
    },
    content: {
      tone: 'professional',
      hookStyle: 'statement',
      useEmojis: false,
      ctaTemplate: 'Follow for daily inspiration',
      forbiddenWords: ['basically', 'literally']
    }
  },
  story: {
    layout: {
      slideCount: 6,
      aspectRatio: '9:16',
      structure: ['hook', 'setup', 'conflict', 'resolution', 'lesson', 'cta']
    },
    visual: {
      background: {
        type: 'gradient',
        colors: ['#1a1a2e', '#16213e'],
        opacity: 0.95
      },
      font: {
        family: 'Georgia',
        size: 42,
        color: '#f0f0f0',
        effects: []
      },
      accentColor: '#0abde3'
    },
    content: {
      tone: 'casual',
      hookStyle: 'question',
      useEmojis: true,
      ctaTemplate: 'Share if this resonates',
      forbiddenWords: ['journey', 'dive deep']
    }
  },
  educational: {
    layout: {
      slideCount: 6,
      aspectRatio: '4:5',
      structure: ['hook', 'problem', 'solution', 'example', 'example', 'cta']
    },
    visual: {
      background: {
        type: 'gradient',
        colors: ['#f8f9fa', '#e9ecef'],
        opacity: 1.0
      },
      font: {
        family: 'Inter Bold',
        size: 44,
        color: '#212529',
        effects: []
      },
      accentColor: '#5f27cd'
    },
    content: {
      tone: 'professional',
      hookStyle: 'question',
      useEmojis: false,
      ctaTemplate: 'Follow for more tips',
      forbiddenWords: ['hack', 'secret']
    }
  },
  comparison: {
    layout: {
      slideCount: 6,
      aspectRatio: '9:16',
      structure: ['hook', 'before', 'problem', 'solution', 'after', 'cta']
    },
    visual: {
      background: {
        type: 'gradient',
        colors: ['#ee5a6f', '#f29263'],
        opacity: 0.85
      },
      font: {
        family: 'Poppins Bold',
        size: 50,
        color: '#ffffff',
        effects: ['drop-shadow']
      },
      accentColor: '#00d2d3'
    },
    content: {
      tone: 'direct',
      hookStyle: 'statement',
      useEmojis: true,
      ctaTemplate: 'Want results like this? Follow!',
      forbiddenWords: ['miracle', 'overnight']
    }
  },
  custom: {
    layout: {
      slideCount: 5,
      aspectRatio: '9:16',
      structure: ['hook', 'value', 'value', 'value', 'cta']
    },
    visual: {
      background: {
        type: 'gradient',
        colors: ['#0f0f0f', '#1a1a1a'],
        opacity: 0.9
      },
      font: {
        family: 'Inter',
        size: 48,
        color: '#ffffff',
        effects: []
      },
      accentColor: '#ff4f8b'
    },
    content: {
      tone: 'casual',
      hookStyle: 'question',
      useEmojis: true,
      ctaTemplate: 'Follow for more',
      forbiddenWords: []
    }
  }
};
