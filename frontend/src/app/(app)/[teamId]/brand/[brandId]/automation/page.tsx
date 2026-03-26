"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useTemplates } from "@/features/templates/hooks";
import { useBrands } from "@/features/brand/hooks";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { Play, Pause, Trash2, ChevronRight } from "lucide-react";

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
import { AutomationWizard } from "@/components/automations/AutomationWizard";
import { useAutomations } from "@/features/automation/hooks";
import { Skeleton } from "@/components/ui/skeleton";

type PlatformIntegration =
  Database["public"]["Tables"]["platform_integrations"]["Row"];

type Automation = Database["public"]["Tables"]["automations"]["Row"] & {
  name?: string | null;
  description?: string | null;
};

export default function AutomationPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params?.brandId as string;
  const teamId = params?.teamId as string;

  // State management
  const [automationWizardOpen, setAutomationWizardOpen] = useState(false);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [automationsLoading, setAutomationsLoading] = useState(true);

  // Fetch automations for this brand
  useEffect(() => {
    const fetchAutomations = async () => {
      if (!brandId) return;
      try {
        const { data, error } = await supabase
          .from("automations")
          .select("*")
          .eq("brand_id", brandId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setAutomations(data || []);
      } catch (err) {
        console.error("Failed to fetch automations:", err);
      } finally {
        setAutomationsLoading(false);
      }
    };

    fetchAutomations();
  }, [brandId]);

  const handleEditAutomation = (automation: Automation) => {
    router.push(`/${teamId}/brand/${brandId}/automation/${automation.id}`);
  };

  const handleCloseWizard = (open: boolean) => {
    setAutomationWizardOpen(open);
  };

  const handleToggleActive = async (
    automationId: string,
    isActive: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("automations")
        .update({ is_active: !isActive })
        .eq("id", automationId);

      if (error) throw error;
      setAutomations((prev) =>
        prev.map((auto) =>
          auto.id === automationId ? { ...auto, is_active: !isActive } : auto,
        ),
      );
    } catch (err) {
      console.error("Failed to toggle automation:", err);
    }
  };

  const handleDeleteAutomation = async (automationId: string) => {
    if (!window.confirm("Are you sure you want to delete this automation?"))
      return;
    try {
      const { error } = await supabase
        .from("automations")
        .delete()
        .eq("id", automationId);

      if (error) throw error;
      setAutomations((prev) => prev.filter((auto) => auto.id !== automationId));
    } catch (err) {
      console.error("Failed to delete automation:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-10">
        <h1>
          Posting Automation
        </h1>
        <p className="lead">
          Set up automatic carousel generation and posting schedules
        </p>
      </div>

      <div className="mb-8 flex gap-4">
        <Button
          onClick={() => setAutomationWizardOpen(true)}
          disabled={automations.length >= 1}
        >
          Create Automation
        </Button>
        {automations.length >= 0 && (
          <Badge variant="outline" className="gap-2">
            <span className="muted">(Coming soon)</span> Create multiple automations for different social
            accounts
          </Badge>
        )}
      </div>

      {/* Automations List */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Your Automations
        </h2>

        {automationsLoading ? (
          <div className="text-center py-12">
            <p className="text-foreground/60">Loading automations...</p>
          </div>
        ) : automations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-foreground/60">
                No automations yet. Create one to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {automations.map((automation) => (
              <Card
                key={automation.id}
                className="hover:border-primary/50 transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {automation.name}
                      </CardTitle>
                      {automation.description && (
                        <CardDescription className="mt-1">
                          {automation.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge
                      variant={automation.is_active ? "default" : "secondary"}
                      className="ml-2 whitespace-nowrap"
                    >
                      {automation.is_active ? "Active" : "Paused"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Schedule Info */}
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-foreground/60">Templates</p>
                      <p className="font-medium">
                        {automation.template_ids?.length || 0} template(s)
                      </p>
                    </div>
                    <div>
                      <p className="text-foreground/60">Platforms</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {automation.platforms?.map((platform) => (
                          <Badge
                            key={platform}
                            variant="outline"
                            className="text-xs"
                          >
                            {platform.charAt(0).toUpperCase() +
                              platform.slice(1)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {automation.schedule && (
                      <div>
                        <p className="text-foreground/60">Schedule</p>
                        <p className="text-xs text-foreground/50">
                          {(() => {
                            const schedule = automation.schedule as Record<
                              string,
                              string[]
                            >;
                            const activeDays = Object.entries(schedule)
                              .filter(([, times]) => times && times.length > 0)
                              .map(
                                ([day]) =>
                                  day.charAt(0).toUpperCase() + day.slice(1),
                              );
                            return activeDays.length > 0
                              ? `${activeDays.slice(0, 3).join(", ")}${activeDays.length > 3 ? ` +${activeDays.length - 3}` : ""}`
                              : "No schedule";
                          })()}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={automation.is_active ? "default" : "outline"}
                      onClick={() =>
                        handleToggleActive(
                          automation.id,
                          automation.is_active ?? false,
                        )
                      }
                      className="flex-1"
                    >
                      {automation.is_active ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEditAutomation(automation)}
                    >
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteAutomation(automation.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-foreground/5 p-2">
                      <p className="text-foreground/60">Posts Created</p>
                      <p className="font-semibold text-foreground">
                        {automation.error_count || 0}
                      </p>
                    </div>
                    <div className="rounded bg-foreground/5 p-2">
                      <p className="text-foreground/60">Errors</p>
                      <p className="font-semibold text-foreground">
                        {automation.error_count || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AutomationWizard
        isOpen={automationWizardOpen}
        onOpenChange={handleCloseWizard}
        brandId={brandId}
        onSuccess={() => {
          // Refresh automations list after creation
          setAutomationsLoading(true);
          supabase
            .from("automations")
            .select("*")
            .eq("brand_id", brandId)
            .order("created_at", { ascending: false })
            .then(({ data }) => {
              setAutomations(data || []);
              setAutomationsLoading(false);
            });
        }}
      />
    </div>
  );
}
