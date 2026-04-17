'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UpgradePlan {
  product_id: string;
  price_id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  metadata: Record<string, any>;
}

interface UpgradeFlowProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'paywall' | 'usage' | 'manual';
  message?: string;
}

export default function UpgradeFlow({ isOpen, onClose, trigger = 'manual', message }: UpgradeFlowProps) {
  const { user } = useAuthStore();
  const [availablePlans, setAvailablePlans] = useState<UpgradePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUpgrades();
    }
  }, [isOpen]);

  const fetchAvailableUpgrades = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const { data: { session } } = await supabase.auth.getSession();
      // Resolve team context: prefer route param, else find user's owned/membership teams
      const params = useParams();
      const routeTeamId = (params as any)?.teamId as string | undefined;

      let teamId: string | null = routeTeamId ?? null;
      
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const url = teamId ? `${apiBase}/api/v1/billing/available-upgrades?team_id=${teamId}` : `${apiBase}/api/v1/billing/available-upgrades`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch upgrade options');
      }

      const data = (await response.json()) as { upgrades?: UpgradePlan[] };
      setAvailablePlans(data.upgrades || []);
    } catch (err) {
      console.error('Error fetching upgrades:', err);
      setError('Failed to load upgrade options');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (priceId: string, productId: string, planName: string) => {
    if (!user) return;

    setUpgrading(productId);
    setError(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const { data: { session } } = await supabase.auth.getSession();
      const params = useParams();
      const routeTeamId = (params as any)?.teamId as string | undefined;

      let teamId: string | null = routeTeamId ?? null;
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!teamId && currentUser) {
        const { data: ownedTeams } = await supabase
          .from('teams')
          .select('id')
          .eq('owner_id', currentUser.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (ownedTeams && ownedTeams.length > 0) {
          teamId = ownedTeams[0].id as string;
        }

        if (!teamId) {
          const { data: memberTeams } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', currentUser.id)
            .in('status', ['active', 'pending']);

          if (memberTeams && memberTeams.length > 0) {
            const teamIds = memberTeams.map((m: any) => m.team_id);
            const { data: teams } = await supabase
              .from('teams')
              .select('id')
              .in('id', teamIds)
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(1);

            if (teams && teams.length > 0) teamId = teams[0].id as string;
          }
        }
      }
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const body: any = { newPriceId: priceId, newProductId: productId };
      if (teamId) body.team_id = teamId;

      const response = await fetch(`${apiBase}/api/v1/billing/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const result = (await response.json()) as { detail?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to upgrade');
      }

      // Success! Show confirmation and close
      alert(result.message || `Successfully upgraded to ${planName}!`);
      
      // Refresh user data
      await supabase.auth.refreshSession();
      
      onClose();
      
      // Reload page to reflect new permissions
      window.location.reload();
      
    } catch (err: any) {
      console.error('Error upgrading:', err);
      setError(err.message || 'Failed to upgrade subscription');
    } finally {
      setUpgrading(null);
    }
  };

  const getTriggerMessage = () => {
    if (message) return message;
    
    switch (trigger) {
      case 'paywall':
        return 'Upgrade your plan to access this feature';
      case 'usage':
        return "You've reached your plan's limit. Upgrade for more!";
      default:
        return 'Choose a plan that fits your needs';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription className="text-base">
            {getTriggerMessage()}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-destructive/10 border border-destructive px-4 py-3 text-destructive">
            {error}
          </div>
        ) : availablePlans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              You're already on our highest tier! 🎉
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Need more? Contact us for custom enterprise pricing.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availablePlans.map((plan) => (
              <Card
                key={plan.product_id}
                className="flex flex-col p-6 border-2 hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${plan.amount}
                    </span>
                    <span className="text-muted-foreground">
                      /{plan.interval}
                    </span>
                  </div>
                </div>

                {plan.metadata?.features && (
                  <ul className="space-y-2 mb-6 flex-1">
                    {JSON.parse(plan.metadata.features).map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  onClick={() => handleUpgrade(plan.price_id, plan.product_id, plan.name)}
                  disabled={upgrading !== null}
                  className="w-full mt-auto"
                  size="lg"
                >
                  {upgrading === plan.product_id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    <>
                      Upgrade Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            All upgrades are prorated and take effect immediately.
            <br />
            You'll only pay the difference for your current billing period.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
