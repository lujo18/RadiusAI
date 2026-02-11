"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, addDays, startOfDay, addHours, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useScheduledPosts } from '@/features/posts/hooks';
import { convertToLocalTime } from "@/lib/time";

type ScheduledPost = {
  id: string;
  scheduled_time: string | null;
  content?: any;
  [key: string]: any; // Allow any other fields from the database
};

type TimeBlockProps = {
  date: Date;
  hour: number;
  isSelected: boolean;
  isOccupied: boolean;
  occupiedPost?: ScheduledPost;
  onClick: (date: Date, hour: number) => void;
  disabled?: boolean;
};

const TimeBlock = ({ 
  date, 
  hour, 
  isSelected, 
  isOccupied, 
  occupiedPost, 
  onClick, 
  disabled = false 
}: TimeBlockProps) => {
  const timeString = convertToLocalTime(`${String(hour).padStart(2, '0')}:00`);
  const shouldDisable = disabled || isOccupied;
  
  return (
    <Card 
      className={`
        p-2 cursor-pointer transition-all duration-200
        ${shouldDisable ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:bg-muted/50'}
        ${isSelected && !isOccupied ? 'ring-2 ring-primary bg-primary/10' : ''}
        ${isOccupied ? 'bg-red-100 border-2 border-red-300 shadow-sm' : ''}
      `}
      onClick={() => !shouldDisable && onClick(date, hour)}
    >
      <div className="text-xs font-medium">{timeString}</div>
      {isOccupied && occupiedPost && (
        <div className="mt-1">
          <Badge variant="destructive" className="text-xs bg-red-600">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
          <div className="text-xs text-red-700 mt-1 truncate font-medium">
            {occupiedPost.content?.title || occupiedPost.content?.caption || 'Scheduled Post'}
          </div>
        </div>
      )}
    </Card>
  );
};

type TimeBlockSchedulerProps = {
  selectedDateTime?: Date;
  onTimeSelect: (dateTime: Date) => void;
  brandId?: string;
  className?: string;
};

export const TimeBlockScheduler = ({ 
  selectedDateTime, 
  onTimeSelect, 
  brandId,
  className = "" 
}: TimeBlockSchedulerProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewDays, setViewDays] = useState(7); // Number of days to show

  // Calculate 30-day window for querying (stays fixed unless pagination moves outside)
  const { fromDate, toDate } = useMemo(() => {
    const start = startOfDay(currentDate);
    const end = addDays(start, 30);
    return { fromDate: start, toDate: end };
  }, [
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  ]);

  // Fetch scheduled posts for the 30-day window
  const { data: scheduledPosts = [], isLoading, error } = useScheduledPosts(
    fromDate,
    toDate,
    brandId
  );

  // Generate time slots (9 AM to 9 PM)
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 9); // 9 to 21

  // Check if a time slot is occupied
  const isTimeOccupied = (date: Date, hour: number) => {
    const targetDateTime = addHours(startOfDay(date), hour);
    return scheduledPosts.some((post: any) => {
      if (!post.scheduled_time) return false;
      // Convert UTC database time to local timezone
      const postTime = new Date(post.scheduled_time);
      // Get the hour in the user's local timezone
      const postHour = postTime.getHours();
      const postDate = new Date(postTime.getFullYear(), postTime.getMonth(), postTime.getDate());
      const targetHour = addHours(startOfDay(date), hour);
      
      // Compare: same day in local timezone AND same hour (within 1 hour window)
      const isSameLocalDay = postDate.toDateString() === date.toDateString();
      const isWithinHour = Math.abs(postHour - hour) === 0;
      
      return isSameLocalDay && isWithinHour;
    });
  };

  // Get occupied post for a time slot
  const getOccupiedPost = (date: Date, hour: number): ScheduledPost | undefined => {
    return scheduledPosts.find((post: any) => {
      if (!post.scheduled_time) return false;
      // Convert UTC database time to local timezone
      const postTime = new Date(post.scheduled_time);
      // Get the hour in the user's local timezone
      const postHour = postTime.getHours();
      const postDate = new Date(postTime.getFullYear(), postTime.getMonth(), postTime.getDate());
      
      // Compare: same day in local timezone AND same hour
      const isSameLocalDay = postDate.toDateString() === date.toDateString();
      const isWithinHour = Math.abs(postHour - hour) === 0;
      
      return isSameLocalDay && isWithinHour;
    });
  };

  // Check if a time slot is selected
  const isTimeSelected = (date: Date, hour: number) => {
    if (!selectedDateTime) return false;
    const targetDateTime = addHours(startOfDay(date), hour);
    return Math.abs(selectedDateTime.getTime() - targetDateTime.getTime()) < 3600000;
  };

  // Check if a time slot is in the past
  const isTimeInPast = (date: Date, hour: number) => {
    const targetDateTime = addHours(startOfDay(date), hour);
    return targetDateTime < new Date();
  };

  const nextWeek = () => {
    setCurrentDate(prev => {
      const next = addDays(prev, 7);
      // If moving beyond current 30-day window, the useMemo will trigger a new query
      return next;
    });
  };

  const prevWeek = () => {
    setCurrentDate(prev => {
      const next = addDays(prev, -7);
      // If moving beyond current 30-day window, the useMemo will trigger a new query
      return next;
    });
  };

  const handleTimeClick = (date: Date, hour: number) => {
    const selectedTime = addHours(startOfDay(date), hour);
    onTimeSelect(selectedTime);
  };

  const days = Array.from({ length: viewDays }, (_, i) => addDays(startOfDay(currentDate), i));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading scheduled times...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600">Error loading scheduled posts: {error.message}</p>
        </div>
      )}

      {/* Calendar view */}
      {!isLoading && !error && (
        <>
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={prevWeek}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous Week
            </Button>
            <h3 className="font-medium">
              {format(currentDate, 'MMM d')} - {format(addDays(currentDate, viewDays - 1), 'MMM d, yyyy')}
            </h3>
            <Button variant="outline" size="sm" onClick={nextWeek}>
              Next Week
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-8 gap-2">
            {/* Header row with time labels */}
            <div className="font-medium text-sm text-muted-foreground">Time</div>
            {days.map(day => (
              <div key={day.toISOString()} className="font-medium text-sm text-center">
                <div>{format(day, 'EEE')}</div>
                <div className="text-xs text-muted-foreground">{format(day, 'MMM d')}</div>
              </div>
            ))}

            {/* Time slots */}
            {timeSlots.map(hour => (
              <React.Fragment key={hour}>
                <div className="text-sm text-muted-foreground py-2">
                  {convertToLocalTime(`${String(hour).padStart(2, '0')}:00`)}
                </div>
                {days.map(day => {
                  const isOccupied = isTimeOccupied(day, hour);
                  const occupiedPost = getOccupiedPost(day, hour);
                  const isSelected = isTimeSelected(day, hour);
                  const isPast = isTimeInPast(day, hour);

                  return (
                    <TimeBlock
                      key={`${day.toISOString()}-${hour}`}
                      date={day}
                      hour={hour}
                      isSelected={isSelected}
                      isOccupied={isOccupied}
                      occupiedPost={occupiedPost}
                      onClick={handleTimeClick}
                      disabled={isPast || isOccupied}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {selectedDateTime && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="font-medium">Selected Time:</div>
              <div className="text-sm text-muted-foreground">
                {format(selectedDateTime, 'EEEE, MMMM d, yyyy')} at {convertToLocalTime(format(selectedDateTime, 'HH:mm'))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};