import { platforms } from "@/constants/platforms";
import { useBrandIntegrations } from '@/features/brand/hooksIntegrations';
import { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import React from "react";
import { SocialItem } from "./SocialItem";

type SocialIntegrationTypes = {
  platformKey: typeof platforms[number]["id"];
  integrations: Database["public"]["Tables"]["platform_integrations"]["Row"][];
  onConnect: (platformId: string) => void;
  onDisconnect: (integrationId: string) => void;
}

export const SocialIntegration = ({
  platformKey,
  integrations,
  onConnect,
  onDisconnect
}: SocialIntegrationTypes) => {
  
  // Find integration for this platform
  const integration = integrations.find(i => i.platform === platformKey);
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
      key={platformKey}
      className="flex items-center justify-between p-4 bg-muted/50 border border rounded-lg hover:border/50 transition"
    >
      <SocialItem platformKey={platformKey} integration={integration!}/>

      <Button
        onClick={() => {
          if (isConnected && integration) {
            handleDisconnect(integration.id);
          } else {
            handleConnect(platformKey);
          }
        }}
        disabled={connecting === platformKey}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition`}

        variant={isConnected ? "destructive" : "default"}
      >
        {connecting === platformKey ? (
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