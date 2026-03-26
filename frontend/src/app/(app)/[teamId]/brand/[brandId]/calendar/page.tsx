"use client";

import React from "react";
import CalendarTab from "@/components/Dashboard/CalendarTab";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useScheduledPosts } from "@/features/posts/hooks";

interface ScheduledPost {
  id: number;
  platform: 'Instagram' | 'TikTok';
  title: string;
  time: string;
  date: Date;
}

export default function CalendarPage() {
  const params = useParams();
  const brandId = params.brandId as string;
  const { data: scheduledPosts, isLoading } = useScheduledPosts(brandId);

  const upcomingPosts: ScheduledPost[] = [
    { id: 1, platform: 'Instagram', title: '10 Ways to Boost Your Morning Routine', time: '08:00 AM', date: new Date() },
    { id: 2, platform: 'TikTok', title: '5 Habits That Changed My Life', time: '12:00 PM', date: new Date() },
    { id: 3, platform: 'Instagram', title: 'The Truth About Productivity', time: '04:00 PM', date: new Date() },
    { id: 4, platform: 'TikTok', title: 'Stop Making These Mistakes', time: '08:00 PM', date: new Date() },
    { id: 5, platform: 'Instagram', title: 'Morning Motivation', time: '09:30 AM', date: new Date(new Date().setDate(new Date().getDate() + 1)) },
    { id: 6, platform: 'TikTok', title: 'Quick Productivity Tips', time: '02:00 PM', date: new Date(new Date().setDate(new Date().getDate() + 1)) },
    { id: 7, platform: 'Instagram', title: 'Evening Routine Ideas', time: '06:00 PM', date: new Date(new Date().setDate(new Date().getDate() + 2)) },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return <CalendarTab upcomingPosts={upcomingPosts} brandId={brandId} />;
}
