"use client"

import React from "react";
import { useTemplates } from "@/features/templates/hooks";
import { useBrandCtas } from "@/features/brand_ctas/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { compareToWeekday, convertToLocalTime, getTimeUntil } from "@/lib/time";
import type { AutomationWizardData } from "../AutomationWizard";

interface Step6Props {
  data: AutomationWizardData;
  onChange: (data: AutomationWizardData) => void;
}

export function AutomationWizardStep6({ data }: Step6Props) {
  const { data: templates } = useTemplates("");
  const { data: ctas } = useBrandCtas(data.brandId);

  const selectedTemplates =
    (templates as any[])?.filter((t: any) => data.templateIds.includes(t.id)) ||
    [];

  const selectedCtas =
    (ctas as any[])?.filter((c: any) => data.ctaIds.includes(c.id)) || [];

  const getNextRunDate = () => {
    const weekdays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayLabels: Record<string, string> = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    };

    for (const day of weekdays) {
      const times = data.schedule[day as keyof typeof data.schedule] || [];
      if (times.length > 0 && compareToWeekday(day) != "after") {
        for (const time of times) {
          if (!getTimeUntil(time).isPast) {
            return `${dayLabels[day]} at ${convertToLocalTime(time)}`;
          }
        }
      }
    }

    return "Not scheduled";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
        <h3 className="font-semibold text-primary mb-2">Ready to Create</h3>
        <p className="text-sm text-foreground/80">
          Review your automation details below. Click "Create Automation" to get
          started!
        </p>
      </div>

      {/* Basic Info */}
      <div className="space-y-3">
        <h4 className="font-medium">Automation Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-foreground/60">Name</span>
            <span className="font-medium">{data.name}</span>
          </div>
          {data.description && (
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-foreground/60">Description</span>
              <span className="font-medium text-right max-w-xs">
                {data.description}
              </span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-foreground/60">Posting mode</span>
            <span className="font-medium">
              {!data.postAutomatically
                ? "Save in Radius (manual publish)"
                : data.postAsDraft
                  ? "Auto publish as draft"
                  : "Auto publish directly"}
            </span>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="space-y-3">
        <h4 className="font-medium">
          Templates ({data.templateIds.length} selected)
        </h4>
        <div className="space-y-2">
          {selectedTemplates.length > 0 ? (
            selectedTemplates.map((template: any, idx: number) => (
              <div
                key={template.id}
                className="flex items-center gap-3 p-2 rounded bg-foreground/5"
              >
                <span className="text-xs font-medium w-6 text-center bg-primary/20 rounded px-2 py-1">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{template.name}</p>
                  <p className="text-xs text-foreground/60">
                    {template.category || "General"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <Skeleton className="h-12 w-full" />
          )}
        </div>
        <p className="text-xs text-foreground/60">
          Templates will rotate in this order with each automation run
        </p>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <h4 className="font-medium">
          Call-To-Actions ({data.ctaIds.length} selected)
        </h4>
        <div className="space-y-2">
          {selectedCtas.length > 0 ? (
            selectedCtas.map((cta: any, idx: number) => (
              <div
                key={cta.id}
                className="flex items-start gap-3 p-2 rounded bg-foreground/5"
              >
                <span className="text-xs font-medium w-6 text-center bg-primary/20 rounded px-2 py-1 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{cta.label}</p>
                  <p className="text-xs text-foreground/60 mt-1">
                    {cta.cta_text}
                  </p>
                  {cta.cta_url && (
                    <p className="text-xs text-foreground/50 mt-1 truncate">
                      {cta.cta_url}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <Skeleton className="h-12 w-full" />
          )}
        </div>
        <p className="text-xs text-foreground/60">
          CTAs will rotate in this order with each post generated
        </p>
      </div>

      {/* Platforms */}
      <div className="space-y-3">
        <h4 className="font-medium">
          Posting Accounts ({data.platforms.length} selected)
        </h4>
        <div className="flex flex-wrap gap-2">
          {data.platforms.map((platform) => (
            <span
              key={platform}
              className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium"
            >
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </span>
          ))}
        </div>
      </div>

      {/* TikTok Disclosure Settings */}
      <div className="space-y-3">
        <h4 className="font-medium">TikTok Disclosure Settings</h4>
        <div className="space-y-2 text-sm rounded-lg bg-foreground/5 border border-border p-4">
          <div className="flex justify-between">
            <span className="text-foreground/60">AI Generated</span>
            <span className="font-medium">{data.tiktokDisclosure.is_ai_generated ? "Yes" : "No"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60">Brand Content</span>
            <span className="font-medium">{data.tiktokDisclosure.brand_content_toggle ? "Disclosed" : "No"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60">Organic Brand</span>
            <span className="font-medium">{data.tiktokDisclosure.brand_organic_toggle ? "Yes" : "No"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60">Allow Duets</span>
            <span className="font-medium">{data.tiktokDisclosure.disable_duet ? "Disabled" : "Enabled"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60">Allow Stitches</span>
            <span className="font-medium">{data.tiktokDisclosure.disable_stitch ? "Disabled" : "Enabled"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60">Allow Comments</span>
            <span className="font-medium">{data.tiktokDisclosure.disable_comment ? "Disabled" : "Enabled"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60">Privacy Level</span>
            <span className="font-medium">{data.tiktokDisclosure.privacy_level}</span>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-3">
        <h4 className="font-medium">Posting Schedule</h4>
        <div className="space-y-2 text-sm">
          {(() => {
            const weekdays = [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ];
            const activeDays = weekdays.filter(
              (day) =>
                (data.schedule[day as keyof typeof data.schedule] || [])
                  .length > 0,
            );
            const totalPosts = weekdays.reduce(
              (sum, day) =>
                sum +
                (data.schedule[day as keyof typeof data.schedule] || []).length,
              0,
            );

            return (
              <>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-foreground/60">Active Days</span>
                  <span className="font-medium">{activeDays.length} days</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-foreground/60">Posts Per Week</span>
                  <span className="font-medium">{totalPosts} posts</span>
                </div>
              </>
            );
          })()}
          <div className="flex justify-between py-2">
            <span className="text-foreground/60">Next Run</span>
            <span className="font-medium">{getNextRunDate()}</span>
          </div>
        </div>
      </div>

      {/* Schedule Details */}
      <div className="rounded-lg bg-foreground/5 border border-border p-4 space-y-2">
        {(() => {
          const weekdays = [
            { id: "monday", label: "Monday" },
            { id: "tuesday", label: "Tuesday" },
            { id: "wednesday", label: "Wednesday" },
            { id: "thursday", label: "Thursday" },
            { id: "friday", label: "Friday" },
            { id: "saturday", label: "Saturday" },
            { id: "sunday", label: "Sunday" },
          ];

          return weekdays
            .filter(
              (day) =>
                (data.schedule[day.id as keyof typeof data.schedule] || [])
                  .length > 0,
            )
            .map((day) => {
              const times =
                data.schedule[day.id as keyof typeof data.schedule] || [];
              return (
                <p key={day.id} className="text-sm">
                  <strong>{day.label}:</strong>{" "}
                  {times.map((t) => convertToLocalTime(t)).join(", ")}
                </p>
              );
            });
        })()}
      </div>

      {/* Info */}
      <div className="rounded-lg bg-foreground/5 border border-border p-4 space-y-2">
        <h4 className="font-medium text-sm">After Creating</h4>
        <ul className="text-sm text-foreground/70 space-y-1">
          <li>Your automation will start running at the scheduled times</li>
          <li>You can pause, resume, or edit it anytime</li>
          <li>Monitor performance in the Analytics tab</li>
          <li>Adjust schedule or templates based on performance</li>
        </ul>
      </div>
    </div>
  );
}
