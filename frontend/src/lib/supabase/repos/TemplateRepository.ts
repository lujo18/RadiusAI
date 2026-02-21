import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Database } from "@/types/database";
import { TemplateSchema } from "@/types";
import { supabase } from "../client";

export class TemplateRepository {
  static async getTemplate(templateId: string) {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return data ? TemplateSchema.parse(data) : null;
  }

  static async getTemplates(brandIds: string[]) {
    // Must provide accessible brand IDs - RLS will filter further
    if (!brandIds || brandIds.length === 0) return [];
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .in("brand_id", brandIds)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((t) => TemplateSchema.parse(t));
  }

  static async getTemplatesWithoutBrandFilter() {
    // Fallback: query all templates and let RLS enforce access
    console.log('[REPO] getTemplatesWithoutBrandFilter - querying all templates (RLS will filter)');
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error('[REPO] Error querying templates:', error);
      throw new Error(error.message);
    }
    console.log('[REPO] Templates returned by RLS:', data?.length || 0);
    return (data || []).map((t) => TemplateSchema.parse(t));
  }

  static async getTemplatesByCategory(category: string, brandIds: string[]) {
    // Must provide accessible brand IDs - RLS will filter further
    if (!brandIds || brandIds.length === 0) return [];
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("category", category)
      .in("brand_id", brandIds)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((t) => TemplateSchema.parse(t));
  }

  static async getFavoriteTemplates(brandIds: string[]) {
    // Must provide accessible brand IDs - RLS will filter further
    if (!brandIds || brandIds.length === 0) return [];
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("favorite", true)
      .in("brand_id", brandIds)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((t) => TemplateSchema.parse(t));
  }

  static async createTemplate(template: z.infer<typeof TemplateSchema>) {
    // brand_id is required and RLS enforces access
    if (!template.brand_id) throw new Error('brand_id is required to create a template');
    
    // Omit user_id (no longer in DB schema) and other optional fields
    const { user_id, ...insertData } = template;
    
    const { data, error } = await supabase
      .from("templates")
      .insert([insertData as any])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return TemplateSchema.parse(data);
  }

  static async updateTemplate(
    templateId: string,
    updates: Partial<z.infer<typeof TemplateSchema>>,
  ) {
    // RLS enforces access via brand_id relationship
    const { data, error } = await supabase
      .from("templates")
      .update(updates)
      .eq("id", templateId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return TemplateSchema.parse(data);
  }

  static async deleteTemplate(templateId: string) {
    // RLS enforces access via brand_id relationship
    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", templateId);
    if (error) throw new Error(error.message);
    return true;
  }

  static async toggleTemplateFavorite(templateId: string, favorite: boolean) {
    // RLS enforces access via brand_id relationship
    const { error } = await supabase
      .from("templates")
      .update({ favorite })
      .eq("id", templateId);
    if (error) throw new Error(error.message);
    return true;
  }

  static async setDefaultTemplate(templateId: string, brandId: string) {
    // Unset any existing default for this brand
    await supabase
      .from("templates")
      .update({ is_default: false })
      .eq("brand_id", brandId)
      .eq("is_default", true);
    // Set new default
    const { error } = await supabase
      .from("templates")
      .update({ is_default: true })
      .eq("id", templateId);
    if (error) throw new Error(error.message);
    return true;
  }

  static async getTemplateWithAnalytics(templateId: string) {
    // RLS enforces access via brand_id relationship
    const { data: template, error } = await supabase
      .from("templates")
      .select(
        `
        *,
        posts(
          id,
          post_analytics(*)
        )
      `,
      )
      .eq("id", templateId)
      .single();
    if (error) throw new Error(error.message);
    if (!template) return null;

    const posts = (template as any).posts || [];
    const allAnalytics = posts.flatMap((p: any) => p.post_analytics || []);

    const condensedAnalytics = allAnalytics.reduce(
      (acc: any, item: any) => {
        acc.impressions += item.impressions || 0;
        acc.likes += item.likes || 0;
        acc.shares += item.shares || 0;
        acc.saves += item.saves || 0;
        acc.comments += item.comments || 0;
        return acc;
      },
      {
        impressions: 0,
        likes: 0,
        shares: 0,
        saves: 0,
        comments: 0,
      },
    );

    condensedAnalytics.postCount = posts.length;
    condensedAnalytics.engagementRate = condensedAnalytics.impressions
      ? ((condensedAnalytics.likes +
          condensedAnalytics.shares +
          condensedAnalytics.saves +
          condensedAnalytics.comments) /
          condensedAnalytics.impressions) *
        100
      : 0;

    delete (template as any).posts; // Remove raw posts data

    return {
      ...TemplateSchema.parse(template),
      analytics: condensedAnalytics,
    };
  }

  static async getTemplatesByBrand(brandId: string) {
    // RLS enforces access - only templates for brands user can access
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((t) => TemplateSchema.parse(t));
  }

  static async getBrandTemplatesWithAnalytics(brandId: string) {
    // RLS enforces access - only templates for brands user can access
    console.log('[REPO] getBrandTemplatesWithAnalytics - fetching for brandId:', brandId);
    const { data: templates, error } = await supabase
      .from("templates")
      .select(
        `
        *,
        posts(
          id, 
          post_analytics (*)
        )
        
      `,
      )
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });
    
    console.log('[REPO] getBrandTemplatesWithAnalytics - result:', { templatesCount: templates?.length, error });
    if (error) {
      console.error('[REPO] getBrandTemplatesWithAnalytics - error:', error);
      throw new Error(error.message);
    }
    if (!templates) {
      console.log('[REPO] getBrandTemplatesWithAnalytics - no templates returned');
      return [];
    }

    const finalTemplates = templates.map((template: any) => {

      const allAnalytics = template.posts.flatMap((p: any) => p.post_analytics || []);
      
      const condensedAnalytics = allAnalytics.reduce(
        (acc: any, item: any) => {
          acc.impressions += item.impressions || 0;
          acc.likes += item.likes || 0;
          acc.shares += item.shares || 0;
          acc.saves += item.saves || 0;
          acc.comments += item.comments || 0;
          return acc;
        },
        {
          impressions: 0,
          likes: 0,
          shares: 0,
          saves: 0,
          comments: 0,
        },
      );

      condensedAnalytics.postCount = template.posts.length;

      condensedAnalytics.engagementRate = condensedAnalytics.impressions
        ? ((condensedAnalytics.likes +
            condensedAnalytics.shares +
            condensedAnalytics.saves +
            condensedAnalytics.comments) /
            condensedAnalytics.impressions) *
          100
        : 0;

      delete template.post_analytics; // Remove raw analytics data

      return {
        ...TemplateSchema.parse(template),
        analytics: condensedAnalytics || { error: "No analytics data" },
      };
    });

    return finalTemplates;
  }
}
