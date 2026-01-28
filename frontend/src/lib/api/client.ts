import axios, { AxiosError } from 'axios';
import { supabase } from '@/lib/supabase/client';

// Import all Supabase CRUD operations
import { TemplateRepository } from '../supabase/repos/TemplateRepository';
import { PostRepository } from '../supabase/repos/PostRepository';
import { StorageRepository } from '../supabase/repos/StorageRepository';
import { AnalyticsRepository } from '../supabase/repos/AnalyticsRepository';
import { SystemTemplatesRepository } from '../supabase/repos/SystemTemplatesRepository';
import { TestimonialsRepository } from '../supabase/repos/TestimonialsRepository';
import type { Database } from '@/types/database';
import { UserRepository } from '../supabase/repos/UserRepository';
import { Post } from '@/types/types';
import { requireUserId } from '@/lib/supabase/auth';

// API Base URL - used only for backend-specific operations (scheduling, external integrations)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance for backend operations only
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add Supabase auth token with auto-refresh
apiClient.interceptors.request.use(
  async (config) => {
    // Get fresh session (Supabase auto-refreshes if needed)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 with retry after refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Force refresh the session
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !session) {
          // Refresh failed - redirect to login
          console.error('Session refresh failed - redirecting to login');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Update the Authorization header with new token
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        
        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// API FUNCTIONS FOR TANSTACK QUERY
// ============================================

// ----- CONTENT / POSTS -----

export const contentApi = {
  // GET: Fetch all posts for a user with optional filters
  getPosts: async (filters?: { status?: string; brandId?: string; templateId?: string; limit?: number }) => {
    const userId = await requireUserId();
    return await PostRepository.getPosts(
      userId,
      filters?.status as any,
      filters?.limit,
      filters?.brandId,
      filters?.templateId
    );
  },


  generatePosts: async (template: Database['public']['Tables']['templates']['Row'], brandSettings: Database['public']['Tables']['brand_settings']['Row'], count: number = 1) => {
    const response = await apiClient.post('/api/generate/post', {
      template,
      brand_settings: brandSettings,
      count,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to generate posts: ${response.statusText}`);
    }

    return response.data.postContent;
  },

  generatePostsFromPrompt: async (template: Database['public']['Tables']['templates']['Row'], brandSettings: Database['public']['Tables']['brand_settings']['Row'], brandId: string, count: number = 1): Promise<Post[]> => {
    const response = await apiClient.post('/api/generate/post/auto', {
      template,
      brand_settings: brandSettings,
      brand_id: brandId,
      count,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to generate posts: ${response.statusText}`);
    }
    
    return response.data.posts;
  },

  // POST: Generate week's content (uses backend AI)
  generateWeek: async (styleGuide: string) => {
    // Replace with Supabase repository call if applicable
    throw new Error('Supabase repository for generateWeek not implemented yet.');
  },

  // DELETE: Remove a post and its slide images
  deletePostWithSlides: async (postId: string) => {
    // Delete slide images first
    await StorageRepository.deleteSlideImages(postId);
    // Then delete the post object
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
  // GET: Fetch analytics data (optionally filtered by brand)
  getAnalytics: async (timeframe: 'day' | 'week' | 'month' = 'week', brandId?: string | null) => {
    // SCHEDULE: Add brandId filtering to analytics
    return await AnalyticsRepository.getAllUserAnalytics();
  },

  // GET: Fetch variant performance (A/B tests, optionally filtered by brand)
  getVariantPerformance: async (brandId?: string | null) => {
    // Replace with Supabase repository call if applicable
    throw new Error('Supabase repository for getVariantPerformance not implemented yet.');
  },

  // POST: Trigger AI analysis (uses backend AI)
  analyzeAndEvolve: async () => {
    // Replace with Supabase repository call if applicable
    throw new Error('Supabase repository for analyzeAndEvolve not implemented yet.');
  },
};

// ----- TEMPLATES -----

export const templateApi = {
  // GET: Fetch all templates (optionally filtered by brand)
  getTemplates: async () => {
    const userId = await requireUserId();
    return await TemplateRepository.getTemplates(userId);
  },

  // GET: Fetch single template with details
  getTemplate: async (templateId: string) => {
    const userId = await requireUserId();
    return await TemplateRepository.getTemplate(templateId, userId);
  },

  getTemplatesByBrand: async (brandId: string) => {
    const userId = await requireUserId();
    return await TemplateRepository.getTemplatesByBrand(brandId, userId);
  },

  // POST: Create new template
  /**
   * Create new template (expects snake_case keys only!)
   * If you pass camelCase keys (e.g., isDefault, styleConfig), the backend will reject them.
   * Always map UI state to snake_case before calling this function.
   */
  createTemplate: async (templateData: any) => {
    const userId = await requireUserId();
    return await TemplateRepository.createTemplate(userId, templateData);
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
  // GET: Fetch all posts (optionally filtered by brand)
  getPosts: async (filters?: {status?: Database["public"]["Enums"]["post_status"], limit?: number, brandId?: string, templateId?: string}) => {
    const userId = await requireUserId();
    const { status, limit, brandId, templateId } = filters || {};

    return await PostRepository.getPosts(userId, status, limit, brandId, templateId);
  },

  // GET: Fetch single post with details
  getPost: async (postId: string) => {
    const userId = await requireUserId();
    return await PostRepository.getPost(postId, userId);
  },

  // POST: Create new post (with brandId support)
  createPost: async (postData: any) => {
    const userId = await requireUserId();
    // Ensure postData includes user_id and brand_id
    const postWithUserId = {
      ...postData,
      user_id: userId,
    };
    return await PostRepository.createPost(postWithUserId);
  },

  // PUT: Update post
  updatePost: async ({ postId, updates }: { postId: string; updates: any }) => {
    const userId = await requireUserId();
    return await PostRepository.updatePost(postId, updates, userId);
  },

  // POST: Publish post
  publishPost: async (postId: string, lateAccountId: string) => {
    const userId = await requireUserId();

    const response = await apiClient.post('/api/post/slideshow', {
      post_id: postId,
      late_account_id: lateAccountId,
      publish_now: false
    });

    if (response.status !== 200) {
      throw new Error(`Failed to publish post: ${response.statusText}`);
    }

    await PostRepository.updatePostStatus(postId, 'published', userId);
    throw new Error('Supabase repository for publishPost not implemented yet.');
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


export const brandApi = {
  getAuthUrl: async ({late_profile_id, social_platform}: {late_profile_id: string; social_platform: string}): Promise<string> => {
    const response = await apiClient.post('/api/brand/social-auth-url', {
      late_profile_id,
      social_platform
    });

    if (response.status !== 200) {
      throw new Error(`Failed to generate posts: ${response.statusText}`);
    }
    
    return response.data.auth_url;
  },

  // New OAuth flow endpoints
  startSocialConnect: async ({ late_profile_id, brand_id, platform }: { late_profile_id: string, brand_id: string, platform: string }) => {
    const response = await apiClient.post(`/social/connect/${platform}`, {
      existing_profile_id: late_profile_id,
      brand_id,
    });
    return response.data as { authUrl: string; platform: string; message: string };
  },

  checkConnectionStatus: async (connectToken: string) => {
    const response = await apiClient.get(`/connect-social/status/${connectToken}`);
    return response.data;
  },

  cancelConnection: async (connectToken: string) => {
    const response = await apiClient.delete(`/connect-social/cancel/${connectToken}`);
    return response.data;
  },
}

// ----- USER / PROFILE -----

export const userApi = {
  getProfile: async () => {
    const userId = await requireUserId();
    return await UserRepository.getUser(userId);
  },

  updateProfile: async (updates: any) => {
    const userId = await requireUserId();
    return await UserRepository.updateUser(userId, updates);
  },

  // GET: Fetch connected accounts (still using backend temporarily)
  getConnectedAccounts: async () => {
    // Replace with Supabase repository call if applicable
    throw new Error('Supabase repository for getConnectedAccounts not implemented yet.');
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

// ============================================
// ADMIN API FUNCTIONS
// ============================================

// ----- PRICING PLANS -----

export const plansApi = {
  getPlans: async () => {
    const { data } = await apiClient.get('/api/stripe/plans');
    return data;
  },

  getPlan: async (planId: string) => {
    const { data } = await apiClient.get(`/api/stripe/plans/${planId}`);
    return data;
  },

  createPlan: async (plan: Database['public']['Tables']['plans']['Insert']) => {
    const { data } = await apiClient.post('/api/stripe/plans', plan);
    return data;
  },

  updatePlan: async (planId: string, updates: Database['public']['Tables']['plans']['Update']) => {
    const { data } = await apiClient.patch(`/api/stripe/plans/${planId}`, updates);
    return data;
  },

  deletePlan: async (planId: string) => {
    const { data } = await apiClient.delete(`/api/stripe/plans/${planId}`);
    return data;
  },
};

// ----- STRIPE PRODUCTS -----

export const productsApi = {
  getProducts: async () => {
    const { data } = await apiClient.get('/api/stripe/products');
    return data;
  },

  getProduct: async (productId: string) => {
    const { data } = await apiClient.get(`/api/stripe/products/${productId}`);
    return data;
  },
};

// ----- SYSTEM TEMPLATES -----

export const systemTemplatesApi = {
  getSystemTemplates: async () => {
    return await SystemTemplatesRepository.getSystemTemplates();
  },

  getSystemTemplate: async (id: string) => {
    return await SystemTemplatesRepository.getSystemTemplate(id);
  },

  createSystemTemplate: async (template: Database['public']['Tables']['system_templates']['Insert']) => {
    return await SystemTemplatesRepository.createSystemTemplate(template);
  },

  updateSystemTemplate: async (id: string, updates: Database['public']['Tables']['system_templates']['Update']) => {
    return await SystemTemplatesRepository.updateSystemTemplate(id, updates);
  },

  deleteSystemTemplate: async (id: string) => {
    return await SystemTemplatesRepository.deleteSystemTemplate(id);
  },
};

// ----- TESTIMONIALS -----

export const testimonialsApi = {
  getTestimonials: async () => {
    return await TestimonialsRepository.getTestimonials();
  },

  getTestimonial: async (id: string) => {
    return await TestimonialsRepository.getTestimonial(id);
  },

  createTestimonial: async (testimonial: Database['public']['Tables']['testimonials']['Insert']) => {
    return await TestimonialsRepository.createTestimonial(testimonial);
  },

  updateTestimonial: async (id: string, updates: Database['public']['Tables']['testimonials']['Update']) => {
    return await TestimonialsRepository.updateTestimonial(id, updates);
  },

  deleteTestimonial: async (id: string) => {
    return await TestimonialsRepository.deleteTestimonial(id);
  },
};

export default apiClient;
