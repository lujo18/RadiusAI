import { z } from "zod";

// Analytics metrics (from analytics.metrics)
export const AnalyticsMetricsSchema = z.object({
  impressions: z.number(),
  reach: z.number(),
  engagement: z.number(),
  engagementRate: z.number(),
  saves: z.number(),
  shares: z.number(),
  comments: z.number(),
  profileVisits: z.number(),
  clickThroughRate: z.number(),
});
export type AnalyticsMetrics = z.infer<typeof AnalyticsMetricsSchema>;
export function parseAnalyticsMetrics(json: unknown): AnalyticsMetrics | null {
  const result = AnalyticsMetricsSchema.safeParse(json);
  return result.success ? result.data : null;
}

// VariantSet results (from variantSets.results)
export const VariantSetResultsSchema = z.object({
  winningTemplateId: z.string(),
  confidenceScore: z.number(),
  insights: z.array(z.string()),
  stats: z.record(z.string(), z.any()).optional(), // You may want to refine this type
  completedAt: z.string().optional(),
});
export type VariantSetResults = z.infer<typeof VariantSetResultsSchema>;
export function parseVariantSetResults(json: unknown): VariantSetResults | null {
  const result = VariantSetResultsSchema.safeParse(json);
  return result.success ? result.data : null;
}

// SlideDesign background (already defined in parseJsonColumn.supabase.ts)
// If you have other slideDesign JSONB fields, add them here

// Add more schemas for other JSONB columns as needed
