import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Database } from "@/types/database";
import { TemplateSchema } from "@/types";
import { supabase } from "../client";

export class TemplateRepository {
  static async getTemplate(templateId: string, userId?: string) {
    let query = supabase.from("templates").select("*").eq("id", templateId);
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query.single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return data ? TemplateSchema.parse(data) : null;
  }

  static async getTemplates(userId: string) {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((t) => TemplateSchema.parse(t));
  }

  static async getTemplatesByCategory(userId: string, category: string) {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((t) => TemplateSchema.parse(t));
  }

  static async getFavoriteTemplates(userId: string) {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("user_id", userId)
      .eq("favorite", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((t) => TemplateSchema.parse(t));
  }

  static async createTemplate(
    userId: string,
    template: z.infer<typeof TemplateSchema>,
  ) {
    console.log("Supabase Creating Template", template);

    const { data, error } = await supabase
      .from("templates")
      .insert([{ ...template, user_id: userId }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return TemplateSchema.parse(data);
  }

  static async updateTemplate(
    templateId: string,
    updates: Partial<z.infer<typeof TemplateSchema>>,
    userId?: string,
  ) {
    let query = supabase.from("templates").update(updates).eq("id", templateId);
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query.select().single();
    if (error) throw new Error(error.message);
    return TemplateSchema.parse(data);
  }

  static async deleteTemplate(templateId: string, userId?: string) {
    let query = supabase.from("templates").delete().eq("id", templateId);
    if (userId) query = query.eq("user_id", userId);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return true;
  }

  static async toggleTemplateFavorite(
    templateId: string,
    favorite: boolean,
    userId: string,
  ) {
    const { error } = await supabase
      .from("templates")
      .update({ favorite })
      .eq("id", templateId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return true;
  }

  static async setDefaultTemplate(templateId: string, userId: string) {
    // Unset any existing default
    await supabase
      .from("templates")
      .update({ is_default: false })
      .eq("user_id", userId)
      .eq("is_default", true);
    // Set new default
    const { error } = await supabase
      .from("templates")
      .update({ is_default: true })
      .eq("id", templateId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return true;
  }

  static async getTemplateWithAnalytics(templateId: string, userId: string) {
    // First verify user owns the template
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
      .eq("user_id", userId)
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

  static async getTemplatesByBrand(brandId: string, userId: string) {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("brand_id", brandId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    console.log("gtbb out", data, error);

    if (error) throw new Error(error.message);
    return (data || []).map((t) => TemplateSchema.parse(t));
  }

  static async getBrandTemplatesWithAnalytics(brandId: string, userId: string) {
    // First verify user owns the template
    console.log("Getting template with analytics");
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
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
      
    if (error) throw new Error(error.message);
    if (!templates) return [];

    console.log("templates", templates, "error", error);
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

      console.log(brandId, ": ", condensedAnalytics);
      return {
        ...TemplateSchema.parse(template),
        analytics: condensedAnalytics || { error: "No analytics data" },
      };
    });

    return finalTemplates;
  }
}
