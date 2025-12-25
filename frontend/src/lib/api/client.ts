import axios, { AxiosError } from 'axios';
import { getAccessToken, requireUserId } from '@/lib/supabase/auth';

// Import all Supabase CRUD operations
import {
  // Templates
  createTemplate as createTemplateSupabase,
  getTemplate as getTemplateSupabase,
  getUserTemplates,
  updateTemplate as updateTemplateSupabase,
  deleteTemplate as deleteTemplateSupabase,
  // Posts
  createPost as createPostSupabase,
  getPost as getPostSupabase,
  getUserPosts,
  getPostsByStatus,
  getScheduledPosts as getScheduledPostsSupabase,
  updatePost as updatePostSupabase,
  deletePost as deletePostSupabase,
  updatePostStatus,
  getPostsByTemplate,
  // Storage
  uploadSlideImage,
  uploadSlideImages,
  deleteSlideImages,
  uploadThumbnail,
  getSlideImageUrl,
  // Analytics
  getPostAnalytics,
  updatePostAnalytics,
  createPostAnalytics,
  getAllUserAnalytics,
  getTemplateAggregateAnalytics,
} from '../supabase/db/index';
import { BrandSettings } from '@/types/user';
import { Template } from '@/types/template';

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
    return await getScheduledPostsSupabase();
  },


  generatePosts: async (template: Template, brandSettings: BrandSettings, count: number = 1) => {

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
    return await deletePostSupabase(postId);
  },

  // PUT: Update a post
  updatePost: async ({ postId, updates }: { postId: string; updates: any }) => {
    return await updatePostSupabase(postId, updates);
  },
};

// ----- ANALYTICS -----

export const analyticsApi = {
  // GET: Fetch analytics data
  getAnalytics: async (timeframe: 'day' | 'week' | 'month' = 'week') => {
    return await getAllUserAnalytics();
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
    return await getUserTemplates();
  },

  // GET: Fetch single template with details
  getTemplate: async (templateId: string) => {
    return await getTemplateSupabase(templateId);
  },

  // POST: Create new template
  createTemplate: async (templateData: any) => {
    console.log('API: Creating template with data:', templateData);
    
    try {
      const templateId = await createTemplateSupabase(templateData);
      console.log('API: Template created:', templateId);
      return templateId;
    } catch (error: any) {
      console.error('API: Failed to create template:', error.message);
      throw error;
    }
  },

  // PUT: Update template
  updateTemplate: async ({ templateId, updates }: { templateId: string; updates: any }) => {
    return await updateTemplateSupabase(templateId, updates);
  },

  // DELETE: Archive template
  deleteTemplate: async (templateId: string) => {
    return await deleteTemplateSupabase(templateId);
  },
};

// ----- POSTS -----

export const postApi = {
  // GET: Fetch all posts
  getPosts: async (status?: string, limit?: number) => {
    if (status) {
      return await getPostsByStatus(status as any);
    }
    return await getUserPosts();
  },

  // GET: Fetch single post with details
  getPost: async (postId: string) => {
    return await getPostSupabase(postId);
  },

  // POST: Create new post
  createPost: async (postData: any) => {
    return await createPostSupabase(postData);
  },

  // PUT: Update post
  updatePost: async ({ postId, updates }: { postId: string; updates: any }) => {
    return await updatePostSupabase(postId, updates);
  },

  // POST: Publish post (uses backend for Ayrshare integration)
  publishPost: async (postId: string) => {
    // First update status in Supabase
    await updatePostStatus(postId, 'published');
    // Then trigger backend publishing to social platforms
    const { data } = await apiClient.post(`/api/posts/${postId}/publish`);
    return data;
  },

  // POST: Upload slide image
  uploadSlide: async ({ postId, slideNumber, file }: { postId: string; slideNumber: number; file: File }) => {
    return await uploadSlideImage(postId, slideNumber, file);
  },

  // POST: Track analytics
  trackAnalytics: async ({ postId, analyticsData }: { postId: string; analyticsData: any }) => {
    return await updatePostAnalytics(postId, analyticsData);
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
