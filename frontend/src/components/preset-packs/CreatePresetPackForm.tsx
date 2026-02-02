'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePresetPack } from '@/lib/api/hooks/usePresetPacks';

const createPackSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long'),
  accessibility: z.enum(['global', 'private']),
});

interface CreatePresetPackFormProps {
  onSuccess?: () => void;
  defaultAccessibility?: 'global' | 'private';
}

export function CreatePresetPackForm({ 
  onSuccess,
  defaultAccessibility = 'private'
}: CreatePresetPackFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    accessibility: defaultAccessibility as 'global' | 'private',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const createPackMutation = useCreatePresetPack();

  const validateForm = () => {
    try {
      createPackSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path.length > 0) {
            fieldErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await createPackMutation.mutateAsync(formData);
      setFormData({ 
        name: '', 
        description: '', 
        accessibility: defaultAccessibility 
      });
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">Pack Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., My Fashion Collection"
            className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your image collection..."
            className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        <div className="bg-card/30 border border-border rounded-lg p-4">
          <Label className="text-foreground text-sm">Accessibility</Label>
          <p className="text-sm text-foreground/60 mt-1">
            This pack will be <strong>private</strong> and only visible to you.
          </p>
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          disabled={createPackMutation.isPending}
          className="btn-primary flex-1"
        >
          {createPackMutation.isPending ? 'Creating...' : 'Create Pack'}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={() => setFormData({ 
            name: '', 
            description: '', 
            accessibility: defaultAccessibility 
          })}
          className="btn-ghost"
        >
          Reset
        </Button>
      </div>
    </form>
  );
}