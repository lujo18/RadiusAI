"use client";

import React, { useState } from "react";
import {
  useSystemTemplates,
  useCreateSystemTemplate,
  useUpdateSystemTemplate,
  useDeleteSystemTemplate,
} from "@/lib/api/hooks/useSystemTemplates";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/animate-ui/primitives/radix/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";
import type { Database } from "@/types/database";

type SystemTemplate = Database["public"]["Tables"]["system_templates"]["Row"];

export default function SystemTemplatesPage() {
  const { data: templates = [], isLoading } = useSystemTemplates();
  const createMutation = useCreateSystemTemplate();
  const updateMutation = useUpdateSystemTemplate();
  const deleteMutation = useDeleteSystemTemplate();

  const [open, setOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SystemTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    style_config: {} as any,
    favorite: false,
    featured: false,
    recommended: false,
    is_experimental: false,
    tags: [] as string[],
  });
  const [tagsInput, setTagsInput] = useState("");

  const handleOpen = (template?: SystemTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        category: template.category,
        style_config: template.style_config,
        favorite: template.favorite,
        featured: template.featured ?? false,
        recommended: template.recommended ?? false,
        is_experimental: template.is_experimental ?? false,
        tags: template.tags ?? [],
      });
      setTagsInput((template.tags ?? []).join(", "));
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        category: "",
        style_config: {},
        favorite: false,
        featured: false,
        recommended: false,
        is_experimental: false,
        tags: [],
      });
      setTagsInput("");
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (editingTemplate) {
        await updateMutation.mutateAsync({
          id: editingTemplate.id,
          updates: {
            name: formData.name,
            category: formData.category,
            style_config: formData.style_config,
            favorite: formData.favorite,
            featured: formData.featured,
            recommended: formData.recommended,
            is_experimental: formData.is_experimental,
            tags: tags,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          category: formData.category,
          style_config: formData.style_config,
          favorite: formData.favorite,
          featured: formData.featured,
          recommended: formData.recommended,
          is_experimental: formData.is_experimental,
          tags: tags,
        });
      }
      setOpen(false);
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            System Templates
          </h1>
          <p className="text-foreground/60">
            Create and manage carousel templates for the system
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpen()}
              className="bg-primary hover:bg-primary/80"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Bold Questions"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="template-category">Category</Label>
                <Input
                  id="template-category"
                  placeholder="e.g., listicle, quote, story"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="template-tags">Tags (comma-separated)</Label>
                <Input
                  id="template-tags"
                  placeholder="e.g., popular, trending, featured"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="style-config">Style Config (JSON)</Label>
                <Textarea
                  id="style-config"
                  placeholder="Enter JSON configuration"
                  value={JSON.stringify(formData.style_config, null, 2)}
                  onChange={(e) => {
                    try {
                      setFormData({
                        ...formData,
                        style_config: JSON.parse(e.target.value),
                      });
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="font-mono text-sm h-40"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="favorite"
                    checked={formData.favorite}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        favorite: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="favorite" className="font-normal cursor-pointer">
                    Mark as Favorite
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        featured: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="featured" className="font-normal cursor-pointer">
                    Featured
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recommended"
                    checked={formData.recommended}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        recommended: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="recommended" className="font-normal cursor-pointer">
                    Recommended
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="experimental"
                    checked={formData.is_experimental}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        is_experimental: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="experimental"
                    className="font-normal cursor-pointer"
                  >
                    Experimental
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  !formData.name ||
                  !formData.category
                }
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Template"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Templates Overview</CardTitle>
          <CardDescription>
            {templates.length} template{templates.length !== 1 ? "s" : ""} available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-foreground/50">
              No templates created yet. Create your first template to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id} className="border-border/50">
                      <TableCell className="font-medium">
                        {template.name}
                      </TableCell>
                      <TableCell className="text-sm text-foreground/70">
                        {template.category}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(template.tags || []).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.featured && (
                            <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                              Featured
                            </Badge>
                          )}
                          {template.recommended && (
                            <Badge className="bg-green-500/20 text-green-400 text-xs">
                              Recommended
                            </Badge>
                          )}
                          {template.is_experimental && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                              Experimental
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpen(template)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(template.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
