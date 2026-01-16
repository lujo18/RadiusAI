import React from "react";
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { FiEdit2, FiTrash2, FiInstagram, FiTwitter } from 'react-icons/fi';
import { SiTiktok, SiFacebook } from 'react-icons/si';
import type { BrandSettings } from '../TemplateCreator/contentTypes';
import type { Database } from '@/types/database';

type Brand = Database['public']['Tables']['brand']['Row'];

type PlatformIntegration = {
  id: string;
  name: string;
  platform: string;
  connected: boolean;
  accessToken?: string;
  username?: string;
};
import { useDeleteBrand } from '@/lib/api/hooks';

interface ProfileCardProps {
  profile: Brand;
  onEdit: (profileId: string) => void;
}

/** Helper to safely extract brand settings from brand */
function getBrandSettings(brand: Brand): BrandSettings | null {
  if (!brand.brand_settings) return null;
  return brand.brand_settings as unknown as BrandSettings;
}

export default function ProfileCard({ profile, onEdit }: ProfileCardProps) {
  const deleteProfileMutation = useDeleteBrand();
  const brandSettings = getBrandSettings(profile);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    
    try {
      await deleteProfileMutation.mutateAsync(profile.id);
    } catch (error) {
      console.error('Failed to delete profile:', error);
      alert('Failed to delete profile');
    }
  };

  return (
    <Card className="hover:border-primary/50 transition">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1">
              {brandSettings?.name || 'Unnamed Profile'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {brandSettings?.niche} • {brandSettings?.aesthetic}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
         
              size="sm"
              onClick={() => onEdit(profile.id)}
              title="Edit profile"
            >
              <FiEdit2/>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              title="Delete profile"
            >
              <FiTrash2 />
            </Button>
          </div>
        </div>

        {/* Key Info */}
        <div className="space-y-2 mb-4">
          <InfoRow label="Target Audience" value={brandSettings?.target_audience} />
          <InfoRow label="Brand Voice" value={brandSettings?.brand_voice} />
          <InfoRow label="Tone" value={brandSettings?.tone_of_voice} />
        </div>

        {/* Content Pillars */}
        {brandSettings?.content_pillars && brandSettings.content_pillars.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Content Pillars</p>
            <div className="flex flex-wrap gap-2">
              {brandSettings.content_pillars.slice(0, 3).map((pillar, i) => (
                <Badge key={i} variant="secondary">
                  {pillar}
                </Badge>
              ))}
              {brandSettings.content_pillars.length > 3 && (
                <Badge variant="outline">
                  +{brandSettings.content_pillars.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Integrations - Note: integrations need to be fetched separately or joined */}
        {/* <IntegrationIcons integrations={[]} /> */}

        {/* Stats */}
        <div className="flex gap-4 pt-4 border-t border mt-4">
          <StatItem label="Templates" value={profile.template_count ?? 0} />
          <StatItem label="Posts" value={profile.post_count ?? 0} />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value || 'Not set'}</span>
    </div>
  );
}

function IntegrationIcons({ integrations }: { integrations: any[] }) {
  const platformIcons = {
    Instagram: FiInstagram,
    TikTok: SiTiktok,
    Twitter: FiTwitter,
    Facebook: SiFacebook,
  };

  if (integrations?.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-2">
        No integrations connected
      </div>
    );
  }

  return (
    <div className="flex gap-2 py-2">
      {integrations?.map((integration) => {
        const Icon = platformIcons[integration.platform as keyof typeof platformIcons];
        return (
          <div
            key={integration.id}
            className="p-2 bg-muted/50 rounded-lg"
            title={`${integration.platform}: ${integration.username}`}
          >
            {Icon && <Icon className="text-lg" />}
          </div>
        );
      })}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
