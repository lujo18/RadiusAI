"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BrandSettingsForm from '@/components/Profiles/BrandSettingsForm';
import IntegrationsList from '@/components/Profiles/IntegrationsList';
import { useBrandIntegrations, useBrands, useUpdateBrandSettings } from '@/lib/api/hooks/useBrands';
import type { BrandSettings } from '@/components/TemplateCreator/contentTypes';
import type { Database } from '@/types/database';

type Brand = Database['public']['Tables']['brand']['Row'];

/** Helper to safely extract brand settings from brand */
function getBrandSettings(brand: Brand): BrandSettings | null {
  if (!brand.brand_settings) return null;
  return brand.brand_settings as unknown as BrandSettings;
}

export default function GeneralSettingsPage() {
  const params = useParams();
  const brandId = params?.brandId as string;
  const updateBrandSettingsMutation = useUpdateBrandSettings();
  
  // Fetch all brands and find the current one
  const { data: brands, isLoading, error } = useBrands();
  const { data: brandIntegrations, isLoading: isIntegrationLoading, error: integrationError } = useBrandIntegrations(brandId);
  const brand = brands?.find((b: Brand) => b.id === brandId);
  
  // Redirect to /overview if brand doesn't exist
  React.useEffect(() => {
    if (isLoading) return;
    if (!Array.isArray(brands)) return;
    if (brands.length === 0) return;
    
    const found = brands.find((b: Brand) => b.id === brandId);
    if (!found) {
      window.location.replace('/overview');
    }
  }, [brands, isLoading, brandId]);

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
      <div className="space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="text-red-500">Error loading brand settings.</div>
    );
  }

  const brandSettings = getBrandSettings(brand);

  return (
    <div className="space-y-4">
      <Card className="border border-border bg-card/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-ghost-white">Social Media Integrations</CardTitle>
          <CardDescription className="text-ghost-white/60">
            Connect your social media accounts to enable posting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IntegrationsList
            lateProfileId={brand.late_profile_id}
            brandId={brand.id}
            integrations={brandIntegrations}
          />
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/50 backdrop-blur-md">
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
    </div>
  );
}
