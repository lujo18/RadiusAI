"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { DynamicJSONForm } from "./DynamicJSONForm";

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
  const isTemplateLimitReached = !isEditing && isTemplateCreation && templateUsage?.template_limit !== null && (templateUsage?.remaining ?? 0) <= 0;
  const handleTagsChange = (value: string) => {
    const tags = value.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
    onInputChange("tags", tags);
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-border sticky top-0 bg-background z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          className="gap-2 h-9"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground flex-1">
          {isEditing ? "Edit Template" : "Create Template"}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-sm">
                  Template Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => onInputChange("name", e.target.value)}
                  placeholder="Enter template name"
                  disabled={isLoading}
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-sm">
                  Category
                </Label>
                <Select value={formData.category} onValueChange={(value) => onInputChange("category", value)} disabled={isLoading}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="listicle">Listicle</SelectItem>
                    <SelectItem value="quote">Bold Quotes</SelectItem>
                    <SelectItem value="story">Story Arc</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="comparison">Comparison</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status" className="text-sm">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => onInputChange("status", value)} disabled={isLoading}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags" className="text-sm">
                  Tags (comma-separated)
                </Label>
                <Input
                  id="tags"
                  value={formData.tags.join(", ")}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="e.g., trending, viral, seasonal"
                  disabled={isLoading}
                  className="h-9 mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Favorite</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mark for quick access
                  </p>
                </div>
                <Switch
                  checked={formData.favorite}
                  onCheckedChange={(value) => onInputChange("favorite", value)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Default Template</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use for new posts by default
                  </p>
                </div>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(value) => onInputChange("is_default", value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Rules */}
          {formData.content_rules && (
            <DynamicJSONForm
              data={formData.content_rules as any}
              onChange={(rules) => onInputChange("content_rules", rules)}
              title="Content Rules"
            />
          )}

         
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center p-6 border-t border-border sticky bottom-0 bg-background">
        <div className="text-sm text-muted-foreground">
          {isTemplateCreation && templateUsage?.template_limit !== null && (
            <span>
              Templates: <span className="font-semibold text-foreground">{templateUsage?.template_count || 0}/{templateUsage?.template_limit || '∞'}</span>
            </span>
          )}
        </div>
        <div className="flex justify-end gap-3">
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
            title={isTemplateLimitReached ? 'Template limit reached. Upgrade your plan to create more templates.' : ''}
            className="gap-2 h-9 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
