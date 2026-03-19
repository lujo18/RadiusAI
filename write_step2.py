#!/usr/bin/env python3
# Write Step2TemplateEditor.tsx file

output_path = r'c:\Users\asplo\Projects\Main\SlideForge\frontend\src\components\TemplateCreator\Step2TemplateEditor.tsx'

content = '''"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Braces, LayoutList, AlertCircle } from "lucide-react";
import { DynamicJSONForm } from "./DynamicJSONForm";
import { cn } from "@/lib/utils";

interface Step2TemplateEditorProps {
  formData: {
    name: string;
    category: string;
    status: string;
    favorite: boolean;
    is_default: boolean;
    tags: string[];
    content_rules: any;
  };
  onInputChange: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
  isTemplateCreation?: boolean;
  templateUsage?: { template_count?: number; template_limit?: number | null; remaining?: number | null };
}

export default function Step2TemplateEditor({
  formData,
  onInputChange,
  onSave,
  onCancel,
  isEditing = false,
  isLoading = false,
  isTemplateCreation = false,
  templateUsage,
}: Step2TemplateEditorProps) {
  const isTemplateLimitReached =
    !isEditing &&
    isTemplateCreation &&
    templateUsage?.template_limit !== null &&
    (templateUsage?.remaining ?? 0) <= 0;

  const [rawMode, setRawMode] = useState(false);
  const [rawJson, setRawJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync rawJson when switching to raw mode
  useEffect(() => {
    if (rawMode) {
      setRawJson(
        JSON.stringify(
          formData.content_rules && Object.keys(formData.content_rules).length > 0
            ? formData.content_rules
            : {},
          null,
          2
        )
      );
      setJsonError(null);
    }
  }, [rawMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRawChange = (text: string) => {
    setRawJson(text);
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        setJsonError(null);
        onInputChange("content_rules", parsed);
      } else {
        setJsonError("Root value must be a JSON object {}");
      }
    } catch {
      setJsonError("Invalid JSON - fix syntax errors to save");
    }
  };

  const handleTagsChange = (value: string) => {
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    onInputChange("tags", tags);
  };

  // Use whatever is in content_rules - no forced empty structure
  const contentRules =
    formData.content_rules &&
    typeof formData.content_rules === "object" &&
    !Array.isArray(formData.content_rules)
      ? (formData.content_rules as Record<string, unknown>)
      : {};

  return (
    <div className="flex flex-col h-full max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-background shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          className="gap-1.5 h-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-lg font-semibold text-foreground">
          {isEditing ? "Edit Template" : "New Template"}
        </h1>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid lg:grid-cols-[320px_1fr] gap-0 min-h-full">

          {/* Left column - meta / settings */}
          <div className="p-6 space-y-4 border-r border-border lg:overflow-y-auto">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="tpl-name" className="text-sm">Template Name</Label>
                  <Input
                    id="tpl-name"
                    value={formData.name}
                    onChange={(e) => onInputChange("name", e.target.value)}
                    placeholder="e.g., 5-Step Tutorial"
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="tpl-category" className="text-sm">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => onInputChange("category", v)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="tpl-category" className="h-9">
                      <SelectValue placeholder="Pick a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="transformation">Transformation</SelectItem>
                      <SelectItem value="myth-busting">Myth-Busting</SelectItem>
                      <SelectItem value="comparison">Comparison</SelectItem>
                      <SelectItem value="authority">Authority</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="curation">Curation</SelectItem>
                      <SelectItem value="utility">Utility</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="reach">Reach</SelectItem>
                      <SelectItem value="pattern">Pattern</SelectItem>
                      <SelectItem value="checklist">Checklist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="tpl-status" className="text-sm">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => onInputChange("status", v)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="tpl-status" className="h-9">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="tpl-tags" className="text-sm">Tags</Label>
                  <Input
                    id="tpl-tags"
                    value={formData.tags.join(", ")}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="trending, viral, seasonal..."
                    disabled={isLoading}
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated</p>
                </div>
              </CardContent>
            </Card>

            {/* Settings toggles */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium leading-none">Favourite</p>
                    <p className="text-xs text-muted-foreground mt-1">Pin to quick access</p>
                  </div>
                  <Switch
                    checked={formData.favorite}
                    onCheckedChange={(v) => onInputChange("favorite", v)}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium leading-none">Default template</p>
                    <p className="text-xs text-muted-foreground mt-1">Used for new posts</p>
                  </div>
                  <Switch
                    checked={formData.is_default}
                    onCheckedChange={(v) => onInputChange("is_default", v)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - content rules */}
          <div className="p-6 space-y-4">
            {/* Mode toggle */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Content Rules</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setRawMode((p) => !p)}
              >
                {rawMode ? (
                  <><LayoutList className="w-3.5 h-3.5" /> Visual Editor</>
                ) : (
                  <><Braces className="w-3.5 h-3.5" /> Raw JSON</>
                )}
              </Button>
            </div>

            {rawMode ? (
              <div className="space-y-2">
                <Textarea
                  value={rawJson}
                  onChange={(e) => handleRawChange(e.target.value)}
                  spellCheck={false}
                  rows={28}
                  className={cn(
                    "font-mono text-xs resize-none",
                    jsonError && "border-destructive focus-visible:ring-destructive"
                  )}
                  placeholder={`Paste any JSON object here, e.g. {"slides": [...]}`}
                />
                {jsonError && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {jsonError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Any valid JSON object structure is accepted - old and new schemas both work.
                </p>
              </div>
            ) : (
              <>
                {Object.keys(contentRules).length === 0 ? (
                  <Card>
                    <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
                      <Braces className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No content rules yet.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setRawMode(true)}
                      >
                        <Braces className="w-3.5 h-3.5" />
                        Paste JSON to get started
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <DynamicJSONForm
                    data={contentRules}
                    onChange={(rules) => onInputChange("content_rules", rules)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background shrink-0">
        <p className="text-sm text-muted-foreground">
          {isTemplateCreation && templateUsage?.template_limit !== null && (
            <>
              Templates used:{" "}
              <span className="font-semibold text-foreground">
                {templateUsage?.template_count ?? 0} / {templateUsage?.template_limit ?? "\u221e"}
              </span>
            </>
          )}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isLoading || !formData.name.trim() || isTemplateLimitReached || !!jsonError}
            title={
              isTemplateLimitReached
                ? "Template limit reached. Upgrade your plan to create more."
                : undefined
            }
            className="h-9 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </div>
    </div>
  );
}
'''

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"File written successfully to {output_path}")
