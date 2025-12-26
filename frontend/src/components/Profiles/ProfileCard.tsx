import { FiEdit2, FiTrash2, FiInstagram, FiTwitter } from 'react-icons/fi';
import { SiTiktok, SiFacebook } from 'react-icons/si';
import type { Profile, BrandSettings, PlatformIntegration } from '@/types';
import { useDeleteProfile } from '@/lib/api/hooks';

interface ProfileCardProps {
  profile: Profile;
  onEdit: (profileId: string) => void;
}

/** Helper to safely extract brand settings from profile */
function getBrandSettings(profile: Profile): BrandSettings | null {
  if (!profile.brand_settings) return null;
  return profile.brand_settings as unknown as BrandSettings;
}

export default function ProfileCard({ profile, onEdit }: ProfileCardProps) {
  const deleteProfileMutation = useDeleteProfile();
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
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-primary-500/50 transition">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-1">
            {brandSettings?.name || 'Unnamed Profile'}
          </h3>
          <p className="text-sm text-gray-400">
            {brandSettings?.niche} • {brandSettings?.aesthetic}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(profile.id)}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
            title="Edit profile"
          >
            <FiEdit2 className="text-gray-400 hover:text-white" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteProfileMutation.isPending}
            className="p-2 hover:bg-red-500/10 rounded-lg transition"
            title="Delete profile"
          >
            <FiTrash2 className="text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Brand Info */}
      <div className="space-y-3 mb-4">
        <InfoRow label="Target Audience" value={brandSettings?.target_audience} />
        <InfoRow label="Brand Voice" value={brandSettings?.brand_voice} />
        <InfoRow label="Tone" value={brandSettings?.tone_of_voice} />
      </div>

      {/* Content Pillars */}
      {brandSettings?.content_pillars && brandSettings.content_pillars.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Content Pillars</p>
          <div className="flex flex-wrap gap-2">
            {brandSettings.content_pillars.slice(0, 3).map((pillar, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-primary-500/10 text-primary-400 text-xs rounded"
              >
                {pillar}
              </span>
            ))}
            {brandSettings.content_pillars.length > 3 && (
              <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">
                +{brandSettings.content_pillars.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Integrations - Note: integrations need to be fetched separately or joined */}
      {/* <IntegrationIcons integrations={[]} /> */}

      {/* Stats */}
      <div className="flex gap-4 pt-4 border-t border-gray-700 mt-4">
        <StatItem label="Templates" value={profile.template_count ?? 0} />
        <StatItem label="Posts" value={profile.post_count ?? 0} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300">{value || 'Not set'}</span>
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

  if (integrations.length === 0) {
    return (
      <div className="text-xs text-gray-500 py-2">
        No integrations connected
      </div>
    );
  }

  return (
    <div className="flex gap-2 py-2">
      {integrations.map((integration) => {
        const Icon = platformIcons[integration.platform as keyof typeof platformIcons];
        return (
          <div
            key={integration.id}
            className="p-2 bg-gray-700/50 rounded-lg"
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
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
