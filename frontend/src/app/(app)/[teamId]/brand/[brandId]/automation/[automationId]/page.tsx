"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { ArrowLeft, Play, Pause, Trash2, Calendar, Target, Zap } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomationWizard } from "@/components/automations/AutomationWizard";
import type { AutomationWizardData } from "@/components/automations/AutomationWizard";
import { AutomationPostsTab } from "@/components/automations/AutomationPostsTab";
import { convertToLocalTime } from "@/lib/time";

type Automation = Database["public"]["Tables"]["automations"]["Row"] & {
  name?: string | null;
  description?: string | null;
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AutomationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params?.brandId as string;
  const teamId = params?.teamId as string;
  const automationId = params?.automationId as string;

  const [automation, setAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [runHistory, setRunHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch automation details
  useEffect(() => {
    const fetchAutomation = async () => {
      if (!automationId) return;
      try {
        const { data, error } = await supabase
          .from("automations")
          .select("*")
          .eq("id", automationId)
          .eq("brand_id", brandId)
          .single();

        if (error) throw error;
        setAutomation(data as Automation);
      } catch (err) {
        console.error("Failed to fetch automation:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAutomation();
  }, [automationId, brandId]);

  // Fetch run history
  useEffect(() => {
    const fetchRunHistory = async () => {
      if (!automationId) return;
      setHistoryLoading(true);
      try {
        const { data, error } = await supabase
          .from("automation_runs")
          .select("*")
          .eq("automation_id", automationId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) {
          // Table might not exist yet, silently fail
          console.log("Run history not available yet");
          setRunHistory([]);
        } else {
          setRunHistory(data || []);
        }
      } catch (err) {
        console.log("Run history fetch failed:", err);
        setRunHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchRunHistory();
  }, [automationId]);

  const handleToggleActive = async () => {
    if (!automation) return;
    try {
      const { error } = await supabase
        .from("automations")
        .update({ is_active: !automation.is_active })
        .eq("id", automationId);

      if (error) throw error;
      setAutomation({ ...automation, is_active: !automation.is_active });
    } catch (err) {
      console.error("Failed to toggle automation:", err);
    }
  };

  const handleDeleteAutomation = async () => {
    if (!window.confirm("Are you sure you want to delete this automation? This action cannot be undone."))
      return;

    try {
      const { error } = await supabase
        .from("automations")
        .delete()
        .eq("id", automationId);

      if (error) throw error;
      router.push(`/${teamId}/brand/${brandId}/automation`);
    } catch (err) {
      console.error("Failed to delete automation:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center py-12">
          <p className="text-foreground/60">Loading automation...</p>
        </div>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center py-12">
          <p className="text-foreground/60">Automation not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {automation.name || "Untitled Automation"}
            </h1>
            {automation.description && (
              <p className="text-foreground/60">{automation.description}</p>
            )}
          </div>
          <Badge
            variant={automation.is_active ? "default" : "secondary"}
            className="text-base px-3 py-1"
          >
            {automation.is_active ? "Active" : "Paused"}
          </Badge>
        </div>
      </div>

      {isEditMode ? (
        // Edit Mode - Show full wizard
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Edit Automation</CardTitle>
          </CardHeader>
          <CardContent>
            <AutomationWizard
              isOpen={true}
              onOpenChange={(open) => {
                if (!open) setIsEditMode(false);
              }}
              brandId={brandId}
              onSuccess={async () => {
                // Refresh automation data
                const { data } = await supabase
                  .from("automations")
                  .select("*")
                  .eq("id", automationId)
                  .single();
                if (data) {
                  setAutomation(data as Automation);
                }
                setIsEditMode(false);
              }}
              initialData={{
                id: automation.id,
                name: automation.name || "",
                description: automation.description || "",
                brandId: automation.brand_id,
                templateIds: automation.template_ids || [],
                ctaIds: automation.cta_ids || [],
                platforms: (automation.platforms as Array<'instagram' | 'tiktok' | 'facebook' | 'linkedin'>) || [],
                postAutomatically: automation.post_automatically ?? false,
                postAsDraft: automation.post_as_draft ?? false,
                tiktokDisclosure: {
                  is_ai_generated: automation.is_ai_generated ?? false,
                  brand_content_toggle: automation.brand_content_toggle ?? false,
                  brand_organic_toggle: automation.brand_organic_toggle ?? false,
                  disable_duet: automation.disable_duet ?? false,
                  disable_stitch: automation.disable_stitch ?? false,
                  disable_comment: automation.disable_comment ?? false,
                  privacy_level: (automation.privacy_level as "PUBLIC" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY") || "PUBLIC",
                },
                schedule: (automation.schedule as Record<string, string[]>) || {},
                nextRunAt: automation.next_run_at,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
          <>
          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="w-4 h-4" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary mb-2">
                  {automation.template_ids?.length || 0}
                </p>
                <p className="text-sm text-foreground/60">
                  {automation.template_ids?.length === 1 ? "template" : "templates"} selected
                </p>
              </CardContent>
            </Card>

            {/* Platforms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-4 h-4" />
                  Platforms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {automation.platforms?.map((platform: string) => (
                    <Badge key={platform} variant="outline">
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Next Run */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-4 h-4" />
                  Next Run
                </CardTitle>
              </CardHeader>
              <CardContent>
                {automation.next_run_at ? (
                  <p className="text-sm font-mono">
                    {new Date(automation.next_run_at).toLocaleDateString()} at{" "}
                    {new Date(automation.next_run_at).toLocaleTimeString()}
                  </p>
                ) : (
                  <p className="text-sm text-foreground/60">Not scheduled</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Schedule Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                Posts scheduled across the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const lowerDay = day.toLowerCase();
                  const times = (automation.schedule as Record<string, string[]>)?.[lowerDay] || [];
                  return (
                    <div key={day} className="flex items-center justify-between py-2 px-3 rounded-lg bg-foreground/5">
                      <span className="font-medium text-foreground w-24">{day}</span>
                      {times.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {times.map((time: string) => (
                            <Badge key={time} variant="secondary">
                              {convertToLocalTime(time)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-foreground/50">No posts scheduled</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Run History */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Run History</CardTitle>
              <CardDescription>
                Last 20 automation runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <p className="text-foreground/60">Loading...</p>
              ) : runHistory.length === 0 ? (
                <p className="text-foreground/60 text-center py-6">No runs yet. Automation will start when scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {runHistory.map((run: any) => (
                    <div key={run.id} className="flex items-center justify-between py-3 px-3 rounded-lg bg-foreground/5 text-sm">
                      <div>
                        <p className="font-medium text-foreground">
                          {run.status?.charAt(0).toUpperCase() + run.status?.slice(1)}
                        </p>
                        <p className="text-foreground/60 text-xs">
                          {new Date(run.created_at).toLocaleDateString()} at{" "}
                          {new Date(run.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      {run.error_message && (
                        <p className="text-xs text-destructive text-right max-w-xs line-clamp-2">
                          Something went wrong on our end. Error reported.
                          {/* {run.error_message} */}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant={automation.is_active ? "default" : "outline"}
              onClick={handleToggleActive}
              size="lg"
            >
              {automation.is_active ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Automation
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume Automation
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditMode(true)}
              size="lg"
            >
              Edit Settings
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAutomation}
              size="lg"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
          </>
          </TabsContent>

          <TabsContent value="posts">
            <AutomationPostsTab
              automationId={automationId}
              brandId={brandId}
              teamId={teamId}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
