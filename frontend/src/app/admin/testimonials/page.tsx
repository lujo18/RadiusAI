"use client";

import React, { useState } from "react";
import {
  useTestimonials,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
} from "@/lib/api/hooks/useTestimonials";
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
} from "@/components/animate-ui/components/radix/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Plus, Loader2, Star } from "lucide-react";
import type { Database } from "@/types/database";

type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];

export default function TestimonialsPage() {
  const { data: testimonials = [], isLoading } = useTestimonials();
  const createMutation = useCreateTestimonial();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonial();

  const [open, setOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    quote: "",
    role: "",
    company: "",
    avatar_url: "",
    rating: 5,
    featured: false,
    published: true,
  });

  const handleOpen = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setFormData({
        name: testimonial.name,
        quote: testimonial.quote,
        role: testimonial.role ?? "",
        company: testimonial.company ?? "",
        avatar_url: testimonial.avatar_url ?? "",
        rating: testimonial.rating ?? 5,
        featured: testimonial.featured ?? false,
        published: testimonial.published ?? true,
      });
    } else {
      setEditingTestimonial(null);
      setFormData({
        name: "",
        quote: "",
        role: "",
        company: "",
        avatar_url: "",
        rating: 5,
        featured: false,
        published: true,
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingTestimonial) {
        await updateMutation.mutateAsync({
          id: editingTestimonial.id,
          updates: {
            name: formData.name,
            quote: formData.quote,
            role: formData.role || null,
            company: formData.company || null,
            avatar_url: formData.avatar_url || null,
            rating: formData.rating,
            featured: formData.featured,
            published: formData.published,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          quote: formData.quote,
          role: formData.role || null,
          company: formData.company || null,
          avatar_url: formData.avatar_url || null,
          rating: formData.rating,
          featured: formData.featured,
          published: formData.published,
        });
      }
      setOpen(false);
    } catch (error) {
      console.error("Failed to save testimonial:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete testimonial:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Testimonials
          </h1>
          <p className="text-foreground/60">
            Manage customer testimonials and reviews
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpen()}
              className="bg-primary hover:bg-primary/80"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTestimonial
                  ? "Edit Testimonial"
                  : "Create New Testimonial"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Customer name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="quote">Testimonial Quote</Label>
                <Textarea
                  id="quote"
                  placeholder="What did the customer say?"
                  value={formData.quote}
                  onChange={(e) =>
                    setFormData({ ...formData, quote: e.target.value })
                  }
                  className="h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    placeholder="e.g., CEO, Marketing Manager"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="e.g., Acme Corp"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input
                  id="avatar"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.avatar_url}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar_url: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rating: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        published: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="published" className="font-normal cursor-pointer">
                    Publish
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
                  !formData.quote
                }
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Testimonial"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Testimonials Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Testimonials Overview</CardTitle>
          <CardDescription>
            {testimonials.length} testimonial
            {testimonials.length !== 1 ? "s" : ""} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-8 text-foreground/50">
              No testimonials yet. Add your first testimonial to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {testimonials.map((testimonial) => (
                <Card
                  key={testimonial.id}
                  className="glass-card border border-border/50"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        {testimonial.avatar_url && (
                          <img
                            src={testimonial.avatar_url}
                            alt={testimonial.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {testimonial.name}
                            </h3>
                            {testimonial.featured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          {testimonial.role && (
                            <p className="text-sm text-foreground/60">
                              {testimonial.role}
                              {testimonial.company && ` at ${testimonial.company}`}
                            </p>
                          )}
                          <div className="mt-2 text-sm text-foreground/80">
                            "{testimonial.quote}"
                          </div>
                          {testimonial.rating && (
                            <div className="flex gap-1 mt-2">
                              {Array.from({ length: testimonial.rating }).map(
                                (_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 fill-primary text-primary"
                                  />
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpen(testimonial)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(testimonial.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!testimonial.published && (
                        <Badge variant="secondary">Unpublished</Badge>
                      )}
                      {testimonial.featured && (
                        <Badge className="bg-yellow-500/20 text-yellow-400">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
