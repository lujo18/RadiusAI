import React from "react";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/animate-ui/components/radix/dialog';
import BrandSettingsForm from './BrandSettingsForm';
import IntegrationsList from './IntegrationsList';
import type { BrandSettings } from '../TemplateCreator/contentTypes';
import type { Database } from '@/types/database';
import { useUpdateBrandSettings } from '@/lib/api/hooks';

type Brand = Database['public']['Tables']['brand']['Row'];

interface EditProfileDialogProps {
  profile: Brand;
  onClose: () => void;
}

/** Helper to safely extract brand settings from brand */
function getBrandSettings(brand: Brand): BrandSettings | null {
  if (!brand.brand_settings) return null;
  return brand.brand_settings as unknown as BrandSettings;
}

export default function EditProfileDialog({ profile: brand, onClose }: EditProfileDialogProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'integrations'>('settings');
  const updateBrandSettingsMutation = useUpdateBrandSettings();
  const brandSettings = getBrandSettings(brand);

  const handleSubmit = async (newBrandSettings: BrandSettings) => {
    try {
      await updateBrandSettingsMutation.mutateAsync({
        brandId: brand.id,
        brandSettings: newBrandSettings,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update brand:', error);
      alert('Failed to update brand');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border">
          <Button
            variant="ghost"
            onClick={() => setActiveTab('settings')}
            className={`rounded-none border-b-2 ${
              activeTab === 'settings'
                ? 'border-primary text-primary'
                : 'border-transparent'
            }`}
          >
            Brand Settings
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('integrations')}
            className={`rounded-none border-b-2 ${
              activeTab === 'integrations'
                ? 'border-primary text-primary'
                : 'border-transparent'
            }`}
          >
            Integrations
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto">
          {activeTab === 'settings' ? (
            <BrandSettingsForm
              initialValues={brandSettings || undefined}
              onSubmit={handleSubmit}
              onCancel={onClose}
              isSubmitting={updateBrandSettingsMutation.isPending}
              submitLabel="Save Changes"
            />
          ) : (
            <IntegrationsList
              lateProfileId={brand.id}
              brandId={brand.id}
              integrations={[]}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
