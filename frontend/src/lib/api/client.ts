import axios, { AxiosError } from 'axios';
import { supabase } from '@/lib/supabase/client';
import type {
  ProductResponse,
  ProductsResponse,
  StripeSubscription,
  StripeProduct,
  StripePrice,
} from '@/lib/api/types/stripe';

// Import all Supabase CRUD operations
import { TemplateRepository } from '../supabase/repos/TemplateRepository';
import { PostRepository } from '../supabase/repos/PostRepository';
import { StorageRepository } from '../supabase/repos/StorageRepository';
import { AnalyticsRepository } from '../supabase/repos/AnalyticsRepository';
import analyticsSurface from '@/lib/api/surface/analyticsApi';
import { SystemTemplatesRepository } from '../supabase/repos/SystemTemplatesRepository';
import { TestimonialsRepository } from '../supabase/repos/TestimonialsRepository';
import type { Database } from '@/types/database';
import type { BrandSettings as BrandSettingsType } from '@/lib/validation/brandSchemas';
import { UserRepository } from '../supabase/repos/UserRepository';
import { Post } from '@/types/types';
import postSurface from '@/lib/api/surface/postApi';
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
    return await postSurface.getPosts(filters);
  },

  // DELETE: Remove a post and its slide images
  deletePostWithSlides: async (postId: string) => {
    return await postSurface.deletePostWithSlides(postId);
  },

  // PUT: Update a post
  updatePost: async ({ postId, updates }: { postId: string; updates: any }) => {
    return await postSurface.updatePost(postId, updates);
  },
};

// ----- ANALYTICS -----

export const analyticsApi = {
  // GET: Fetch analytics data (optionally filtered by brand)
  getAnalytics: async (timeframe: 'day' | 'week' | 'month' = 'week', brandId?: string | null) => {
    // SCHEDULE: Add brandId filtering to analytics
    return await analyticsSurface.getAnalytics(timeframe, brandId);
  },

  // GET: Fetch variant performance (A/B tests, optionally filtered by brand)
  getVariantPerformance: async (brandId?: string | null) => {
    // Replace with Supabase repository call if applicable
    return await analyticsSurface.getVariantPerformance(brandId);
  },

  // POST: Trigger AI analysis (uses backend AI)
  analyzeAndEvolve: async () => {
    // Replace with Supabase repository call if applicable
    return await analyticsSurface.analyzeAndEvolve();
  },
};

// ----- TEMPLATES -----

export const templateApi = {
  // GET: Fetch all templates (optionally filtered by brand)
  getTemplates: async () => {
    return await (await import('@/lib/api/surface/templateApi')).templateApi.getTemplates();
  },

  // GET: Fetch single template with details
  getTemplate: async (templateId: string) => {
    return await (await import('@/lib/api/surface/templateApi')).templateApi.getTemplate(templateId);
  },

  getTemplatesByBrand: async (brandId: string) => {
    return await (await import('@/lib/api/surface/templateApi')).templateApi.getTemplatesByBrand(brandId);
  },

  // POST: Create new template
  /**
   * Create new template (expects snake_case keys only!)
   * If you pass camelCase keys (e.g., isDefault, styleConfig), the backend will reject them.
   * Always map UI state to snake_case before calling this function.
   */
  createTemplate: async (templateData: any) => {
    return await (await import('@/lib/api/surface/templateApi')).templateApi.createTemplate(templateData);
  },

  // PUT: Update template
  updateTemplate: async ({ templateId, updates }: { templateId: string; updates: any }) => {
    return await (await import('@/lib/api/surface/templateApi')).templateApi.updateTemplate(templateId, updates);
  },

  // DELETE: Archive template
  deleteTemplate: async (templateId: string) => {
    return await (await import('@/lib/api/surface/templateApi')).templateApi.deleteTemplate(templateId);
  },

  // PUT: Set template as default
  setDefaultTemplate: async (templateId: string) => {
    return await (await import('@/lib/api/surface/templateApi')).templateApi.setDefaultTemplate(templateId);
  },
};

// Re-export the post surface API to avoid duplicating definitions here
export { default as postApi } from '@/lib/api/surface/postApi';


export const brandApi = {

  // New OAuth flow endpoints
  startSocialConnect: async ({ late_profile_id, brand_id, platform }: { late_profile_id: string, brand_id: string, platform: string }) => {
    return await (await import('@/lib/api/surface/brandApi')).brandApi.startSocialConnect({ late_profile_id, brand_id, platform });
  },

  disconnectSocialAccount: async ({ integration_id }: { integration_id: string }) => {
    return await (await import('@/lib/api/surface/brandApi')).brandApi.disconnectSocialAccount({ integration_id });
  },

  checkConnectionStatus: async (connectToken: string) => {
    return await (await import('@/lib/api/surface/brandApi')).brandApi.checkConnectionStatus(connectToken);
  },

  cancelConnection: async (connectToken: string) => {
    return await (await import('@/lib/api/surface/brandApi')).brandApi.cancelConnection(connectToken);
  },
}

// ----- USER / PROFILE -----

export const userApi = {
  getProfile: async () => {
    return await (await import('@/lib/api/surface/userApi')).userApi.getProfile();
  },

  updateProfile: async (updates: any) => {
    return await (await import('@/lib/api/surface/userApi')).userApi.updateProfile(updates);
  },

  // GET: Fetch connected accounts (still using backend temporarily)
  getConnectedAccounts: async () => {
    return await (await import('@/lib/api/surface/userApi')).userApi.getConnectedAccounts();
  },
};

// ----- SUBSCRIPTION / BILLING -----
// Backend-only: Stripe integration

export const billingApi = {
  // GET: Fetch subscription info
  getSubscription: async (expand?: string[]) => {
    const url = expand ? `/api/billing/subscription?expand=${encodeURIComponent(JSON.stringify(expand))}` : '/api/billing/subscription';
    const { data } = await apiClient.get(url);
    return data as { subscription: StripeSubscription | null };
  },

  // POST: Create checkout session (Stripe)
  createCheckoutSession: async (priceId: string): Promise<{ url?: string; id?: string } | any> => {
    const { data } = await apiClient.post('/api/billing/checkout', { priceId });
    return data;
  },
  // POST: Create a Stripe customer portal session (backend returns a { url })
  createPortal: async (userId: string): Promise<{ url?: string } | any> => {
    const { data } = await apiClient.post('/api/billing/portal', { user_id: userId });
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

  createPlan: async (plan: any) => {
    const { data } = await apiClient.post('/api/stripe/plans', plan);
    return data;
  },

  updatePlan: async (planId: string, updates: any) => {
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
  getProducts: async (): Promise<ProductsResponse> => {
    const { data } = await apiClient.get('/api/billing/products');
    return data as ProductsResponse;
  },

  getProduct: async (productId: string): Promise<ProductResponse> => {
    const { data } = await apiClient.get(`/api/billing/product?productId=${productId}`);
    return data as ProductResponse;
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
    return await (await import('@/lib/api/surface/testimonialsApi')).testimonialsApi.getTestimonials();
  },

  getTestimonial: async (id: string) => {
    return await (await import('@/lib/api/surface/testimonialsApi')).testimonialsApi.getTestimonial(id);
  },

  createTestimonial: async (testimonial: Database['public']['Tables']['testimonials']['Insert']) => {
    return await (await import('@/lib/api/surface/testimonialsApi')).testimonialsApi.createTestimonial(testimonial as any);
  },

  updateTestimonial: async (id: string, updates: Database['public']['Tables']['testimonials']['Update']) => {
    return await (await import('@/lib/api/surface/testimonialsApi')).testimonialsApi.updateTestimonial(id, updates as any);
  },

  deleteTestimonial: async (id: string) => {
    return await (await import('@/lib/api/surface/testimonialsApi')).testimonialsApi.deleteTestimonial(id);
  },
};

// ----- PRESET PACKS -----

export const presetPackApi = {
  getPresetPacks: async (accessibility?: 'global' | 'private') => {
    return await (await import('@/lib/api/surface/presetPackApi')).presetPackApi.getPresetPacks(accessibility);
  },

  getPresetPack: async (id: string) => {
    return await (await import('@/lib/api/surface/presetPackApi')).presetPackApi.getPresetPack(id);
  },

  createPresetPack: async (data: any) => {
    return await (await import('@/lib/api/surface/presetPackApi')).presetPackApi.createPresetPack(data);
  },

  updatePresetPack: async (id: string, updates: any) => {
    return await (await import('@/lib/api/surface/presetPackApi')).presetPackApi.updatePresetPack(id, updates);
  },

  deletePresetPack: async (id: string) => {
    return await (await import('@/lib/api/surface/presetPackApi')).presetPackApi.deletePresetPack(id);
  },

  uploadPresetImage: async (data: any) => {
    return await (await import('@/lib/api/surface/presetPackApi')).presetPackApi.uploadPresetImage(data);
  },

  getPresetImages: async (packId: string, options: any) => {
    return await (await import('@/lib/api/surface/presetPackApi')).presetPackApi.getPresetImages(packId, options);
  },

  deletePresetImage: async (id: string) => {
    return await (await import('@/lib/api/surface/presetPackApi')).presetPackApi.deletePresetImage(id);
  },
};

export default apiClient;
