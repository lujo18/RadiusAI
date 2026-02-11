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

interface CreateProfileDialogProps {
  onClose: () => void;
}

export default function CreateProfileDialog({ onClose }: CreateProfileDialogProps) {
  const createProfileMutation = useCreateBrand();

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
        <div className="overflow-y-auto">
          <BrandSettingsForm
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={createProfileMutation.isPending}
            submitLabel="Create Profile"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
