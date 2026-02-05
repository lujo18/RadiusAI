import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { AutomationWizardData } from '../AutomationWizard';
import { useBrandCtas } from '@/lib/api/hooks/useBrandCtas';

interface Step3CTAProps {
  data: AutomationWizardData;
  onChange: (data: AutomationWizardData) => void;
  brandId: string;
}

export function AutomationWizardStep3CTA({ data, onChange, brandId }: Step3CTAProps) {
  const toggleCTA = (ctaId: string) => {
    const newCtaIds = data.ctaIds.includes(ctaId)
      ? data.ctaIds.filter((id) => id !== ctaId)
      : [...data.ctaIds, ctaId];

    onChange({
      ...data,
      ctaIds: newCtaIds,
    });
  };

  const { data: ctas, isLoading } = useBrandCtas(brandId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const activeCtas = ctas?.filter((cta) => cta.is_active) || [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium">Select Call-To-Actions</h3>
        <p className="text-sm text-foreground/60 mb-4">
          Choose which CTAs to use with this automation. CTAs will rotate with each post generation.
        </p>
      </div>

      <div className="space-y-3">
        {activeCtas.length > 0 ? (
          activeCtas.map((cta) => (
            <div
              key={cta.id}
              className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-foreground/5 hover:border-border/80 transition-all cursor-pointer"
              onClick={() => toggleCTA(cta.id)}
            >
              <Checkbox
                id={`cta-${cta.id}`}
                checked={data.ctaIds.includes(cta.id)}
                onCheckedChange={() => toggleCTA(cta.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor={`cta-${cta.id}`}
                  className="cursor-pointer block"
                >
                  <p className="font-medium text-sm">{cta.label}</p>
                  <p className="text-xs text-foreground/60 mt-1">{cta.cta_text}</p>
                  {cta.cta_url && (
                    <p className="text-xs text-foreground/50 mt-1 truncate">
                      {cta.cta_url}
                    </p>
                  )}
                </Label>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg bg-foreground/5 border border-border p-4 text-center">
            <p className="text-sm text-foreground/60">
              No active CTAs found. Create one in Brand Settings → Call-To-Actions
            </p>
          </div>
        )}
      </div>

      {data.ctaIds.length > 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <p className="text-sm font-medium">
            Selected: {data.ctaIds.length} CTA{data.ctaIds.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-foreground/60 mt-1">
            CTAs will be rotated with each generated post
          </p>
        </div>
      )}

      <div className="rounded-lg bg-foreground/5 border border-border p-4 space-y-2">
        <h4 className="font-medium text-sm">💡 How CTAs Work</h4>
        <ul className="text-sm text-foreground/70 space-y-1">
          <li>✓ Selected CTAs will be added to the final slide of each post</li>
          <li>✓ CTAs rotate through selected options with each generation</li>
          <li>✓ Only active CTAs appear in the list</li>
          <li>✓ You can edit CTAs in Brand Settings</li>
        </ul>
      </div>
    </div>
  );
}
