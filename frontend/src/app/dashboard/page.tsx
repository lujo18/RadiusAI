'use client';

import { useDashboardStore } from '@/store';
import OverviewTab from '@/components/Dashboard/OverviewTab';

export default function DashboardPage() {
  const isGenerating = useDashboardStore((state) => state.isGenerating);
  const setIsGenerating = useDashboardStore((state) => state.setIsGenerating);
  const stats = useDashboardStore((state) => state.stats);


  
  // Mock data - replace with actual API calls
  const mockStats = {
    postsScheduled: 98,
    totalEngagement: 34567,
    avgEngagementRate: 8.4,
    topPerformer: 'Variant B - 5 Slide Quotes',
  };

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

  const upcomingPosts = [
    { id: 1, platform: 'Instagram', title: '10 Ways to Boost Your Morning Routine', time: '8:00 AM', date: 'Today', status: 'scheduled' },
    { id: 2, platform: 'TikTok', title: '5 Habits That Changed My Life', time: '12:00 PM', date: 'Today', status: 'scheduled' },
    { id: 3, platform: 'Instagram', title: 'The Truth About Productivity', time: '4:00 PM', date: 'Today', status: 'scheduled' },
    { id: 4, platform: 'TikTok', title: 'Stop Making These Mistakes', time: '8:00 PM', date: 'Today', status: 'scheduled' },
  ];

  return (
    <div className="p-8">
      <OverviewTab
        stats={stats || mockStats}
        performanceData={performanceData}
        upcomingPosts={upcomingPosts}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
      />
    </div>
  );
}

