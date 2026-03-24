'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import UpgradeFlow from './UpgradeFlow';
import { cn } from '@/lib/utils';

interface UsageData {
  posts_used: number;
  posts_limit: number;
  templates_used: number;
  templates_limit: number;
  posts_remaining: number;
  templates_remaining: number;
}

interface UsageBannerProps {
  className?: string;
  compact?: boolean;
}

export default function UsageBanner({ className, compact = false }: UsageBannerProps) {
  const { user } = useAuthStore();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeFlow, setShowUpgradeFlow] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUsage();
    }
  }, [user]);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(`${apiBase}/api/usage/team/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as UsageData;
        setUsage(data);
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) return null;

  const postsPercentage = (usage.posts_used / usage.posts_limit) * 100;
  const templatesPercentage = (usage.templates_used / usage.templates_limit) * 100;

  // Determine warning level
  const isPostsCritical = usage.posts_remaining === 0;
  const isPostsWarning = postsPercentage >= 80 && !isPostsCritical;
  const isTemplatesCritical = usage.templates_remaining === 0;
  const isTemplatesWarning = templatesPercentage >= 80 && !isTemplatesCritical;

  const showBanner = isPostsCritical || isPostsWarning || isTemplatesCritical || isTemplatesWarning;

  if (!showBanner) return null;

  const isCritical = isPostsCritical || isTemplatesCritical;
  const isWarning = isPostsWarning || isTemplatesWarning;

  if (compact) {
    return (
      <>
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg border",
          isCritical && "bg-destructive/10 border-destructive",
          isWarning && "bg-warning/10 border-warning",
          className
        )}>
          <AlertCircle className={cn(
            "w-5 h-5 flex-shrink-0",
            isCritical && "text-destructive",
            isWarning && "text-warning"
          )} />
          <p className="text-sm flex-1">
            {isCritical ? (
              <span className="font-semibold">Limit reached</span>
            ) : (
              <span>Running low on credits</span>
            )}
          </p>
          <Button
            size="sm"
            variant={isCritical ? "destructive" : "default"}
            onClick={() => setShowUpgradeFlow(true)}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Upgrade
          </Button>
        </div>

        <UpgradeFlow
          isOpen={showUpgradeFlow}
          onClose={() => setShowUpgradeFlow(false)}
          trigger="usage"
          message={isCritical ? "You've hit your plan limit. Upgrade now to continue!" : "Upgrade your plan for unlimited access"}
        />
      </>
    );
  }

  return (
    <>
      <div className={cn(
        "rounded-lg border p-6",
        isCritical && "bg-destructive/5 border-destructive",
        isWarning && "bg-warning/5 border-warning",
        className
      )}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isCritical && "bg-destructive/10",
              isWarning && "bg-warning/10"
            )}>
              {isCritical ? (
                <AlertCircle className="w-5 h-5 text-destructive" />
              ) : (
                <TrendingUp className="w-5 h-5 text-warning" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {isCritical ? "Plan Limit Reached" : "Approaching Plan Limit"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isCritical
                  ? "Upgrade now to continue creating"
                  : "Consider upgrading for unlimited access"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowUpgradeFlow(true)}
            variant={isCritical ? "destructive" : "default"}
            size="lg"
          >
            <Zap className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>

        <div className="space-y-4">
          {/* Posts Usage */}
          {(isPostsCritical || isPostsWarning) && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Posts</span>
                <span className={cn(
                  "font-semibold",
                  isPostsCritical && "text-destructive",
                  isPostsWarning && "text-warning"
                )}>
                  {usage.posts_used} / {usage.posts_limit}
                </span>
              </div>
              <Progress 
                value={postsPercentage} 
                className={cn(
                  "h-2",
                  isPostsCritical && "[&>div]:bg-destructive",
                  isPostsWarning && "[&>div]:bg-warning"
                )}
              />
              {usage.posts_remaining > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {usage.posts_remaining} posts remaining this period
                </p>
              )}
            </div>
          )}

          {/* Templates Usage */}
          {(isTemplatesCritical || isTemplatesWarning) && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Templates</span>
                <span className={cn(
                  "font-semibold",
                  isTemplatesCritical && "text-destructive",
                  isTemplatesWarning && "text-warning"
                )}>
                  {usage.templates_used} / {usage.templates_limit}
                </span>
              </div>
              <Progress 
                value={templatesPercentage} 
                className={cn(
                  "h-2",
                  isTemplatesCritical && "[&>div]:bg-destructive",
                  isTemplatesWarning && "[&>div]:bg-warning"
                )}
              />
              {usage.templates_remaining > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {usage.templates_remaining} templates remaining this period
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <UpgradeFlow
        isOpen={showUpgradeFlow}
        onClose={() => setShowUpgradeFlow(false)}
        trigger="usage"
        message={isCritical ? "You've hit your plan limit. Upgrade now to continue!" : "Upgrade your plan for unlimited access"}
      />
    </>
  );
}
