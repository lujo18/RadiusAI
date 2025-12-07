import axios, { AxiosError } from 'axios';
import { getIdToken, requireUid } from '@/lib/firebase/auth';

// Import all Firestore CRUD operations
import {
  // Templates
  createTemplate as createTemplateFirestore,
  getTemplate as getTemplateFirestore,
  getUserTemplates,
  updateTemplate as updateTemplateFirestore,
  deleteTemplate as deleteTemplateFirestore,
  setTemplateAsDefault,
  cloneTemplate,
  // Posts
  createPost as createPostFirestore,
  getPost as getPostFirestore,
  getUserPosts,
  getPostsByStatus,
  getScheduledPosts as getScheduledPostsFirestore,
  getRecentPosts,
  updatePost as updatePostFirestore,
  deletePost as deletePostFirestore,
  publishPost as publishPostFirestore,
  markPostFailed,
  getPostsByTemplate,
  // Storage
  uploadSlideImage,
  uploadSlideImages,
  deleteSlideImage,
  deleteTemplateSlideImages,
  uploadProfileImage,
  uploadBrandLogo,
  deleteImage,
  getTemplateSlideImages,
  // Analytics
  getPostAnalytics,
  updatePostAnalytics,
  createPostAnalytics,
  getUserAnalytics,
  getTopPerformingPosts,
  createABTest,
  getABTest,
  getUserABTests,
  updateABTestMetrics,
  endABTest,
  getTemplateAnalytics,
} from '../firebase/firestore/index';
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

// Request interceptor - add Firebase auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getIdToken();
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
    const userId = requireUid();
    return await getScheduledPostsFirestore(userId);
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
    return await deletePostFirestore(postId);
  },

  // PUT: Update a post
  updatePost: async ({ postId, updates }: { postId: string; updates: any }) => {
    return await updatePostFirestore(postId, updates);
  },
};

// ----- ANALYTICS -----

export const analyticsApi = {
  // GET: Fetch analytics data
  getAnalytics: async (timeframe: 'day' | 'week' | 'month' = 'week') => {
    const userId = requireUid();
    return await getUserAnalytics(userId);
  },

  // GET: Fetch variant performance (A/B tests)
  getVariantPerformance: async () => {
    const userId = requireUid();
    return await getUserABTests(userId);
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
    const userId = requireUid();
    return await getUserTemplates(userId);
  },

  // GET: Fetch single template with details
  getTemplate: async (templateId: string) => {
    return await getTemplateFirestore(templateId);
  },

  // POST: Create new template
  createTemplate: async (templateData: any) => {
    console.log('API: Creating template with data:', templateData);
    
    try {
      const templateId = await createTemplateFirestore(templateData);
      console.log('API: Template created:', templateId);
      return templateId;
    } catch (error: any) {
      console.error('API: Failed to create template:', error.message);
      throw error;
    }
  },

  // PUT: Update template
  updateTemplate: async ({ templateId, updates }: { templateId: string; updates: any }) => {
    return await updateTemplateFirestore(templateId, updates);
  },

  // DELETE: Archive template
  deleteTemplate: async (templateId: string) => {
    return await deleteTemplateFirestore(templateId);
  },

  // POST: Set as default
  setDefaultTemplate: async (templateId: string) => {
    const userId = requireUid();
    return await setTemplateAsDefault(userId, templateId);
  },
};

// ----- POSTS -----

export const postApi = {
  // GET: Fetch all posts
  getPosts: async (status?: string, limit?: number) => {
    const userId = requireUid();
    if (status) {
      return await getPostsByStatus(userId, status as any);
    }
    if (limit) {
      return await getRecentPosts(userId, limit);
    }
    return await getUserPosts(userId);
  },

  // GET: Fetch single post with details
  getPost: async (postId: string) => {
    return await getPostFirestore(postId);
  },

  // POST: Create new post
  createPost: async (postData: any) => {
    return await createPostFirestore(postData);
  },

  // PUT: Update post
  updatePost: async ({ postId, updates }: { postId: string; updates: any }) => {
    return await updatePostFirestore(postId, updates);
  },

  // POST: Publish post (uses backend for Ayrshare integration)
  publishPost: async (postId: string) => {
    // First update status in Firestore
    await publishPostFirestore(postId);
    // Then trigger backend publishing to social platforms
    const { data } = await apiClient.post(`/api/posts/${postId}/publish`);
    return data;
  },

  // POST: Upload slide image
  uploadSlide: async ({ postId, slideNumber, file }: { postId: string; slideNumber: number; file: File }) => {
    return await uploadSlideImage(file, postId, slideNumber);
  },

  // POST: Track analytics
  trackAnalytics: async ({ postId, analyticsData }: { postId: string; analyticsData: any }) => {
    return await updatePostAnalytics(postId, analyticsData);
  },
};

// ----- STYLE GUIDE -----
// TODO: Migrate to Firestore users/{userId}/styleGuide document

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
// TODO: Migrate to Firestore users/{userId} document

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
