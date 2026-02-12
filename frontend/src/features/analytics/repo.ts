import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import type { AnalyticTimeframes, AnalyticSections } from './types';

type PostAnalyticsHistoryRow = Database['public']['Tables']['post_analytics_history']['Row'];
type PostRow = Database['public']['Tables']['posts']['Row'];

export class AnalyticsRepository {


  static async getPostAnalyticsHistory(timeframe: AnalyticTimeframes, section: AnalyticSections, postId: string) {
    
    const { data, error } = await supabase.rpc('get_processed_analytics', {
      p_post_id: postId,
      p_timeframe: timeframe,
      p_section: section,
			p_mode: 'change',
			p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })

    console.log("DATA", data)

    if (error) throw error;
    return data || [];
  }

  static async getBrandAnalyticsHistory(timeframe: AnalyticTimeframes, section: AnalyticSections, brandId: string) {
    
    const { data, error } = await supabase.rpc('get_processed_analytics', {
      p_brand_id: brandId,
      
      p_range: timeframe,
      p_section: section,
			p_mode: 'change',
			p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })

    if (error) throw error;
    return data || [];
  }
	/**
	 * Get a single post analytics row
	 */
	static async getPostAnalytics(postId: string): Promise<any | null> {
		const { data, error } = await supabase
			.from('post_analytics')
			.select('*')
			.eq('post_id', postId)
			.single();

		if (error && error.code !== 'PGRST116') throw error; // ignore not found
		return data ?? null;
	}

	/**
	 * Get analytics rows optionally filtered by brandId or single post
	 */
	static async getAnalytics(opts?: { brandId?: string | null; postId?: string }): Promise<any[]> {
		const { brandId, postId } = opts ?? {};

		// If single post requested, return it
		if (postId) {
			const row = await this.getPostAnalytics(postId);
			return row ? [row] : [];
		}

		// If brandId provided, fetch post ids for that brand and filter
		if (brandId) {
			const { data: posts, error: postsError } = await supabase
				.from('posts')
				.select('id')
				.eq('brand_id', brandId);
			if (postsError) throw postsError;
			const postIds = (posts || []).map((p: any) => p.id);

			if (postIds.length === 0) return [];

			const { data, error } = await supabase
				.from('post_analytics')
				.select('*')
				.in('post_id', postIds);

			if (error) throw error;
			return data || [];
		}

		// Otherwise return all analytics (capped reasonably)
		const { data, error } = await supabase.from('post_analytics').select('*').order('last_updated', { ascending: false }).limit(1000);
		if (error) throw error;
		return data || [];
	}

	/**
	 * Query post analytics history. Supports filtering by brandId, postId and optional time range.
	 */
	static async getAnalyticsHistory(opts?: {
		brandId?: string | null;
		postId?: string;
		from?: string; // ISO timestamp
		to?: string; // ISO timestamp
	}): Promise<any[]> {
		const { brandId, postId, from, to } = opts ?? {};

		// Helper to query history table
		const queryHistory = (filterPostIds?: string[]) => {
			let q = supabase.from('post_analytics_history').select('*');
			if (filterPostIds && filterPostIds.length > 0) q = q.in('post_id', filterPostIds);
			if (postId) q = q.eq('post_id', postId);
			if (from) q = q.gte('last_updated', from);
			if (to) q = q.lte('last_updated', to);
			return q.order('last_updated', { ascending: false }).limit(2000);
		};

		if (postId) {
			const { data, error } = await queryHistory();
			if (error) throw error;
			return data || [];
		}

		if (brandId) {
			// Get posts for brand
			const { data: posts, error: postsError } = await supabase.from('posts').select('id').eq('brand_id', brandId);
			if (postsError) throw postsError;
			const postIds = (posts || []).map((p) => p.id as string);
			if (postIds.length === 0) return [];
			const { data, error } = await queryHistory(postIds);
			if (error) throw error;
			return data || [];
		}

		// No filters: return recent history
		const { data, error } = await queryHistory();
		if (error) throw error;
		return data || [];
	}

	static async getAllUserAnalytics(): Promise<any> {
		return await this.getAnalytics();
	}

	static async getTemplateAggregateAnalytics(templateId: string): Promise<any> {
		// Simple aggregation: find posts with given template and aggregate their analytics
		const { data: posts, error: postsError } = await supabase.from('posts').select('id').eq('template_id', templateId);
		if (postsError) throw postsError;
		const postIds = (posts || []).map((p: any) => p.id);
		if (postIds.length === 0) return null;

		const { data, error } = await supabase
			.from('post_analytics')
			.select('impressions,likes,shares,saves')
			.in('post_id', postIds);
		if (error) throw error;

		// aggregate
		const agg = (data || []).reduce(
			(acc: any, cur: any) => {
				acc.impressions += cur.impressions || 0;
				acc.likes += cur.likes || 0;
				acc.shares += cur.shares || 0;
				acc.saves += cur.saves || 0;
				return acc;
			},
			{ impressions: 0, likes: 0, shares: 0, saves: 0 },
		);
		return agg;
	}
}
