"use client"

import React from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TikTokDisclosureSettings {
  is_ai_generated: boolean;
  brand_content_toggle: boolean;
  brand_organic_toggle: boolean;
  disable_duet: boolean;
  disable_stitch: boolean;
  disable_comment: boolean;
  privacy_level: "PUBLIC" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
}

interface TikTokDisclosureOptionsProps {
  settings: TikTokDisclosureSettings;
  onChange: (settings: TikTokDisclosureSettings) => void;
}

export function TikTokDisclosureOptions({
  settings,
  onChange,
}: TikTokDisclosureOptionsProps) {
  const toggleBool = (key: keyof Omit<TikTokDisclosureSettings, "privacy_level">) => {
    onChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  const togglePrivacy = (level: "PUBLIC" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY") => {
    onChange({
      ...settings,
      privacy_level: level,
    });
  };

  const disclosureOptions = [
    {
      key: "is_ai_generated" as const,
      label: "AI-Generated Content",
      description: "Disclose that this content was generated using AI",
      tooltip: "When enabled, TikTok will label this post as AI-generated per FTC guidelines",
    },
    {
      key: "brand_content_toggle" as const,
      label: "Brand/Sponsored Content",
      description: "Disclose brand partnerships or sponsored content",
      tooltip: "When enabled, marks this post as branded or sponsored content",
    },
    {
      key: "brand_organic_toggle" as const,
      label: "Organic Brand Content",
      description: "Organic content created with brand collaboration",
      tooltip: "When enabled, marks this as organic but brand-related content",
    },
  ];

  const engagementControls = [
    {
      key: "disable_duet" as const,
      label: "Disable Duets",
      description: "Prevent users from creating duets with this video",
      tooltip: "When enabled, viewers cannot create duets with your post",
    },
    {
      key: "disable_stitch" as const,
      label: "Disable Stitches",
      description: "Prevent users from stitching this video",
      tooltip: "When enabled, viewers cannot stitch your post into their videos",
    },
    {
      key: "disable_comment" as const,
      label: "Disable Comments",
      description: "Turn off comments on this post",
      tooltip: "When enabled, viewers cannot comment on your post",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Content Disclosure Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold">Content Disclosure</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Disclose content origin per FTC guidelines</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="space-y-3">
          {disclosureOptions.map((option) => (
            <Card key={option.key} className="p-4 border border-border/50 bg-card/50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label 
                      className="font-medium text-sm cursor-pointer"
                      htmlFor={option.key}
                    >
                      {option.label}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{option.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    id={option.key}
                    checked={settings[option.key]}
                    onCheckedChange={() => toggleBool(option.key)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Engagement Controls Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold">Engagement Controls</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Control how users can interact with your post</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="space-y-3">
          {engagementControls.map((option) => (
            <Card key={option.key} className="p-4 border border-border/50 bg-card/50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label 
                      className="font-medium text-sm cursor-pointer"
                      htmlFor={option.key}
                    >
                      {option.label}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{option.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    id={option.key}
                    checked={settings[option.key]}
                    onCheckedChange={() => toggleBool(option.key)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Privacy Level Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold">Privacy Level</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Control who can see this post</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "PUBLIC" as const, label: "Public", description: "Everyone can see" },
            { value: "MUTUAL_FOLLOW_FRIENDS" as const, label: "Friends", description: "Followers only" },
            { value: "SELF_ONLY" as const, label: "Private", description: "Only you" },
          ].map((option) => (
            <Card
              key={option.value}
              className={`p-3 cursor-pointer transition-all border-2 ${
                settings.privacy_level === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border/50 bg-card/50 hover:border-border"
              }`}
              onClick={() => togglePrivacy(option.value)}
            >
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {option.description}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
