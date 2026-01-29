import { platforms } from "@/constants/platforms";
import { useBrandIntegrations } from "@/lib/api/hooks";
import { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import React from "react";
import { SocialItem } from "./SocialItem";

type SocialIntegrationTypes = {
  platform: typeof platforms[number];
  integrations: Database["public"]["Tables"]["platform_integrations"]["Row"][];
  onConnect: (platformId: string) => void;
  onDisconnect: (integrationId: string) => void;
}

export const SocialIntegration = ({
  platform,
  integrations,
  onConnect,
  onDisconnect
}: SocialIntegrationTypes) => {
  
  // Find integration for this platform
  const integration = integrations.find(i => i.platform === platform.id);
  const isConnected = !!integration && integration.status === "connected";

  // Placeholder handlers and state (replace with real logic)
  const [connecting, setConnecting] = React.useState<string | null>(null);

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    onConnect(platformId)
    setTimeout(() => setConnecting(null), 2000);
  };

  const handleDisconnect = async (integrationId: string) => {
    setConnecting(integration?.platform ?? null);
    onDisconnect(integrationId)
    setTimeout(() => setConnecting(null), 1000);
  };

  return (
    <div
      key={platform.id}
      className="flex items-center justify-between p-4 bg-muted/50 border border rounded-lg hover:border/50 transition"
    >
      <SocialItem platform={platform} integration={integration!}/>

      <Button
        onClick={() => {
          if (isConnected && integration) {
            const accountId = integration.pfm_account_id || integration.late_account_id;
            if (!accountId) return
            handleDisconnect(accountId);
          } else {
            handleConnect(platform.id);
          }
        }}
        disabled={connecting === platform.id}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
          isConnected
            ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20'
            : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
        }`}
      >
        {connecting === platform.id ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>
            Connecting...
          </span>
        ) : isConnected ? (
          'Disconnect'
        ) : (
          'Connect'
        )}
      </Button>
    </div>
  );
};