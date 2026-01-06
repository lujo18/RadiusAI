import React from "react";
import { FiInstagram, FiTwitter } from 'react-icons/fi';
import { SiTiktok, SiFacebook } from 'react-icons/si';
import { Button } from '@/components/ui/button';

type PlatformIntegration = {
  id: string;
  name: string;
  platform: string;
  connected: boolean;
  accessToken?: string;
  username?: string;
};

interface IntegrationsListProps {
  profileId: string;
  integrations: PlatformIntegration[];
}

export default function IntegrationsList({ profileId, integrations }: IntegrationsListProps) {
  const platforms = [
    { id: 'Instagram', name: 'Instagram', icon: FiInstagram, color: 'bg-gradient-to-br from-chart-5 to-chart-3' },
    { id: 'TikTok', name: 'TikTok', icon: SiTiktok, color: 'bg-foreground' },
    { id: 'Twitter', name: 'Twitter', icon: FiTwitter, color: 'bg-chart-2' },
    { id: 'Facebook', name: 'Facebook', icon: SiFacebook, color: 'bg-chart-2' },
  ];

  const handleConnect = (platformId: string) => {
    console.log('Connect to', platformId, 'for profile', profileId);
    alert(`OAuth integration for ${platformId} coming soon!`);
    // TODO: Implement OAuth flow
  };

  const handleDisconnect = (integrationId: string) => {
    console.log('Disconnect integration', integrationId);
    // TODO: Implement disconnect mutation
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Social Media Connections</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Connect your social media accounts to enable posting from this profile.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const integration = integrations.find(i => i.platform === platform.id as any);
          const isConnected = !!integration;

          return (
            <div
              key={platform.id}
              className="flex items-center justify-between p-4 bg-muted/50 border border rounded-lg hover:border/50 transition"
            >
              <div className="flex items-center gap-3">
                <div className={`${platform.color} p-2.5 rounded-lg`}>
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{platform.name}</p>
                  {isConnected && integration && (
                    <p className="text-xs text-muted-foreground">@{integration.username}</p>
                  )}
                </div>
              </div>

              <Button
                onClick={() =>
                  isConnected && integration
                    ? handleDisconnect(integration.id)
                    : handleConnect(platform.id)
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isConnected
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20'
                    : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                }`}
              >
                {isConnected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          );
        })}
      </div>

      {integrations.length > 0 && (
        <div className="mt-8 p-4 bg-chart-4/10 border border-chart-4/20 rounded-lg">
          <p className="text-sm text-green-400">
            ✓ {integrations.length} account{integrations.length !== 1 ? 's' : ''} connected
          </p>
        </div>
      )}
    </div>
  );
}
