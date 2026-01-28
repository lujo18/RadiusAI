
"use client";

import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FiInstagram, FiVideo, FiClock, FiEdit2, FiTrash2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";

interface ScheduledPost {
  id: number;
  platform: 'Instagram' | 'TikTok';
  title: string;
  time: string;
  date: Date;
  status: 'scheduled' | 'published' | 'draft';
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Mock data - replace with actual API calls
  const scheduledPosts: ScheduledPost[] = [
    { id: 1, platform: 'Instagram', title: '10 Ways to Boost Your Morning Routine', time: '08:00', date: new Date(), status: 'scheduled' },
    { id: 2, platform: 'TikTok', title: '5 Habits That Changed My Life', time: '12:00', date: new Date(), status: 'scheduled' },
    { id: 3, platform: 'Instagram', title: 'The Truth About Productivity', time: '16:00', date: new Date(), status: 'scheduled' },
    { id: 4, platform: 'TikTok', title: 'Stop Making These Mistakes', time: '20:00', date: new Date(), status: 'scheduled' },
    { id: 5, platform: 'Instagram', title: 'Morning Motivation', time: '09:30', date: new Date(new Date().setDate(new Date().getDate() + 1)), status: 'scheduled' },
    { id: 6, platform: 'TikTok', title: 'Quick Productivity Tips', time: '14:00', date: new Date(new Date().setDate(new Date().getDate() + 1)), status: 'scheduled' },
    { id: 7, platform: 'Instagram', title: 'Evening Routine Ideas', time: '18:00', date: new Date(new Date().setDate(new Date().getDate() + 2)), status: 'scheduled' },
  ];

  // Get dates with scheduled posts for highlighting
  const datesWithPosts = scheduledPosts.map(post => post.date);

  // Filter posts for selected date
  const postsForSelectedDate = selectedDate 
    ? scheduledPosts.filter(post => 
        post.date.toDateString() === selectedDate.toDateString()
      )
    : [];

  // Generate hourly time slots (6 AM to 11 PM)
  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 6;
    return {
      hour: hour.toString().padStart(2, '0'),
      label: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
    };
  });

  // Group posts by hour
  const getPostsForHour = (hour: string) => {
    return postsForSelectedDate.filter(post => {
      const postHour = post.time.split(':')[0];
      return postHour === hour;
    });
  };

  const getPlatformIcon = (platform: string) => {
    return platform === 'Instagram' ? <FiInstagram /> : <FiVideo />;
  };

  const getPlatformColor = (platform: string) => {
    return platform === 'Instagram' 
      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
      : 'bg-black text-white';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Content Calendar</h1>
        <p className="text-muted-foreground">Schedule and manage your social media posts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              defaultMonth={selectedDate}
              modifiers={{
                hasPost: datesWithPosts,
              }}
              modifiersClassNames={{
                hasPost: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
              }}
              className="rounded-md border"
            />
            
            {/* Legend */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Has scheduled posts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate 
                ? `Schedule for ${selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}`
                : 'Select a date to view schedule'
              }
            </CardTitle>
            {postsForSelectedDate.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {postsForSelectedDate.length} post{postsForSelectedDate.length !== 1 ? 's' : ''} scheduled
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {selectedDate ? (
                postsForSelectedDate.length > 0 ? (
                  timeSlots.map((slot) => {
                    const postsInSlot = getPostsForHour(slot.hour);
                    
                    return (
                      <div 
                        key={slot.hour} 
                        className={`flex gap-4 p-3 rounded-lg border transition-colors ${
                          postsInSlot.length > 0 
                            ? 'bg-card border' 
                            : 'bg-transparent border-transparent hover:border'
                        }`}
                      >
                        {/* Time Label */}
                        <div className="flex items-start pt-1 min-w-[80px]">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FiClock className="w-4 h-4" />
                            <span className="font-medium">{slot.label}</span>
                          </div>
                        </div>

                        {/* Posts */}
                        <div className="flex-1 space-y-2">
                          {postsInSlot.length > 0 ? (
                            postsInSlot.map((post) => (
                              <div 
                                key={post.id}
                                className="group flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Badge className={getPlatformColor(post.platform)}>
                                    {getPlatformIcon(post.platform)}
                                  </Badge>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {post.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {post.time} • {post.platform}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <FiEdit2 className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                                    <FiTrash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground/50 italic">
                              No posts scheduled
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FiClock className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No posts scheduled for this date</p>
                    <Button variant="outline" className="mt-4">
                      Schedule Post
                    </Button>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">Select a date to view schedule</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Scheduled Posts */}
      <Card>
        <CardHeader>
          <CardTitle>All Scheduled Posts</CardTitle>
          <p className="text-sm text-muted-foreground">
            {scheduledPosts.length} post{scheduledPosts.length !== 1 ? 's' : ''} scheduled across all dates
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scheduledPosts
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((post) => (
                <div 
                  key={post.id}
                  className="group flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Badge className={getPlatformColor(post.platform)}>
                      {getPlatformIcon(post.platform)}
                    </Badge>
                    
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-foreground">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{post.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{post.time}</span>
                        <span>•</span>
                        <span>{post.platform}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm">
                      <FiEdit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <FiTrash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
