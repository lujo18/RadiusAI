import React from 'react';
import { useTemplates } from '@/lib/api/hooks/useTemplates';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { AutomationWizardData } from '../AutomationWizard';

interface Step2Props {
  data: AutomationWizardData;
  onChange: (data: AutomationWizardData) => void;
  brandId: string;
}

export function AutomationWizardStep2({ data, onChange, brandId }: Step2Props) {
  const { data: templates, isLoading } = useTemplates(brandId);

  const toggleTemplate = (templateId: string) => {
    const newIds = data.templateIds.includes(templateId)
      ? data.templateIds.filter((id) => id !== templateId)
      : [...data.templateIds, templateId];

    onChange({
      ...data,
      templateIds: newIds,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground/60">
          No templates found. Create a template first to set up an automation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-3">Select Templates to Rotate</h3>
        <p className="text-sm text-foreground/60 mb-4">
          Choose which templates this automation will use. They'll rotate in order
          on each scheduled post.
        </p>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-foreground/5 transition-colors cursor-pointer"
            onClick={() => toggleTemplate(template.id)}
          >
            <Checkbox
              id={`template-${template.id}`}
              checked={data.templateIds.includes(template.id)}
              onCheckedChange={() => toggleTemplate(template.id)}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor={`template-${template.id}`}
                className="font-medium cursor-pointer"
              >
                {template.name}
              </Label>
              <p className="text-xs text-foreground/60 mt-1">
                {template.category || 'General'} •{' '}
                {template.status === 'active' ? '✓ Active' : 'Inactive'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {data.templateIds.length > 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <p className="text-sm font-medium">
            Selected: {data.templateIds.length} template{data.templateIds.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-foreground/60 mt-1">
            These templates will rotate cyclically with each automation run
          </p>
        </div>
      )}

      <div className="rounded-lg bg-foreground/5 border border-border p-4">
        <h4 className="font-medium text-sm mb-2">💡 Tip</h4>
        <p className="text-sm text-foreground/70">
          Use different templates with varied layouts to keep your content fresh
          and test what resonates best with your audience.
        </p>
      </div>
    </div>
  );
}
