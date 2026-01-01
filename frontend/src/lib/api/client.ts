import axios, { AxiosError } from 'axios';
import { getAccessToken, requireUserId } from '@/lib/supabase/auth';

// Import all Supabase CRUD operations
import { TemplateRepository } from '../supabase/repos/TemplateRepository';
import { PostRepository } from '../supabase/repos/PostRepository';
import { StorageRepository } from '../supabase/repos/StorageRepository';
import { AnalyticsRepository } from '../supabase/repos/AnalyticsRepository';
import type { Database } from '@/types/database';

// API Base URL - used only for backend-specific operations (scheduling, external integrations)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance for backend operations only
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add Supabase auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - handled by AuthProvider
      console.error('Unauthorized - token may be expired');
    }
    return Promise.reject(error);
  }
);

// ============================================
// API FUNCTIONS FOR TANSTACK QUERY
// ============================================

// ----- CONTENT / POSTS -----

export const contentApi = {
  // GET: Fetch all scheduled posts
  getScheduledPosts: async () => {
    const userId = await requireUserId();
    return await PostRepository.getScheduledPosts(userId);
  },


  generatePosts: async (template: Database['public']['Tables']['templates']['Row'], brandSettings: Database['public']['Tables']['brand_settings']['Row'], count: number = 1) => {
    const { data } = await apiClient.post('/api/generate/post', {
      template,
      brandSettings,
      count
    });
    return data;
  },

  // POST: Generate week's content (uses backend AI)
  generateWeek: async (styleGuide: string) => {
    const { data } = await apiClient.post('/api/content/generate', {
      styleGuide,
    });
    return data;
  },

  // DELETE: Remove a post
  deletePost: async (postId: string) => {
    const userId = await requireUserId();
    return await PostRepository.deletePost(postId, userId);
  },

  // PUT: Update a post
  updatePost: async ({ postId, updates }: { postId: string; updates: any }) => {
    const userId = await requireUserId();
    return await PostRepository.updatePost(postId, updates, userId);
  },
};

// ----- ANALYTICS -----

export const analyticsApi = {
  // GET: Fetch analytics data
  getAnalytics: async (timeframe: 'day' | 'week' | 'month' = 'week') => {
    return await AnalyticsRepository.getAllUserAnalytics();
  },

  // GET: Fetch variant performance (A/B tests)
  getVariantPerformance: async () => {
    // TODO: Implement A/B testing in Supabase
    return [];
  },

  // POST: Trigger AI analysis (uses backend AI)
  analyzeAndEvolve: async () => {
    const { data } = await apiClient.post('/api/analytics/analyze');
    return data;
  },
};

// ----- TEMPLATES -----

export const templateApi = {
  // GET: Fetch all templates
  getTemplates: async () => {
    const userId = await requireUserId();
    return await TemplateRepository.getTemplates(userId);
  },

  // GET: Fetch single template with details
  getTemplate: async (templateId: string) => {
    const userId = await requireUserId();
    return await TemplateRepository.getTemplate(templateId, userId);
  },

  // POST: Create new template
  /**
   * Create new template (expects snake_case keys only!)
   * If you pass camelCase keys (e.g., isDefault, styleConfig), the backend will reject them.
   * Always map UI state to snake_case before calling this function.
   */
  createTemplate: async (templateData: any) => {
    // DEV WARNING: Check for camelCase keys in dev mode
    if (process.env.NODE_ENV !== 'production') {
      const camelCaseKeys = Object.keys(templateData).filter(k => /[A-Z]/.test(k));
      if (camelCaseKeys.length > 0) {
        // eslint-disable-next-line no-console
        console.warn('[templateApi.createTemplate] Payload contains camelCase keys:', camelCaseKeys);
      }
    }
    console.log('API: Creating template with data:', templateData);
    try {
      const templateId = await TemplateRepository.createTemplate(templateData);
      console.log('API: Template created:', templateId);
      return templateId;
    } catch (error: any) {
      console.error('API: Failed to create template:', error.message);
      throw error;
    }
  },

  // PUT: Update template
  updateTemplate: async ({ templateId, updates }: { templateId: string; updates: any }) => {
    const userId = await requireUserId();
    return await TemplateRepository.updateTemplate(templateId, updates, userId);
  },

  // DELETE: Archive template
  deleteTemplate: async (templateId: string) => {
    const userId = await requireUserId();
    return await TemplateRepository.deleteTemplate(templateId, userId);
  },

  // PUT: Set template as default
  setDefaultTemplate: async (templateId: string) => {
    const userId = await requireUserId();
    return await TemplateRepository.setDefaultTemplate(templateId, userId);
  },
};

// ----- POSTS -----

export const postApi = {
  // GET: Fetch all posts
  getPosts: async (status?: string, limit?: number) => {
    const userId = await requireUserId();
    if (status) {
      return await PostRepository.getPostsByStatus(userId, status as any);
    }
    return await PostRepository.getPosts(userId);
  },

  // GET: Fetch single post with details
  getPost: async (postId: string) => {
    const userId = await requireUserId();
    return await PostRepository.getPost(postId, userId);
  },

  // POST: Create new post
  createPost: async (postData: any) => {
    return await PostRepository.createPost(postData);
  },

  // PUT: Update post
  updatePost: async ({ postId, updates }: { postId: string; updates: any }) => {
    const userId = await requireUserId();
    return await PostRepository.updatePost(postId, updates, userId);
  },

  // POST: Publish post (uses backend for Ayrshare integration)
  publishPost: async (postId: string) => {
    const userId = await requireUserId();
    // First update status in Supabase
    await PostRepository.updatePostStatus(postId, 'published', userId);
    // Then trigger backend publishing to social platforms
    const { data } = await apiClient.post(`/api/posts/${postId}/publish`);
    return data;
  },

  // POST: Upload slide image
  uploadSlide: async ({ postId, slideNumber, file }: { postId: string; slideNumber: number; file: File }) => {
    return await StorageRepository.uploadSlideImage(postId, slideNumber, file);
  },

  // POST: Track analytics
  trackAnalytics: async ({ postId, analyticsData }: { postId: string; analyticsData: any }) => {
    return await AnalyticsRepository.updatePostAnalytics(postId, analyticsData);
  },
};

// ----- STYLE GUIDE -----
// TODO: Move to Supabase profiles table or separate style_guides table

export const styleGuideApi = {
  // GET: Fetch style guide (still using backend temporarily)
  getStyleGuide: async () => {
    const { data } = await apiClient.get('/api/style-guide');
    return data;
  },

  // PUT: Update style guide (still using backend temporarily)
  updateStyleGuide: async (content: string) => {
    const { data } = await apiClient.put('/api/style-guide', { content });
    return data;
  },
};

// ----- USER / PROFILE -----
// TODO: Already migrated to Supabase - consider removing backend API

export const userApi = {
  // GET: Fetch user profile (still using backend temporarily)
  getProfile: async () => {
    const { data } = await apiClient.get('/api/user/profile');
    return data;
  },

  // PUT: Update user profile (still using backend temporarily)
  updateProfile: async (updates: any) => {
    const { data } = await apiClient.put('/api/user/profile', updates);
    return data;
  },

  // GET: Fetch connected accounts (still using backend temporarily)
  getConnectedAccounts: async () => {
    const { data } = await apiClient.get('/api/user/accounts');
    return data;
  },
};

// ----- SUBSCRIPTION / BILLING -----
// Backend-only: Stripe integration

export const billingApi = {
  // GET: Fetch subscription info
  getSubscription: async () => {
    const { data } = await apiClient.get('/api/billing/subscription');
    return data;
  },

  // POST: Create checkout session (Stripe)
  createCheckoutSession: async (priceId: string) => {
    const { data } = await apiClient.post('/api/billing/checkout', { priceId });
    return data;
  },
};

export default apiClient;
