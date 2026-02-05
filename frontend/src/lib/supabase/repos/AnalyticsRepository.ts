import { supabase } from '../client';

export class AnalyticsRepository {
	/**
	 * Create initial analytics row for a post (if not exists)
	 */
	static async createPostAnalytics(postId: string): Promise<void> {
		await supabase
			.from('post_analytics')
			.insert({ post_id: postId, impressions: 0, likes: 0, shares: 0, saves: 0 })
			.then(() => {});
	}

	/**
	 * Upsert analytics row for a post
	 */
	static async updatePostAnalytics(postId: string, analytics: any): Promise<any> {
		const payload = {
			post_id: postId,
			likes: analytics.likes ?? 0,
			comments: analytics.comments ?? null,
			shares: analytics.shares ?? 0,
			saves: analytics.saves ?? 0,
			impressions: analytics.impressions ?? 0,
			engagement_rate: analytics.engagement_rate ?? null,
			last_updated: analytics.last_updated ?? new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from('post_analytics')
			.upsert(payload, { onConflict: 'post_id' })
			.select()
			.single();

		if (error) throw error;
		return data;
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
			let q: any = supabase.from('post_analytics_history').select('*');
			if (filterPostIds && filterPostIds.length > 0) q = q.in('post_id', filterPostIds);
			if (postId) q = q.eq('post_id', postId);
			// Prefer `last_updated` column for range filtering if present
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
			const postIds = (posts || []).map((p: any) => p.id);
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
