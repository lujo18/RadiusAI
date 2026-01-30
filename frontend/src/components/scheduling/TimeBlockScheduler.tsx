"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, addDays, startOfDay, addHours, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

type ScheduledPost = {
  id: string;
  scheduled_time: string;
  content: {
    title?: string;
    caption?: string;
  };
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
  const timeString = format(addHours(startOfDay(date), hour), 'HH:mm');
  
  return (
    <Card 
      className={`
        p-2 cursor-pointer transition-all duration-200 hover:shadow-md
        ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''}
        ${isOccupied ? 'bg-red-50 border-red-200' : 'hover:bg-muted/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={() => !disabled && onClick(date, hour)}
    >
      <div className="text-xs font-medium">{timeString}</div>
      {isOccupied && occupiedPost && (
        <div className="mt-1">
          <Badge variant="destructive" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Occupied
          </Badge>
          <div className="text-xs text-muted-foreground mt-1 truncate">
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
  scheduledPosts?: ScheduledPost[];
  className?: string;
};

export const TimeBlockScheduler = ({ 
  selectedDateTime, 
  onTimeSelect, 
  scheduledPosts = [],
  className = "" 
}: TimeBlockSchedulerProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewDays, setViewDays] = useState(7); // Number of days to show

  // Generate time slots (9 AM to 9 PM)
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 9); // 9 to 21

  // Check if a time slot is occupied
  const isTimeOccupied = (date: Date, hour: number) => {
    const targetDateTime = addHours(startOfDay(date), hour);
    return scheduledPosts.some(post => {
      if (!post.scheduled_time) return false;
      const postTime = new Date(post.scheduled_time);
      return Math.abs(postTime.getTime() - targetDateTime.getTime()) < 3600000; // Within 1 hour
    });
  };

  // Get occupied post for a time slot
  const getOccupiedPost = (date: Date, hour: number): ScheduledPost | undefined => {
    const targetDateTime = addHours(startOfDay(date), hour);
    return scheduledPosts.find(post => {
      if (!post.scheduled_time) return false;
      const postTime = new Date(post.scheduled_time);
      return Math.abs(postTime.getTime() - targetDateTime.getTime()) < 3600000;
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
    setCurrentDate(prev => addDays(prev, 7));
  };

  const prevWeek = () => {
    setCurrentDate(prev => addDays(prev, -7));
  };

  const handleTimeClick = (date: Date, hour: number) => {
    const selectedTime = addHours(startOfDay(date), hour);
    onTimeSelect(selectedTime);
  };

  const days = Array.from({ length: viewDays }, (_, i) => addDays(startOfDay(currentDate), i));

  return (
    <div className={`space-y-4 ${className}`}>
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
              {format(addHours(startOfDay(new Date()), hour), 'HH:mm')}
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
                  disabled={isPast}
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
            {format(selectedDateTime, 'EEEE, MMMM d, yyyy \'at\' HH:mm')}
          </div>
        </div>
      )}
    </div>
  );
};