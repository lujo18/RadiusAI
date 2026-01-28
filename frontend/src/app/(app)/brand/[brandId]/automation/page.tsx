"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTemplates, useBrands } from "@/lib/api/hooks";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type PlatformIntegration = Database["public"]["Tables"]["platform_integrations"]["Row"];

const POSTING_TIMES = [
  { label: "6:00 AM", value: "06:00" },
  { label: "9:00 AM", value: "09:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "3:00 PM", value: "15:00" },
  { label: "6:00 PM", value: "18:00" },
  { label: "9:00 PM", value: "21:00" },
];

const DAYS_OF_WEEK = [
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
  { label: "Sunday", value: "sunday" },
];

export default function AutomationPage() {
  const params = useParams();
  const brandId = params?.brandId as string;

  // Data fetching
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { data: brands } = useBrands();
  const [platformAccounts, setPlatformAccounts] = useState<PlatformIntegration[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  // State management
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Fetch platform integrations for this brand
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!brandId) return;
      try {
        const { data, error } = await supabase
          .from("platform_integrations")
          .select("*")
          .eq("brand_id", brandId);

        if (error) throw error;
        setPlatformAccounts(data || []);
        if (data && data.length > 0) {
          setSelectedAccount(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch platform accounts:", err);
      } finally {
        setAccountsLoading(false);
      }
    };

    fetchAccounts();
  }, [brandId]);

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!selectedTemplates.length) {
      alert("Please select at least one template");
      return;
    }
    if (!selectedDays.length) {
      alert("Please select at least one day to post");
      return;
    }
    if (!selectedAccount) {
      alert("Please select a social media account");
      return;
    }

    setSaveLoading(true);
    try {
      // Here you would save the automation settings to your database
      // For now, just log the configuration
      console.log("Automation Settings:", {
        brandId,
        selectedTemplates,
        selectedDays,
        selectedTime,
        selectedAccount,
      });

      alert("Automation settings saved successfully!");
    } catch (err) {
      console.error("Failed to save automation settings:", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const currentBrand = brands?.find((b) => b.id === brandId);
  const selectedAccountData = platformAccounts.find((a) => a.id === selectedAccount);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Posting Automation
          </h1>
          <p className="text-foreground/60">
            Set up automatic carousel generation and posting schedules
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selection */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Select Templates for Rotation</CardTitle>
                <CardDescription>
                  Choose which templates to use for generating carousels. The system will rotate through these templates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templatesLoading ? (
                    <p className="text-sm text-foreground/50">Loading templates...</p>
                  ) : templates && templates.length > 0 ? (
                    templates.map((template) => (
                      <div key={template.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`template-${template.id}`}
                          checked={selectedTemplates.includes(template.id)}
                          onCheckedChange={() => handleTemplateToggle(template.id)}
                        />
                        <label
                          htmlFor={`template-${template.id}`}
                          className="flex-1 cursor-pointer text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
                        >
                          {template.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-foreground/50">
                      No templates available. Create one to get started.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Schedule Configuration */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Posting Schedule</CardTitle>
                <CardDescription>
                  Select which days and times you want to post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Days Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Days to Post
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center space-x-3">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={selectedDays.includes(day.value)}
                          onCheckedChange={() => handleDayToggle(day.value)}
                        />
                        <label
                          htmlFor={`day-${day.value}`}
                          className="cursor-pointer text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
                        >
                          {day.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Time Selection */}
                <div>
                  <Label htmlFor="time-select" className="text-base font-semibold mb-3 block">
                    Posting Time
                  </Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger id="time-select" className="w-full">
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSTING_TIMES.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-foreground/50 mt-2">
                    All posts will be scheduled for the selected time on their respective days
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Social Account Selection */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Active Account</CardTitle>
                <CardDescription>Select where to post</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {accountsLoading ? (
                  <p className="text-sm text-foreground/50">Loading accounts...</p>
                ) : platformAccounts.length > 0 ? (
                  <>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {platformAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium capitalize">
                                {account.platform}
                              </span>
                              <span className="text-xs text-foreground/60">
                                @{account.username}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Account Details */}
                    {selectedAccountData && (
                      <div className="space-y-3 pt-2 border-t border-border/50">
                        {selectedAccountData.profile_picture_url && (
                          <img
                            src={selectedAccountData.profile_picture_url}
                            alt={selectedAccountData.username}
                            className="w-12 h-12 rounded-full"
                          />
                        )}
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {selectedAccountData.full_name || "Unnamed Account"}
                          </p>
                          <p className="text-xs text-foreground/60">
                            @{selectedAccountData.username}
                          </p>
                          <div className="flex gap-2 text-xs text-foreground/50 pt-2">
                            <span>{selectedAccountData.followers_count || 0} followers</span>
                          </div>
                        </div>
                        {selectedAccountData.is_business_account && (
                          <Badge variant="secondary" className="text-xs">
                            Business Account
                          </Badge>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-foreground/50">
                    No connected accounts. Please connect a social media account first.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Configuration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-foreground/60">Templates Selected</p>
                  <p className="font-medium text-foreground">
                    {selectedTemplates.length} of {templates?.length || 0}
                  </p>
                </div>
                <Separator className="bg-border/50" />
                <div>
                  <p className="text-foreground/60">Days Active</p>
                  <p className="font-medium text-foreground">
                    {selectedDays.length > 0 ? selectedDays.length : 0} days
                  </p>
                </div>
                <Separator className="bg-border/50" />
                <div>
                  <p className="text-foreground/60">Posting Time</p>
                  <p className="font-medium text-foreground">
                    {POSTING_TIMES.find((t) => t.value === selectedTime)?.label || "Not set"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={
                saveLoading || 
                selectedTemplates.length === 0 || 
                selectedDays.length === 0 ||
                !selectedAccount
              }
              className="w-full bg-primary hover:bg-primary/80 text-background shadow-lg hover:shadow-primary/50"
              size="lg"
            >
              {saveLoading ? "Saving..." : "Save Automation Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
