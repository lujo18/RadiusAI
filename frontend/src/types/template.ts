// Template System Types

export type TemplateCategory = 
  | 'listicle' 
  | 'quote' 
  | 'story' 
  | 'educational' 
  | 'comparison'
  | 'custom';

export type TemplateStatus = 'active' | 'archived' | 'testing';

export type HookStyle = 'question' | 'statement' | 'number';

export type BackgroundType = 'gradient' | 'solid' | 'image';

export type AspectRatio = '9:16' | '1:1' | '4:5';

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

export interface BackgroundConfig {
  type: BackgroundType;
  colors: string[];
  opacity: number;
}

export interface FontConfig {
  family: string;
  size: number;
  color: string;
  effects: string[];
}

export interface VisualConfig {
  background: BackgroundConfig;
  font: FontConfig;
  accentColor: string;
}

export interface LayoutConfig {
  slideCount: number;
  aspectRatio: AspectRatio;
  structure: SlideStructureType[];
}

export interface ContentRules {
  tone: string;
  hookStyle: HookStyle;
  useEmojis: boolean;
  ctaTemplate: string;
  forbiddenWords: string[];
}

export interface StyleConfig {
  layout: LayoutConfig;
  visual: VisualConfig;
  content: ContentRules;
}

export interface TemplatePerformance {
  totalPosts: number;
  avgEngagementRate: number;
  avgSaves: number;
  avgShares: number;
  avgImpressions: number;
  lastUpdated: Date | null;
}

export interface Template {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  category: TemplateCategory;
  status: TemplateStatus;
  createdAt: Date;
  updatedAt: Date;
  styleConfig: StyleConfig;
  geminiPrompt?: string;
  performance: TemplatePerformance;
  parentTemplateId?: string; // For cloned templates
}

export interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  styleConfig: StyleConfig;
  isDefault?: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  category?: TemplateCategory;
  status?: TemplateStatus;
  styleConfig?: Partial<StyleConfig>;
  isDefault?: boolean;
}

// A/B Testing Types

export interface VariantSet {
  id: string;
  userId: string;
  name: string;
  templates: string[]; // Template IDs
  startDate: Date;
  endDate: Date;
  status: 'running' | 'completed' | 'cancelled';
  postsPerTemplate: number;
  results?: VariantSetResults;
}

export interface VariantSetResults {
  winningTemplateId: string;
  confidenceScore: number;
  stats: Record<string, TemplateStats>;
  insights: string[];
  completedAt: Date;
}

export interface TemplateStats {
  avgSaves: number;
  avgEngagement: number;
  avgImpressions: number;
  avgEngagementRate: number;
  totalPosts: number;
}

export interface CreateVariantSetInput {
  name: string;
  templates: string[];
  postsPerTemplate: number;
  durationDays: number;
}

// Template Categories Info
export interface CategoryInfo {
  name: string;
  structure: SlideStructureType[];
  hookStyles: HookStyle[];
  bestFor: string;
  icon: string;
}

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, CategoryInfo> = {
  listicle: {
    name: 'Listicle',
    structure: ['hook', 'intro', 'point', 'point', 'point', 'point', 'cta'],
    hookStyles: ['number', 'question'],
    bestFor: 'How-to guides, tips, recommendations',
    icon: 'FiList'
  },
  quote: {
    name: 'Bold Quotes',
    structure: ['hook', 'quote', 'quote', 'quote', 'cta'],
    hookStyles: ['statement'],
    bestFor: 'Motivation, inspiration',
    icon: 'FiMessageSquare'
  },
  story: {
    name: 'Story Arc',
    structure: ['hook', 'setup', 'conflict', 'resolution', 'lesson', 'cta'],
    hookStyles: ['question', 'statement'],
    bestFor: 'Personal experiences, case studies',
    icon: 'FiBook'
  },
  educational: {
    name: 'Educational',
    structure: ['hook', 'problem', 'solution', 'example', 'example', 'cta'],
    hookStyles: ['question'],
    bestFor: 'Tutorials, explainers',
    icon: 'FiAward'
  },
  comparison: {
    name: 'Before/After',
    structure: ['hook', 'before', 'problem', 'solution', 'after', 'cta'],
    hookStyles: ['statement'],
    bestFor: 'Transformations, results',
    icon: 'FiTrendingUp'
  },
  custom: {
    name: 'Custom',
    structure: ['hook', 'value', 'value', 'value', 'cta'],
    hookStyles: ['question', 'statement', 'number'],
    bestFor: 'Fully customizable template',
    icon: 'FiSettings'
  }
};

// Default template configs
export const DEFAULT_STYLE_CONFIGS: Record<TemplateCategory, StyleConfig> = {
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
