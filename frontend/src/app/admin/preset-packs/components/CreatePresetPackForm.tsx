'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreatePresetPack } from '@/features/presetPacks/hooks';

const createPackSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long'),
  accessibility: z.enum(['global', 'private']),
});

interface CreatePresetPackFormProps {
  onSuccess?: () => void;
}

export function CreatePresetPackForm({ onSuccess }: CreatePresetPackFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    accessibility: 'global' as 'global' | 'private',
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
      setFormData({ name: '', description: '', accessibility: 'global' });
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
            placeholder="e.g., Luxury Men Fashion"
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
            placeholder="High-quality images of men in luxury fashion settings..."
            className="bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-foreground">Accessibility</Label>
          <RadioGroup
            value={formData.accessibility}
            onValueChange={(value) => setFormData(prev => ({ ...prev, accessibility: value as 'global' | 'private' }))}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="global" id="global" />
              <Label htmlFor="global" className="text-foreground/80">
                Global - Available to all users
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private" className="text-foreground/80">
                Private - Admin only
              </Label>
            </div>
          </RadioGroup>
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
          onClick={() => setFormData({ name: '', description: '', accessibility: 'global' })}
          className="btn-ghost"
        >
          Reset
        </Button>
      </div>
    </form>
  );
}