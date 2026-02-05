import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AutomationWizardData } from '../AutomationWizard';

interface Step1Props {
  data: AutomationWizardData;
  onChange: (data: AutomationWizardData) => void;
}

export function AutomationWizardStep1({ data, onChange }: Step1Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="automation-name">
          Automation Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="automation-name"
          placeholder="e.g., Weekly Newsletter"
          value={data.name}
          onChange={(e) =>
            onChange({
              ...data,
              name: e.target.value,
            })
          }
          className="focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <p className="text-xs text-foreground/60">
          A clear name helps you identify this automation later
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="automation-description">
          Description <span className="text-foreground/60">(Optional)</span>
        </Label>
        <Textarea
          id="automation-description"
          placeholder="Describe what this automation does, target audience, content themes..."
          value={data.description}
          onChange={(e) =>
            onChange({
              ...data,
              description: e.target.value,
            })
          }
          rows={4}
          className="focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <p className="text-xs text-foreground/60">
          Notes for your team about the purpose and strategy
        </p>
      </div>

      <div className="rounded-lg bg-foreground/5 border border-border p-4">
        <h4 className="font-medium text-sm mb-2">Next Steps</h4>
        <ul className="text-sm text-foreground/70 space-y-1">
          <li>✓ Select which templates to rotate through</li>
          <li>✓ Choose which social media accounts to post to</li>
          <li>✓ Set up your posting schedule</li>
          <li>✓ Review and create</li>
        </ul>
      </div>
    </div>
  );
}
