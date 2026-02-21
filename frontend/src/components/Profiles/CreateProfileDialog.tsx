import React from "react";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/animate-ui/components/radix/dialog';
import BrandSettingsForm from './BrandSettingsForm';
import type { BrandSettings } from '../TemplateCreator/contentTypes';
import { useCreateBrand } from '@/features/brand/hooks';
import { useGetBrandUsage } from '@/features/usage/hooks';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateProfileDialogProps {
  onClose: () => void;
}

export default function CreateProfileDialog({ onClose }: CreateProfileDialogProps) {
  const createProfileMutation = useCreateBrand();
  const { data: brandUsage } = useGetBrandUsage();
  const isBrandLimitReached = brandUsage?.brand_limit !== null && brandUsage?.remaining !== undefined && brandUsage.remaining <= 0;

  const handleSubmit = async (brandSettings: BrandSettings) => {
    try {
      await createProfileMutation.mutateAsync(brandSettings);
      onClose();
    } catch (error) {
      console.error('Failed to create profile:', error);
      alert('Failed to create profile');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create Brand Profile</DialogTitle>
        </DialogHeader>
        {isBrandLimitReached && (
          <Alert variant="destructive">
            <AlertDescription>
              You've reached your brand limit ({brandUsage?.brand_limit}). Upgrade your plan to create more brands.
            </AlertDescription>
          </Alert>
        )}
        <div className="overflow-y-auto">
          <BrandSettingsForm
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={createProfileMutation.isPending}
            submitLabel="Create Profile"
            isBrandLimitReached={isBrandLimitReached}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
