'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadDropzone } from '@/components/ui/upload-dropzone';
import { useUploadFiles } from '@better-upload/client';
import {
  useBrandCtas,
  useCreateBrandCta,
  useUpdateBrandCta,
  useDeleteBrandCta,
  useToggleBrandCtaStatus,
  useSetCtaImage,
  useRemoveCtaImage,
} from '@/features/brand_ctas/hooks';
import { Plus, Trash2, Edit2, Check, X, ImageIcon } from 'lucide-react';


export default function CTAPage() {
  const params = useParams();
  const brandId = params?.brandId as string;

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    cta_text: '',
    cta_url: '',
    category: '',
    cta_type: '',
  });

  // Queries & Mutations
  const { data: ctas, isLoading, error } = useBrandCtas(brandId);
  const { mutate: createCta, isPending: isCreatePending } = useCreateBrandCta();
  const { mutate: updateCta, isPending: isUpdatePending } = useUpdateBrandCta();
  const { mutate: deleteCta, isPending: isDeletePending } = useDeleteBrandCta();
  const { mutate: toggleStatus } = useToggleBrandCtaStatus();


  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label || !formData.cta_text) {
      alert('Label and CTA Text are required');
      return;
    }

    createCta(
      {
        brandId,
        payload: {
          label: formData.label,
          cta_text: formData.cta_text,
          cta_url: formData.cta_url || undefined,
          category: formData.category || undefined,
          is_active: true,
          ...(pendingImageUrl ? { metadata: { cta_image: pendingImageUrl } } : {}),
        },
      },
      {
        onSuccess: () => {
          setFormData({ label: '', cta_text: '', cta_url: '', category: '', cta_type: '' });
          setPendingImageUrl(null);
          setIsCreating(false);
        },
      }
    );
  };

  const handleUpdateSubmit = (ctaId: string, e: React.FormEvent) => {
    e.preventDefault();
    updateCta(
      {
        ctaId,
        updates: {
          label: formData.label,
          cta_text: formData.cta_text,
          cta_url: formData.cta_url || null,
          category: formData.category || null,
        },
      },
      {
        onSuccess: () => {
          setEditingId(null);
          setFormData({ label: '', cta_text: '', cta_url: '', category: '', cta_type: ''});
        },
      }
    );
  };

  const handleEdit = (cta: any) => {
    setEditingId(cta.id);
    setFormData({
      label: cta.label,
      cta_text: cta.cta_text,
      cta_url: cta.cta_url || '',
      category: cta.category || '',
      cta_type: cta.cta_type || '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setPendingImageUrl(null);
    setFormData({ label: '', cta_text: '', cta_url: '', category: '', cta_type: ''});
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">Error loading CTAs: {error.message}</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Create Form Card */}
      {isCreating ? (
        <Card className="border border-border bg-card/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-ghost-white">Create New CTA</CardTitle>
            <CardDescription className="text-ghost-white/60">
              Add a new call-to-action for your brand
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-ghost-white">
                  Label *
                </label>
                <Input
                  placeholder="e.g., Subscribe, Join, Learn More"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  disabled={isCreatePending}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ghost-white">
                  CTA Text *
                </label>
                <textarea
                  placeholder="e.g., Subscribe to our newsletter"
                  value={formData.cta_text}
                  onChange={(e) =>
                    setFormData({ ...formData, cta_text: e.target.value })
                  }
                  disabled={isCreatePending}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-ghost-white placeholder-ghost-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  style={{ maxHeight: "calc(1.5em * (6 * 16px))" }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ghost-white">
                  URL
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={formData.cta_url}
                  onChange={(e) =>
                    setFormData({ ...formData, cta_url: e.target.value })
                  }
                  disabled={isCreatePending}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ghost-white">
                    Category
                  </label>
                  <Input
                    placeholder="e.g., Email, Social"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    disabled={isCreatePending}
                  />
                </div>
              </div>

              {/* CTA Image upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-ghost-white">
                  CTA Image
                </label>
                {pendingImageUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
                      <Image
                        src={pendingImageUrl}
                        alt="CTA image preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingImageUrl(null)}
                      className="gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <UploadDropzone
                    control={createUploadControl}
                    accept="image/*"
                    description={{
                      fileTypes: "images",
                      maxFileSize: "5 MB",
                      maxFiles: 1,
                    }}
                  />
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={
                    isCreatePending || !formData.label || !formData.cta_text
                  }
                  className="bg-primary hover:bg-primary/80"
                >
                  {isCreatePending ? "Creating..." : "Create CTA"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isCreatePending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-primary hover:bg-primary/80 gap-2"
        >
          <Plus className="w-4 h-4" />
          Create CTA
        </Button>
      )}

      {/* CTAs List */}
      <div className="space-y-4">
        {ctas && ctas.length === 0 ? (
          <Card className="border border-border bg-card/50 backdrop-blur-md">
            <CardContent className="pt-6">
              <p className="text-center text-ghost-white/60">
                No CTAs created yet. Create one to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          ctas?.map((cta: any) => (
            <Card
              key={cta.id}
              className="border border-border bg-card/50 backdrop-blur-md overflow-hidden"
            >
              {editingId === cta.id ? (
                <CardContent className="pt-6">
                  <form
                    onSubmit={(e) => handleUpdateSubmit(cta.id, e)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-ghost-white">
                        Label
                      </label>
                      <Input
                        placeholder="Label"
                        value={formData.label}
                        onChange={(e) =>
                          setFormData({ ...formData, label: e.target.value })
                        }
                        disabled={isUpdatePending}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-ghost-white">
                        CTA Text
                      </label>
                      <textarea
                        placeholder="CTA Text"
                        value={formData.cta_text}
                        onChange={(e) =>
                          setFormData({ ...formData, cta_text: e.target.value })
                        }
                        disabled={isUpdatePending}
                        rows={3}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-ghost-white placeholder-ghost-white/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                        style={{ maxHeight: "calc(1.5em * 6 + 16px)" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-ghost-white">
                        URL
                      </label>
                      <Input
                        type="url"
                        placeholder="URL"
                        value={formData.cta_url}
                        onChange={(e) =>
                          setFormData({ ...formData, cta_url: e.target.value })
                        }
                        disabled={isUpdatePending}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-ghost-white">
                          Category
                        </label>
                        <Input
                          placeholder="Category"
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                          disabled={isUpdatePending}
                        />
                      </div>
                    </div>

                    {/* CTA Image in edit mode */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-ghost-white">
                        CTA Image
                      </label>
                      {(cta.metadata as Record<string, unknown> | null)
                        ?.cta_image ? (
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
                            <Image
                              src={
                                (cta.metadata as Record<string, string>)
                                  .cta_image
                              }
                              alt={`${cta.label} CTA image`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCtaImage({ ctaId: cta.id })}
                            className="gap-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <UploadDropzone
                          control={editUploadControl}
                          accept="image/*"
                          description={{
                            fileTypes: "images",
                            maxFileSize: "5 MB",
                            maxFiles: 1,
                          }}
                          uploadOverride={(files, opts) => {
                            setUploadingCtaId(cta.id);
                            editUploadControl.upload(files, opts);
                          }}
                        />
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        disabled={isUpdatePending}
                        className="bg-primary hover:bg-primary/80 gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isUpdatePending}
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              ) : (
                <>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-ghost-white">
                            {cta.label}
                          </CardTitle>
                          <Badge
                            variant={cta.is_active ? "default" : "secondary"}
                          >
                            {cta.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <CardDescription className="text-ghost-white/60">
                          {cta.cta_text}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3 mb-4">
                      {cta.cta_url && (
                        <div>
                          <p className="text-xs text-ghost-white/50 uppercase tracking-wide mb-1">
                            URL
                          </p>
                          <a
                            href={cta.cta_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 text-sm break-all"
                          >
                            {cta.cta_url}
                          </a>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {cta.category && (
                          <div>
                            <p className="text-xs text-ghost-white/50 uppercase tracking-wide mb-1">
                              Category
                            </p>
                            <p className="text-sm text-ghost-white">
                              {cta.category}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* CTA Image */}
                      <div>
                        <p className="text-xs text-ghost-white/50 uppercase tracking-wide mb-2">
                          CTA Image
                        </p>
                        {(cta.metadata as Record<string, unknown> | null)
                          ?.cta_image ? (
                          <div className="flex items-start gap-3">
                            <div className="relative w-24 h-24 rounded-md overflow-hidden border border-border">
                              <Image
                                src={
                                  (cta.metadata as Record<string, string>)
                                    .cta_image
                                }
                                alt={`${cta.label} CTA image`}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm("Remove this CTA image?")) {
                                  removeCtaImage({ ctaId: cta.id });
                                }
                              }}
                              className="gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <UploadDropzone
                            control={editUploadControl}
                            accept="image/*"
                            description={{
                              fileTypes: "images",
                              maxFileSize: "5 MB",
                              maxFiles: 1,
                            }}
                            uploadOverride={(files, opts) => {
                              setUploadingCtaId(cta.id);
                              editUploadControl.upload(files, opts);
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(cta)}
                        disabled={isDeletePending}
                        className="gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>

                      <Button
                        variant={cta.is_active ? "outline" : "default"}
                        size="sm"
                        onClick={() =>
                          toggleStatus({
                            ctaId: cta.id,
                            isActive: !cta.is_active,
                          })
                        }
                        disabled={isDeletePending}
                      >
                        {cta.is_active ? "Deactivate" : "Activate"}
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm("Are you sure you want to delete this CTA?")
                          ) {
                            deleteCta({ ctaId: cta.id, brandId });
                          }
                        }}
                        disabled={isDeletePending}
                        className="gap-2 ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

