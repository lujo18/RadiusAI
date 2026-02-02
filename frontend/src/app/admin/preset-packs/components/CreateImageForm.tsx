'use client';

import { useState, useRef } from 'react';
import { z } from 'zod';
import { Upload, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUploadPresetImage } from '@/lib/api/hooks/usePresetPacks';

const createImageSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size <= 10 * 1024 * 1024, 'File must be under 10MB'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  vibe: z.string().min(1, 'Vibe is required'),
  objects: z.array(z.string()),
  composition: z.string().min(1, 'Composition is required'),
  color_palette: z.string().min(1, 'Color palette is required'),
  aesthetic_score: z.number().min(0).max(1),
});

interface CreateImageFormProps {
  packId: string;
  onSuccess?: () => void;
}

export function CreateImageForm({ packId, onSuccess }: CreateImageFormProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [objectInput, setObjectInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    tags: [] as string[],
    vibe: '',
    objects: [] as string[],
    composition: '',
    color_palette: '',
    aesthetic_score: 0.8,
  });

  const uploadImageMutation = useUploadPresetImage();

  const validateForm = () => {
    const dataToValidate = { file, ...formData };
    try {
      createImageSchema.parse(dataToValidate);
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

  const handleFileChange = (newFile: File | null) => {
    if (newFile) {
      setFile(newFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(newFile);
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileChange(droppedFile);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addObject = () => {
    if (objectInput.trim() && !formData.objects.includes(objectInput.trim())) {
      setFormData(prev => ({
        ...prev,
        objects: [...prev.objects, objectInput.trim()]
      }));
      setObjectInput('');
    }
  };

  const removeObject = (object: string) => {
    setFormData(prev => ({
      ...prev,
      objects: prev.objects.filter(o => o !== object)
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !file) return;

    try {
      await uploadImageMutation.mutateAsync({
        pack_id: packId,
        file,
        ...formData,
      });
      // Reset form
      setFormData({
        tags: [],
        vibe: '',
        objects: [],
        composition: '',
        color_palette: '',
        aesthetic_score: 0.8,
      });
      setFile(null);
      setPreview(null);
      setTagInput('');
      setObjectInput('');
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* File Upload */}
      <div className="space-y-2">
        <Label className="text-foreground">Image File</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="space-y-3">
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFileChange(null)}
                className="btn-ghost"
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-8 h-8 mx-auto text-foreground/40" />
              <div>
                <p className="text-foreground/80">
                  Drag and drop an image here, or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-foreground/60">
                  PNG, JPG, WebP up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          className="hidden"
        />
        {errors.file && (
          <p className="text-sm text-red-500">{errors.file}</p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="text-foreground">Tags</Label>
        <div className="flex space-x-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tag..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="bg-background border-border"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            className="btn-ghost"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="group">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        {errors.tags && (
          <p className="text-sm text-red-500">{errors.tags}</p>
        )}
      </div>

      {/* Basic Fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vibe" className="text-foreground">Vibe</Label>
          <Input
            id="vibe"
            value={formData.vibe}
            onChange={(e) => setFormData(prev => ({ ...prev, vibe: e.target.value }))}
            placeholder="e.g., luxury, casual, professional"
            className="bg-background border-border"
          />
          {errors.vibe && (
            <p className="text-sm text-red-500">{errors.vibe}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="composition" className="text-foreground">Composition</Label>
          <Input
            id="composition"
            value={formData.composition}
            onChange={(e) => setFormData(prev => ({ ...prev, composition: e.target.value }))}
            placeholder="e.g., portrait, landscape, close-up"
            className="bg-background border-border"
          />
          {errors.composition && (
            <p className="text-sm text-red-500">{errors.composition}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color_palette" className="text-foreground">Color Palette</Label>
          <Input
            id="color_palette"
            value={formData.color_palette}
            onChange={(e) => setFormData(prev => ({ ...prev, color_palette: e.target.value }))}
            placeholder="e.g., dark_moody, bright_vibrant"
            className="bg-background border-border"
          />
          {errors.color_palette && (
            <p className="text-sm text-red-500">{errors.color_palette}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="aesthetic_score" className="text-foreground">
            Aesthetic Score (0-1)
          </Label>
          <Input
            id="aesthetic_score"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={formData.aesthetic_score}
            onChange={(e) => setFormData(prev => ({ ...prev, aesthetic_score: parseFloat(e.target.value) || 0 }))}
            placeholder="0.85"
            className="bg-background border-border"
          />
          {errors.aesthetic_score && (
            <p className="text-sm text-red-500">{errors.aesthetic_score}</p>
          )}
        </div>
      </div>

      {/* Objects */}
      <div className="space-y-2">
        <Label className="text-foreground">Objects in Image</Label>
        <div className="flex space-x-2">
          <Input
            value={objectInput}
            onChange={(e) => setObjectInput(e.target.value)}
            placeholder="Add object..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObject())}
            className="bg-background border-border"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addObject}
            className="btn-ghost"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {formData.objects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.objects.map((object) => (
              <Badge key={object} variant="outline" className="group">
                {object}
                <button
                  type="button"
                  onClick={() => removeObject(object)}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          disabled={uploadImageMutation.isPending}
          className="btn-primary flex-1"
        >
          {uploadImageMutation.isPending ? 'Uploading...' : 'Upload Image'}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={() => {
            setFormData({
              tags: [],
              vibe: '',
              objects: [],
              composition: '',
              color_palette: '',
              aesthetic_score: 0.8,
            });
            setFile(null);
            setPreview(null);
            setTagInput('');
            setObjectInput('');
          }}
          className="btn-ghost"
        >
          Reset
        </Button>
      </div>
    </form>
  );
}