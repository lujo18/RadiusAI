/**
 * Example Frontend Component for Social Media OAuth
 * 
 * This shows how to integrate the /connect-social endpoints
 * into your Next.js frontend
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Supported platforms
const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'twitter', name: 'Twitter', icon: '🐦' },
  { id: 'facebook', name: 'Facebook', icon: '👥' },
];

export default function ConnectSocialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (platform: string) => {
    setLoading(platform);
    setError(null);

    try {
      // Get current user ID (from your auth context/store)
      const userId = 'YOUR_USER_ID'; // Replace with actual user ID

      // Call your backend to start OAuth flow
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/connect-social/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add your auth token here if needed
            // 'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            platform,
            user_id: userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start OAuth flow');
      }

      const data = (await response.json()) as { authUrl?: string };

      // Redirect user to social platform for authorization
      window.location.href = data.authUrl || '';
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
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handleConnect(platform.id)}
              disabled={loading === platform.id}
              className="glass-card p-8 hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-6xl mb-4">{platform.icon}</div>
              <h3 className="text-xl font-semibold text-ghost-white mb-2">
                {platform.name}
              </h3>
              {loading === platform.id ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin h-5 w-5 border-2 border-kinetic-mint border-t-transparent rounded-full"></div>
                  <span className="text-ghost-white/60">Connecting...</span>
                </div>
              ) : (
                <span className="text-kinetic-mint hover:text-kinetic-mint/80">
                  Connect →
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Help Text */}
        <div className="mt-12 glass-card p-6">
          <h3 className="text-lg font-semibold text-ghost-white mb-3">
            How it works
          </h3>
          <ol className="space-y-2 text-ghost-white/60">
            <li>1. Click on a platform to connect</li>
            <li>2. Authorize Radius in the platform's login page</li>
            <li>3. You'll be redirected back with your account connected</li>
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

/**
 * Success Page Component
 * 
 * Show this after successful OAuth callback
 */
export function SocialConnectedSuccessPage() {
  const router = useRouter();
  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const platform = searchParams.get('platform') || 'social media';

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-6">
      <div className="glass-card max-w-md w-full p-8 text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold text-ghost-white mb-4">
          Connected Successfully!
        </h1>
        <p className="text-ghost-white/60 mb-8">
          Your {platform} account is now connected and ready to use.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-primary w-full py-3"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

/**
 * Connected Accounts List Component
 * 
 * Show this in user settings/dashboard
 */
interface ConnectedAccount {
  id: string;
  platform: string;
  username: string;
  connectedAt: string;
}

export function ConnectedAccountsList({
  accounts,
}: {
  accounts: ConnectedAccount[];
}) {
  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;

    try {
      // Call your backend to disconnect
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/social-connections/${accountId}`,
        {
          method: 'DELETE',
          // Add auth headers
        }
      );

      if (response.ok) {
        window.location.reload(); // Or update state
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-ghost-white mb-4">
        Connected Accounts
      </h2>

      {accounts.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-ghost-white/60 mb-4">
            No accounts connected yet
          </p>
          <a href="/connect-social" className="btn-primary inline-block px-6 py-3">
            Connect an Account
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="glass-card p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">
                  {
                    PLATFORMS.find((p) => p.id === account.platform.toLowerCase())
                      ?.icon
                  }
                </div>
                <div>
                  <p className="text-ghost-white font-semibold">
                    {account.platform}
                  </p>
                  <p className="text-ghost-white/60 text-sm">
                    @{account.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDisconnect(account.id)}
                className="btn-ghost px-4 py-2 text-sm"
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
