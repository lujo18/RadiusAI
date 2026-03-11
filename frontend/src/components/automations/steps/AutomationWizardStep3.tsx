import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { AutomationWizardData } from '../AutomationWizard';
import { useBrandIntegrations } from '@/features/brand/hooksIntegrations';
import { SocialItem } from '@/components/platform-integrations/SocialItem';

interface Step3Props {
  data: AutomationWizardData;
  onChange: (data: AutomationWizardData) => void;
}



export function AutomationWizardStep3({ data, onChange }: Step3Props) {
  const togglePlatform = (platform: 'instagram' | 'tiktok' | 'facebook' | 'linkedin') => {
    const newPlatforms = data.platforms.includes(platform)
      ? data.platforms.filter((p) => p !== platform)
      : [...data.platforms, platform];

    onChange({
      ...data,
      platforms: newPlatforms,
    });
  };

  const {data: socialIntegrations, isLoading} = useBrandIntegrations(data.brandId)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="">Select Connected Accounts</h3>
        <p className="text-sm text-foreground/60 mb-6">
          Choose which social media accounts this automation will post to. Make sure
          you've connected these accounts in your settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {socialIntegrations?.map((integration) => (
          <div
            key={integration.id}
            className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-foreground/5 hover:border-border/80 transition-all cursor-pointer"
            onClick={() => togglePlatform(integration.id as any)}
          >
            <Checkbox
              id={`platform-${integration.id}`}
              checked={data.platforms.includes(integration.id as any)}
              onCheckedChange={() => togglePlatform(integration.id as any)}
              className="mt-1"
            />
            <SocialItem platformKey={integration.platform} integration={integration}/>
          </div>
        ))}
      </div>

      {data.platforms.length > 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <p className="text-sm font-medium">
            Selected: {data.platforms.length} platform{data.platforms.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-foreground/60 mt-1">
            Your automation will post to: {data.platforms.join(', ')}
          </p>
        </div>
      )}

      <div className="rounded-lg bg-foreground/5 border border-border p-4 space-y-2">
        <h4 className="font-medium text-sm">📌 Requirements</h4>
        <ul className="text-sm text-foreground/70 space-y-1">
          <li>✓ Accounts must be connected in settings</li>
          <li>✓ Content is automatically formatted per platform</li>
          <li>✓ Posts are scheduled at the same time across platforms</li>
          <li>✓ Captions are adapted for each platform's best practices</li>
        </ul>
      </div>

      {/* Posting behaviour */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Posting Behaviour</h4>

        {/* Post Automatically */}
        <div className="rounded-lg border border-border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="post-automatically" className="font-medium cursor-pointer">
              Post automatically
            </Label>
            <Switch
              id="post-automatically"
              checked={data.postAutomatically}
              onCheckedChange={(checked) =>
                onChange({
                  ...data,
                  postAutomatically: checked,
                  postAsDraft: checked ? data.postAsDraft : false,
                })
              }
            />
          </div>
          <p className="text-xs text-foreground/60">
            When <span className="font-medium">off</span>, generated posts are saved inside Radius
            for you to review and publish manually whenever you&apos;re ready.{' '}
            When <span className="font-medium">on</span>, Radius will publish to your connected
            accounts at the scheduled time.
          </p>
        </div>

        {/* Post as Draft */}
        <div
          className={`rounded-lg border p-4 space-y-2 transition-opacity ${
            data.postAutomatically
              ? 'border-border opacity-100'
              : 'border-border/40 opacity-40 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between">
            <Label
              htmlFor="post-as-draft"
              className={`font-medium ${
                data.postAutomatically ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              Send as draft
            </Label>
            <Switch
              id="post-as-draft"
              checked={data.postAsDraft}
              disabled={!data.postAutomatically}
              onCheckedChange={(checked) =>
                onChange({ ...data, postAsDraft: checked })
              }
            />
          </div>
          <Badge variant="secondary">Recommended for accounts under 2 weeks old</Badge>
          <p className="text-xs mt-2 text-foreground/60">
            When <span className="font-medium">on</span>, the post is sent to your TikTok account
            as a draft — you&apos;ll receive a notification to review, edit, and publish it
            directly in the TikTok app.{' '}
            When <span className="font-medium">off</span>, content is published directly to your
            feed without additional review.
          </p>
        </div>
      </div>
    </div>
  );
}
