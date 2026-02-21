'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiInstagram, FiTwitter } from 'react-icons/fi';
import { SiTiktok, SiFacebook, SiLinkedin } from 'react-icons/si';
import { brandApi } from '@/lib/api/client';

// Supported platforms with icons
const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: SiTiktok, color: 'from-gray-900 to-gray-800' },
  { id: 'instagram', name: 'Instagram', icon: FiInstagram, color: 'from-purple-600 to-pink-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: SiLinkedin, color: 'from-blue-700 to-blue-500' },
  { id: 'twitter', name: 'Twitter', icon: FiTwitter, color: 'from-blue-400 to-blue-600' },
  { id: 'facebook', name: 'Facebook', icon: SiFacebook, color: 'from-blue-600 to-blue-800' },
];

export default function ConnectSocialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (platform: string) => {
    setLoading(platform);
    setError(null);

    try {
      // TODO: Replace with real late_profile_id and brand_id if available in this page context
      const { authUrl } = await brandApi.startSocialConnect({
        late_profile_id: '',
        brand_id: '',
        platform,
      });

      // Redirect user to social platform for authorization
      window.location.href = authUrl;
    } catch (err) {
      console.error('OAuth start failed:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to connect account'
      );
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-ghost-white mb-4">
            Connect Social Media
          </h1>
          <p className="text-ghost-white/60 text-lg">
            Connect your accounts to start posting automatically
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-card border-red-500/50 bg-red-500/10 p-4 mb-8">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Platform Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isLoading = loading === platform.id;

            return (
              <button
                key={platform.id}
                onClick={() => handleConnect(platform.id)}
                disabled={isLoading}
                className="glass-card p-8 hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-ghost-white mb-2">
                  {platform.name}
                </h3>
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-2 border-kinetic-mint border-t-transparent rounded-full"></div>
                    <span className="text-ghost-white/60">Connecting...</span>
                  </div>
                ) : (
                  <span className="text-kinetic-mint group-hover:text-kinetic-mint/80 transition-colors">
                    Connect →
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Help Text */}
        <div className="mt-12 glass-card p-6">
          <h3 className="text-lg font-semibold text-ghost-white mb-3">
            How it works
          </h3>
          <ol className="space-y-2 text-ghost-white/60">
            <li>1. Click on a platform to connect</li>
            <li>2. Authorize Radius in the platform&apos;s login page</li>
            <li>3. You&apos;ll be redirected back with your account connected</li>
            <li>4. Start creating and scheduling posts!</li>
          </ol>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-ghost px-6 py-3"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
