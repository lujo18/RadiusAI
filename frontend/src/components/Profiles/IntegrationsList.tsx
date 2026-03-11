import React, { useState, useEffect } from "react";
import { FiInstagram, FiTwitter } from "react-icons/fi";
import { SiTiktok, SiFacebook } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { brandApi } from '@/lib/api/client';
import { useSearchParams, useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "@/types/database";
import { platforms } from "@/constants/platforms";
import { SocialIntegration } from "../platform-integrations/SocialIntegration";
import { Alert, AlertTitle } from "../ui/alert";
import { Check, CircleFadingArrowUpIcon, OctagonAlert } from "lucide-react";
import { useRemoveIntegration, useAddIntegration } from '@/features/brand/hooks';
import { brandService } from "@/features/brand";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

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
  const params = useParams();
  const teamId = params?.teamId as string;
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {mutateAsync: removeIntegration, error: removeError} = useRemoveIntegration();
  const {mutateAsync: connectIntegration, error: connectError} = useAddIntegration();

  // After OAuth callback, immediately refetch integrations so the UI updates
  useEffect(() => {
    const platform = searchParams.get("platform");

    if (platform) {
      setSuccessMessage(
        `${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`,
      );

      // Invalidate so TanStack Query refetches right away
      queryClient.invalidateQueries({
        queryKey: ["brand-integrations", teamId, brandId],
      });

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);

      // Remove query parameters from URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, queryClient, teamId, brandId]);

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    setError(null);

    try {
      // Call backend to start OAuth flow

      const { data } = await connectIntegration({profileId: lateProfileId, brandId, platform:platformId})
      // Redirect to social platform for authorization
      window.location.href = data.authUrl;
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
      await removeIntegration({ integrationId, brandId });
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
      {!!(removeError || connectError) && (
        <Alert variant={"destructive"}>
          <OctagonAlert className="size-4" />
          <AlertTitle>{JSON.stringify(connectError)}{JSON.stringify(removeError)}</AlertTitle>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => (
          <SocialIntegration
            key={platform.id}
            platformKey={platform.id}
            integrations={safeIntegrations}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        ))}
      </div>

      {safeIntegrations.length > 0 && (
        <Badge variant={"outline"} className="text-primary">
        
            {safeIntegrations.length} account
            {safeIntegrations.length !== 1 ? "s" : ""} connected
          
        </Badge>
      )}
    </div>
  );
}
