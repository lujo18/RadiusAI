"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Save, Loader2 } from "lucide-react";
import { DynamicJSONForm } from "./DynamicJSONForm";
import type { StyleConfig } from "./styleConfigTypes";
import { Dialog } from "@/components/animate-ui/components/radix/dialog";

export type TemplateCategory =
  | "educational"
  | "transformation"
  | "myth-busting"
  | "comparison"
  | "authority"
  | "lifestyle"
  | "community"
  | "curation"
  | "utility"
  | "growth"
  | "reach"
  | "pattern"
  | "checklist";

interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  status: "active" | "archived" | "testing";
  favorite: boolean;
  is_default: boolean;
  tags: string[];
  content_rules: Record<string, any>;
}

interface TemplateCreatorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (template: CreateTemplateInput) => void;
  isLoading?: boolean;
  existingTemplate?: Partial<CreateTemplateInput>;
}

const defaultStyleConfig: StyleConfig = {
  
};

export default function TemplateCreatorModal({
  visible,
  onClose,
  onSave,
  isLoading = false,
  existingTemplate,
}: TemplateCreatorProps) {
  const [formData, setFormData] = useState<CreateTemplateInput>({
    name: existingTemplate?.name || "",
    category: existingTemplate?.category || "educational",
    status: existingTemplate?.status || "active",
    favorite: existingTemplate?.favorite || false,
    is_default: existingTemplate?.is_default || false,
    tags: existingTemplate?.tags || [],
    content_rules: existingTemplate?.content_rules || {},
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTagsChange = (value: string) => {
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setFormData((prev) => ({
      ...prev,
      tags,
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-foreground">
            {existingTemplate ? "Edit Template" : "Create New Template"}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter template name"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value as TemplateCategory)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    handleInputChange("status", value as any)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
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
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(", ")}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="favorite">Favorite</Label>
                  <p className="text-sm text-muted-foreground">
                    Mark this template as a favorite
                  </p>
                </div>
                <Switch
                  id="favorite"
                  checked={formData.favorite}
                  onCheckedChange={(checked) =>
                    handleInputChange("favorite", checked)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_default">Default Template</Label>
                  <p className="text-sm text-muted-foreground">
                    Set this as the default template
                  </p>
                </div>
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_default", checked)
                  }
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Rules */}
          {Object.keys(formData.content_rules).length > 0 && (
            <DynamicJSONForm
              data={formData.content_rules as any}
              onChange={(rules) => handleInputChange("content_rules", rules)}
              title="Content Rules"
            />
          )}

        
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-6 border-t border-border sticky bottom-0 bg-background/95 backdrop-blur-sm">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !formData.name}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isLoading
              ? "Saving..."
              : existingTemplate
                ? "Update Template"
                : "Create Template"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
