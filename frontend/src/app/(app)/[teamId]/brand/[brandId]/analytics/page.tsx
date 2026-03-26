"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AnalyticsTab from '@/components/Dashboard/AnalyticsTab';
import { useAnalytics } from '@/features/analytics/hooks';

export default function AnalyticsPage() {
  // Using mock loading state - actual analytics structured differently
  const { isLoading } = useAnalytics("7d", "recent");

  const performanceData = [
    { day: 'Mon', impressions: 12400, engagement: 1240, saves: 450 },
    { day: 'Tue', impressions: 15600, engagement: 1560, saves: 580 },
    { day: 'Wed', impressions: 18900, engagement: 1890, saves: 720 },
    { day: 'Thu', impressions: 14200, engagement: 1420, saves: 510 },
    { day: 'Fri', impressions: 21300, engagement: 2130, saves: 890 },
    { day: 'Sat', impressions: 19800, engagement: 1980, saves: 750 },
    { day: 'Sun', impressions: 17500, engagement: 1750, saves: 640 },
  ];

  const variantPerformance = [
    { variant: 'A: 8-Slide List', posts: 14, avgSaves: 320, avgShares: 45 },
    { variant: 'B: 5-Slide Quotes', posts: 14, avgSaves: 680, avgShares: 92 },
    { variant: 'C: Story Format', posts: 14, avgSaves: 420, avgShares: 58 },
    { variant: 'D: Bold Questions', posts: 14, avgSaves: 510, avgShares: 71 },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <AnalyticsTab
        variantPerformance={variantPerformance}
        performanceData={performanceData}
      />
    </div>
  );
}
