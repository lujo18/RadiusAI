export type AnalyticTimeframes = '24h' | '7d' | '30d' | '90d' | '180d' | '365d' | 'all';
export type AnalyticSections = 'first' | 'recent';

export type AnalyticOptions = 'impressions' | 'likes' | 'shares' | 'saves' | 'comments' | 'engagement_rate';



export const analyticChartCategories: {
  title: string;
  key: AnalyticOptions;
  type: "unit";
}[] = [
  {
    title: "Impressions",
    key: "impressions",
    type: "unit",
  },
  {
    title: "Likes",
    key: "likes",
    type: "unit",
  },
  {
    title: "Shares",
    key: "shares",
    type: "unit",
  },
  // {
  //   title: "Saves",
  //   key: "saves",
  //   type: "unit",
  // },
  // {
  //   title: "Comments",
  //   key: "comments",
  //   type: "unit",
  // },
  // {
  //   title: "Engagement Rate",
  //   key: "engagement_rate",
  //   type: "unit",
  // },
];
