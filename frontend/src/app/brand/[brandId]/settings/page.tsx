"use client";

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BrandSettingsForm from '@/components/Profiles/BrandSettingsForm';
import IntegrationsList from '@/components/Profiles/IntegrationsList';
import { useBrands, useUpdateBrandSettings } from '@/lib/api/hooks/useBrands';
import type { BrandSettings } from '@/components/TemplateCreator/contentTypes';
import type { Database } from '@/types/database';

type Brand = Database['public']['Tables']['brand']['Row'];

/** Helper to safely extract brand settings from brand */
function getBrandSettings(brand: Brand): BrandSettings | null {
  if (!brand.brand_settings) return null;
  return brand.brand_settings as unknown as BrandSettings;
}

export default function BrandSettingsPage() {
  const params = useParams();
  const brandId = params?.brandId as string;
  const [activeTab, setActiveTab] = useState<'settings' | 'integrations'>('settings');
  const updateBrandSettingsMutation = useUpdateBrandSettings();

  // Fetch all brands and find the current one
  const { data: brands, isLoading, error } = useBrands();
  const brand = brands?.find((b: Brand) => b.id === brandId);

  const handleSubmit = async (newBrandSettings: BrandSettings) => {
    try {
      await updateBrandSettingsMutation.mutateAsync({
        brandId: brandId,
        brandSettings: newBrandSettings,
      });
    } catch (error) {
      console.error('Failed to update brand:', error);
      alert('Failed to update brand');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-red-500">Error loading brand settings.</div>
      </div>
    );
  }

  const brandSettings = getBrandSettings(brand);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ghost-white mb-2">Brand Settings</h1>
        <p className="text-ghost-white/60">
          Manage your brand identity, voice, and social media integrations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="settings">Brand Settings</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-ghost-white">Brand Identity & Voice</CardTitle>
              <CardDescription className="text-ghost-white/60">
                Define your brand's personality, aesthetic, and content rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandSettingsForm
                initialValues={brandSettings || undefined}
                onSubmit={handleSubmit}
                onCancel={() => {}}
                isSubmitting={updateBrandSettingsMutation.isPending}
                submitLabel="Save Changes"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-ghost-white">Social Media Integrations</CardTitle>
              <CardDescription className="text-ghost-white/60">
                Connect your social media accounts to enable posting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegrationsList
                profileId={brand.late_profile_id}
                integrations={[]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
