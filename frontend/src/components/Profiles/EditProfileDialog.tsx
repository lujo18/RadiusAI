import React from "react";
import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import BrandSettingsForm from './BrandSettingsForm';
import IntegrationsList from './IntegrationsList';
import type { Profile, BrandSettings } from '@/types';
import { useUpdateBrandSettings } from '@/lib/api/hooks';

interface EditProfileDialogProps {
  profile: Profile;
  onClose: () => void;
}

/** Helper to safely extract brand settings from profile */
function getBrandSettings(profile: Profile): BrandSettings | null {
  if (!profile.brand_settings) return null;
  return profile.brand_settings as unknown as BrandSettings;
}

export default function EditProfileDialog({ profile, onClose }: EditProfileDialogProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'integrations'>('settings');
  const updateBrandSettingsMutation = useUpdateBrandSettings();
  const brandSettings = getBrandSettings(profile);

  const handleSubmit = async (newBrandSettings: BrandSettings) => {
    try {
      await updateBrandSettingsMutation.mutateAsync({
        profileId: profile.id,
        brandSettings: newBrandSettings,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-4 font-medium transition $\{
              activeTab === 'settings'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Brand Settings
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-6 py-4 font-medium transition $\{
              activeTab === 'integrations'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Integrations
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
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
              profileId={profile.id}
              integrations={[]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
