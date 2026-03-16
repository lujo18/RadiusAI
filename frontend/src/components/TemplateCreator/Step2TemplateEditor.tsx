"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DynamicJSONForm } from "./DynamicJSONForm";
import { EMPTY_CONTENT_RULES } from "./emptyTemplate";

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

  const handleTagsChange = (value: string) => {
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    onInputChange("tags", tags);
  };

  // If content_rules is empty/null, seed with the empty template so all
  // fields show up as editable inputs right away.
  const contentRules =
    formData.content_rules &&
    Object.keys(formData.content_rules).length > 0
      ? formData.content_rules
      : EMPTY_CONTENT_RULES;

  return (
    <div className="flex flex-col h-full max-h-[90vh] overflow-hidden">
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€ Body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid lg:grid-cols-[320px_1fr] gap-0 min-h-full">

          {/* Left column â€” meta / settings */}
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
                    placeholder="trending, viral, seasonalâ€¦"
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

          {/* Right column â€” content rules */}
          <div className="p-6">
            <DynamicJSONForm
              data={contentRules}
              onChange={(rules) => onInputChange("content_rules", rules)}
              title="Content Rules"
            />
          </div>
        </div>
      </div>

      {/* â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background shrink-0">
        <p className="text-sm text-muted-foreground">
          {isTemplateCreation && templateUsage?.template_limit !== null && (
            <>
              Templates used:{" "}
              <span className="font-semibold text-foreground">
                {templateUsage?.template_count ?? 0} / {templateUsage?.template_limit ?? "âˆž"}
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
            disabled={isLoading || !formData.name.trim() || isTemplateLimitReached}
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

