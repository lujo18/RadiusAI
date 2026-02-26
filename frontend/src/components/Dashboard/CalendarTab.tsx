import React, { useState, useMemo } from "react";
import { FiClock } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeBlockScheduler } from "@/components/scheduling/TimeBlockScheduler";
import { useAutomations } from "@/features/automation/hooks";

interface CalendarTabProps {
  upcomingPosts: any[];
  brandId?: string;
}

export default function CalendarTab({
  upcomingPosts,
  brandId,
}: CalendarTabProps) {
  const [selectedDateTime, setSelectedDateTime] = useState<Date>();

  // Fetch automations for the brand
  const { data: automations = [] } = useAutomations(brandId);

  // Merge all automation schedules for the brand
  const mergedAutomationSchedule = useMemo(() => {
    const merged: Record<string, string[]> = {};

    automations.forEach((automation: any) => {
      if (automation.schedule && typeof automation.schedule === "object") {
        Object.entries(automation.schedule as Record<string, string[]>).forEach(
          ([day, times]) => {
            if (!merged[day]) {
              merged[day] = [];
            }
            // Add unique times only
            times.forEach((time: string) => {
              if (!merged[day].includes(time)) {
                merged[day].push(time);
              }
            });
          },
        );
      }
    });

    return merged;
  }, [automations]);

  const handleTimeSelect = (dateTime: Date) => {
    setSelectedDateTime(dateTime);
    // Could open posting modal or navigate to post creation
    console.log("Selected time slot:", dateTime);
  };

  return (
    <div className="p-4">
      <h1>Content Calendar</h1>

      <Tabs defaultValue="scheduler" className="w-full">
        {/* <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Monthly Calendar</TabsTrigger>
          <TabsTrigger value="scheduler">Time Block Scheduler</TabsTrigger>
        </TabsList>
         */}
        <TabsContent value="calendar" className="mt-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">November 2025</h2>
              <div className="flex gap-2">
                <Button variant="secondary">Previous</Button>
                <Button variant="secondary">Next</Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-gray-400 pb-2"
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  className="aspect-square bg-gray-900/50 rounded-lg p-2 hover:bg-gray-700 cursor-pointer"
                >
                  <div className="text-sm mb-1">{day}</div>
                  {day % 7 !== 0 && (
                    <div className="space-y-1">
                      <div className="text-xs bg-pink-500/20 text-pink-400 px-1 rounded">
                        7 IG
                      </div>
                      <div className="text-xs bg-blue-500/20 text-blue-400 px-1 rounded">
                        7 TT
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">All Scheduled Posts</h2>
            <div className="space-y-3">
              {upcomingPosts.map((post: any) => (
                <PostRow key={post.id} post={post} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scheduler" className="mt-6">
          <div className="p-6">
            

            <TimeBlockScheduler
              selectedDateTime={selectedDateTime}
              onTimeSelect={handleTimeSelect}
              brandId={brandId}
              automationSchedule={mergedAutomationSchedule}
              
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PostRow({ post }: any) {
  return (
    <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg">
      <div className="flex items-center gap-3">
        <FiClock className="text-gray-400" />
        <span className="text-sm">{post.time}</span>
        <span className="text-sm text-gray-400">{post.platform}</span>
        <span className="text-sm">{post.title}</span>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">
          Edit
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive">
          Delete
        </Button>
      </div>
    </div>
  );
}
