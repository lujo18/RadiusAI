import React, { useState, useEffect } from "react";
import { FiInstagram, FiTwitter } from "react-icons/fi";
import { SiTiktok, SiFacebook } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { brandApi } from "@/lib/api/client";
import { useSearchParams } from "next/navigation";
import { Database } from "@/types/database";
import { platforms } from "@/constants/platforms";
import { SocialIntegration } from "../platform-integrations/SocialIntegration";
import { Alert, AlertTitle } from "../ui/alert";
import { CircleFadingArrowUpIcon, OctagonAlert } from "lucide-react";
import { useRemoveIntegration } from '@/lib/api/hooks/useBrands';

interface IntegrationsListProps {
  lateProfileId: string;
  brandId: string;
  integrations?: Database["public"]["Tables"]["platform_integrations"]["Row"][];
}

export default function IntegrationsList({
  lateProfileId,
  brandId,
  integrations,
}: IntegrationsListProps) {
  const safeIntegrations = integrations ?? [];
  const searchParams = useSearchParams();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const removeIntegration = useRemoveIntegration();

  // Check for success parameter on mount
  useEffect(() => {
    const platform = searchParams.get("platform");

    if (platform) {
      setSuccessMessage(
        `${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`,
      );

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);

      // Remove query parameters from URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    setError(null);

    try {
      // Call backend to start OAuth flow
      const { authUrl } = await brandApi.startSocialConnect({
        late_profile_id: lateProfileId,
        brand_id: brandId,
        platform: platformId,
      });

      // Redirect to social platform for authorization
      window.location.href = authUrl;
    } catch (err) {
      console.error("Failed to start OAuth:", err);
      setError(
        err instanceof Error ? err.message : "Failed to connect account",
      );
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    setDisconnecting(integrationId);
    setError(null);
    try {
      await removeIntegration.mutateAsync({ integrationId, brandId });
      setSuccessMessage('Account disconnected');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to disconnect:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <Alert variant={"success"}>
          <CircleFadingArrowUpIcon className="size-4" />
          <AlertTitle>{successMessage}</AlertTitle>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant={"destructive"}>
          <OctagonAlert className="size-4" />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => (
          <SocialIntegration
            key={platform.id}
            platform={platform}
            integrations={safeIntegrations}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        ))}
      </div>

      {safeIntegrations.length > 0 && (
        <div className="mt-8 p-4 bg-chart-4/10 border border-chart-4/20 rounded-lg">
          <p className="text-sm text-green-400">
            ✓ {safeIntegrations.length} account
            {safeIntegrations.length !== 1 ? "s" : ""} connected
          </p>
        </div>
      )}
    </div>
  );
}
