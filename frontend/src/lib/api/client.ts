import axios, { AxiosError } from 'axios';
import { getIdToken } from '@/lib/firebase/auth';

// API Base URL - will use serverless endpoint in production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
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
    const { data } = await apiClient.get('/api/content/scheduled');
    return data;
  },

  // POST: Generate week's content
  generateWeek: async (styleGuide: string) => {
    const { data } = await apiClient.post('/api/content/generate', {
      styleGuide,
    });
    return data;
  },

  // DELETE: Remove a post
  deletePost: async (postId: string) => {
    const { data } = await apiClient.delete(`/api/content/${postId}`);
    return data;
  },

  // PUT: Update a post
  updatePost: async ({ postId, updates }: { postId: string; updates: any }) => {
    const { data } = await apiClient.put(`/api/content/${postId}`, updates);
    return data;
  },
};

// ----- ANALYTICS -----

export const analyticsApi = {
  // GET: Fetch analytics data
  getAnalytics: async (timeframe: 'day' | 'week' | 'month' = 'week') => {
    const { data } = await apiClient.get(`/api/analytics?timeframe=${timeframe}`);
    return data;
  },

  // GET: Fetch variant performance
  getVariantPerformance: async () => {
    const { data } = await apiClient.get('/api/analytics/variants');
    return data;
  },

  // POST: Trigger AI analysis
  analyzeAndEvolve: async () => {
    const { data } = await apiClient.post('/api/analytics/analyze');
    return data;
  },
};

// ----- TEMPLATES -----

export const templateApi = {
  // GET: Fetch all templates
  getTemplates: async () => {
    const { data } = await apiClient.get('/api/templates');
    return data;
  },

  // GET: Fetch single template with details
  getTemplate: async (templateId: string) => {
    const { data } = await apiClient.get(`/api/templates/${templateId}`);
    return data;
  },

  // POST: Create new template
  createTemplate: async (templateData: any) => {
    console.log('API: Creating template with data:', templateData);
    try {
      const { data } = await apiClient.post('/api/templates', templateData);
      console.log('API: Template created:', data);
      return data;
    } catch (error: any) {
      console.error('API: Failed to create template:', error.response?.data || error.message);
      throw error;
    }
  },

  // PUT: Update template
  updateTemplate: async ({ templateId, updates }: { templateId: string; updates: any }) => {
    const { data } = await apiClient.put(`/api/templates/${templateId}`, updates);
    return data;
  },

  // DELETE: Archive template
  deleteTemplate: async (templateId: string) => {
    const { data } = await apiClient.delete(`/api/templates/${templateId}`);
    return data;
  },

  // POST: Set as default
  setDefaultTemplate: async (templateId: string) => {
    const { data } = await apiClient.post(`/api/templates/${templateId}/set-default`);
    return data;
  },
};

// ----- POSTS -----

export const postApi = {
  // GET: Fetch all posts
  getPosts: async (status?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    const { data } = await apiClient.get(`/api/posts?${params.toString()}`);
    return data;
  },

  // GET: Fetch single post with details
  getPost: async (postId: string) => {
    const { data } = await apiClient.get(`/api/posts/${postId}`);
    return data;
  },

  // POST: Create new post
  createPost: async (postData: any) => {
    const { data } = await apiClient.post('/api/posts', postData);
    return data;
  },

  // PUT: Update post
  updatePost: async ({ postId, updates }: { postId: string; updates: any }) => {
    const { data } = await apiClient.put(`/api/posts/${postId}`, updates);
    return data;
  },

  // POST: Publish post
  publishPost: async (postId: string) => {
    const { data } = await apiClient.post(`/api/posts/${postId}/publish`);
    return data;
  },

  // POST: Upload slide image
  uploadSlide: async ({ postId, slideNumber, file }: { postId: string; slideNumber: number; file: File }) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post(`/api/posts/${postId}/upload-slide?slide_number=${slideNumber}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // POST: Track analytics
  trackAnalytics: async ({ postId, analyticsData }: { postId: string; analyticsData: any }) => {
    const { data } = await apiClient.post(`/api/posts/${postId}/analytics`, analyticsData);
    return data;
  },
};

// ----- STYLE GUIDE -----

export const styleGuideApi = {
  // GET: Fetch style guide
  getStyleGuide: async () => {
    const { data } = await apiClient.get('/api/style-guide');
    return data;
  },

  // PUT: Update style guide
  updateStyleGuide: async (content: string) => {
    const { data } = await apiClient.put('/api/style-guide', { content });
    return data;
  },
};

// ----- USER / PROFILE -----

export const userApi = {
  // GET: Fetch user profile
  getProfile: async () => {
    const { data } = await apiClient.get('/api/user/profile');
    return data;
  },

  // PUT: Update user profile
  updateProfile: async (updates: any) => {
    const { data } = await apiClient.put('/api/user/profile', updates);
    return data;
  },

  // GET: Fetch connected accounts
  getConnectedAccounts: async () => {
    const { data } = await apiClient.get('/api/user/accounts');
    return data;
  },
};

// ----- SUBSCRIPTION / BILLING -----

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
