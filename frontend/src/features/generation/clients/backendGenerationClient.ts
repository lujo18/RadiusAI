import axios from 'axios';
import type { Database } from '@/types/database';
import type { BrandSettings } from '@/lib/validation/brandSchemas';
import type { Post } from '@/types/types';
import { supabase } from '@/lib/supabase/client';
import backendClient from '@/lib/api/clients/backendClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const backendGenerationClient = {
  async generatePostsFromTemplate(payload: {
    templateId: string;
    brandSettings: BrandSettings;
    count: number;
  }): Promise<Post[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await axios.post(
      `${API_BASE}/api/generate/post`,
      { 
        template_id: payload.templateId,
        brand_settings: payload.brandSettings, 
        count: payload.count 
      },
      { headers: { Authorization: `Bearer ${session?.access_token}` } }
    );
    return response.data?.posts || response.data;
  },

  async generatePostsFromPrompt(payload: {
    template: Database['public']['Tables']['templates']['Row'];
    brandSettings: BrandSettings;
    brandId: string;
    count: number;
    ctaId?: string;
    stock_pack_directory?: string;
  }): Promise<Post[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    
    const response = await axios.post(
      `${API_BASE}/api/generate/post/auto`,
      {
        template: payload.template,
        brand_settings: payload.brandSettings,
        brand_id: payload.brandId,
        cta_id: payload.ctaId,
        stock_pack_directory: payload.stock_pack_directory,
        count: payload.count,
      },
      { headers: { Authorization: `Bearer ${session?.access_token}` } }
    );
    
    console.log('[DEBUG] API Client response received');
    
    return response.data?.posts || response.data;
  },

  async generateVariants(payload: {
    templateIds: string[];
    brandSettings: BrandSettings;
    postsPerTemplate: number;
  }): Promise<Record<string, Post[]>> {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await axios.post(
      `${API_BASE}/api/generate/variants`,
      {
        template_ids: payload.templateIds,
        brand_settings: payload.brandSettings,
        posts_per_template: payload.postsPerTemplate,
      },
      { headers: { Authorization: `Bearer ${session?.access_token}` } }
    );
    return response.data;
  },

  async generateBrandSettings(guideline: string): Promise<BrandSettings> {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await axios.post(
      `${API_BASE}/api/brand/generate`,
      { guideline_prompt: guideline },
      { headers: { Authorization: `Bearer ${session?.access_token}` } }
    );
    return response.data;
  },

  async generateTemplateFromPrompt(prompt: string): Promise<any> {
    const response = await backendClient.post(
      `/api/template/generate`,
      { guideline_prompt: prompt },
    );
    return response.data;
  },
};

export default backendGenerationClient;
