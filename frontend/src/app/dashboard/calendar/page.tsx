
import CalendarTab from '@/components/Dashboard/CalendarTab';

export default function CalendarPage() {
  // Mock data - replace with actual API calls
  const upcomingPosts = [
    { id: 1, platform: 'Instagram', title: '10 Ways to Boost Your Morning Routine', time: '8:00 AM', date: 'Today', status: 'scheduled' },
    { id: 2, platform: 'TikTok', title: '5 Habits That Changed My Life', time: '12:00 PM', date: 'Today', status: 'scheduled' },
    { id: 3, platform: 'Instagram', title: 'The Truth About Productivity', time: '4:00 PM', date: 'Today', status: 'scheduled' },
    { id: 4, platform: 'TikTok', title: 'Stop Making These Mistakes', time: '8:00 PM', date: 'Today', status: 'scheduled' },
  ];

  return (
    <div className="p-8">
      <CalendarTab upcomingPosts={upcomingPosts} />
    </div>
  );
}

'use client';

import React from "react";
import CalendarTab from '@/components/Dashboard/CalendarTab';

export default function CalendarPage() {
  // Mock data - replace with actual API calls
  const upcomingPosts = [
    { id: 1, platform: 'Instagram', title: '10 Ways to Boost Your Morning Routine', time: '8:00 AM', date: 'Today', status: 'scheduled' },
    { id: 2, platform: 'TikTok', title: '5 Habits That Changed My Life', time: '12:00 PM', date: 'Today', status: 'scheduled' },
    { id: 3, platform: 'Instagram', title: 'The Truth About Productivity', time: '4:00 PM', date: 'Today', status: 'scheduled' },
    { id: 4, platform: 'TikTok', title: 'Stop Making These Mistakes', time: '8:00 PM', date: 'Today', status: 'scheduled' },
  ];

  return (
    <div className="p-8">
      <CalendarTab upcomingPosts={upcomingPosts} />
    </div>
  );
}
