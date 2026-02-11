"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useTemplate, useUpdateTemplate } from "@/features/templates/hooks";
import { DynamicJSONForm } from "@/components/TemplateCreator/DynamicJSONForm";
import type { Template } from "@/components/TemplateCreator/contentTypes";

export default function TemplateEditPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const brandId = params.brandId as string;

  // Fetch template details
  const { data: template, isLoading, error } = useTemplate(templateId);
  const updateTemplateMutation = useUpdateTemplate();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    status: '',
    favorite: false,
    is_default: false,
    tags: [] as string[],
    content_rules: {} as any,
    style_config: null as any,
  });

  // Initialize form data when template loads
  useEffect(() => {
    if (template) {
      const t = template as any;
      setFormData({
        name: t.name || '',
        category: t.category || '',
        status: t.status || 'active',
        favorite: t.favorite || false,
        is_default: t.is_default || false,
        tags: t.tags || [],
        content_rules: t.content_rules || {},
        style_config: t.style_config || null,
      });
    }
  }, [template]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleSave = () => {
    updateTemplateMutation.mutate({
      templateId,
      updates: formData
    }, {
      onSuccess: () => {
        router.push(`/brand/${brandId}/template/${templateId}`);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load template</p>
          <Button onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit Template</h1>
      </div>

      <div className="space-y-6">
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
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter template name"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="listicle">Listicle</SelectItem>
                  <SelectItem value="quote">Quote</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
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
                value={formData.tags.join(', ')}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="tag1, tag2, tag3"
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
                <p className="text-sm text-muted-foreground">Mark this template as a favorite</p>
              </div>
              <Switch
                id="favorite"
                checked={formData.favorite}
                onCheckedChange={(checked) => handleInputChange('favorite', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_default">Default Template</Label>
                <p className="text-sm text-muted-foreground">Set this as the default template</p>
              </div>
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => handleInputChange('is_default', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Rules */}
        {Object.keys(formData.content_rules).length > 0 && (
          <DynamicJSONForm
            data={formData.content_rules}
            onChange={(rules) => handleInputChange('content_rules', rules)}
            title="Content Rules"
          />
        )}

        {/* Style Config */}
        {formData.style_config && Object.keys(formData.style_config).length > 0 && (
          <DynamicJSONForm
            data={formData.style_config}
            onChange={(config) => handleInputChange('style_config', config)}
            title="Style Configuration"
          />
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateTemplateMutation.isPending}
            className="flex items-center gap-2"
          >
            {updateTemplateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {updateTemplateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}