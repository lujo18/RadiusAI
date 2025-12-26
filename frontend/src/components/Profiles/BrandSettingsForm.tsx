import { useState } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import type { BrandSettings } from '@/types';

interface BrandSettingsFormProps {
  initialValues?: BrandSettings;
  onSubmit: (settings: BrandSettings) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

const defaultSettings: BrandSettings = {
  name: '',
  niche: '',
  aesthetic: '',
  target_audience: '',
  brand_voice: '',
  content_pillars: [],
  tone_of_voice: 'casual',
  emoji_usage: 'moderate',
  forbidden_words: [],
  preferred_words: [],
  hashtag_style: 'mixed',
  hashtag_count: 10,
  hashtags: [],
};

export default function BrandSettingsForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: BrandSettingsFormProps) {
  const [settings, setSettings] = useState<BrandSettings>(
    initialValues || defaultSettings
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(settings);
  };

  const updateField = (field: keyof BrandSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Brand Info */}
      <Section title="Brand Identity">
        <InputField
          label="Profile Name"
          placeholder="e.g., Fitness Brand, Tech Reviews, Lifestyle Blog"
          value={settings.name}
          onChange={(v) => updateField('name', v)}
          required
        />
        <InputField
          label="Niche"
          placeholder="e.g., Self Improvement, Fitness, Tech"
          value={settings.niche}
          onChange={(v) => updateField('niche', v)}
          required
        />
        <InputField
          label="Aesthetic"
          placeholder="e.g., Dark and grungy, Minimalist, Vibrant"
          value={settings.aesthetic}
          onChange={(v) => updateField('aesthetic', v)}
          required
        />
        <InputField
          label="Target Audience"
          placeholder="e.g., Gen Z, 18-25, professionals"
          value={settings.target_audience}
          onChange={(v) => updateField('target_audience', v)}
          required
        />
        <InputField
          label="Brand Voice"
          placeholder="e.g., Raw, authentic, no BS"
          value={settings.brand_voice}
          onChange={(v) => updateField('brand_voice', v)}
          required
        />
      </Section>

      {/* Content Strategy */}
      <Section title="Content Strategy">
        <TagInput
          label="Content Pillars"
          placeholder="Add a pillar (e.g., confidence, dating, fitness)"
          tags={settings.content_pillars}
          onChange={(tags) => updateField('content_pillars', tags)}
        />
      </Section>

      {/* Writing Style */}
      <Section title="Writing Style">
        <SelectField
          label="Tone of Voice"
          value={settings.tone_of_voice}
          onChange={(v) => updateField('tone_of_voice', v as any)}
          options={[
            { value: 'casual', label: 'Casual' },
            { value: 'professional', label: 'Professional' },
            { value: 'humorous', label: 'Humorous' },
            { value: 'edgy', label: 'Edgy' },
            { value: 'inspirational', label: 'Inspirational' },
          ]}
        />
        <SelectField
          label="Emoji Usage"
          value={settings.emoji_usage}
          onChange={(v) => updateField('emoji_usage', v as any)}
          options={[
            { value: 'none', label: 'None' },
            { value: 'minimal', label: 'Minimal' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'heavy', label: 'Heavy' },
          ]}
        />
        <div className="grid grid-cols-2 gap-4">
          <TagInput
            label="Forbidden Words"
            placeholder="Words to avoid"
            tags={settings.forbidden_words}
            onChange={(tags) => updateField('forbidden_words', tags)}
          />
          <TagInput
            label="Preferred Words"
            placeholder="Words to emphasize"
            tags={settings.preferred_words}
            onChange={(tags) => updateField('preferred_words', tags)}
          />
        </div>
      </Section>

      {/* Hashtag Strategy */}
      <Section title="Hashtag Strategy">
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Hashtag Style"
            value={settings.hashtag_style}
            onChange={(v) => updateField('hashtag_style', v as any)}
            options={[
              { value: 'niche', label: 'Niche-focused' },
              { value: 'trending', label: 'Trending' },
              { value: 'mixed', label: 'Mixed' },
            ]}
          />
          <NumberField
            label="Hashtag Count"
            value={settings.hashtag_count}
            onChange={(v) => updateField('hashtag_count', v)}
            min={5}
            max={30}
          />
        </div>
        <TagInput
          label="Custom Hashtags (Optional)"
          placeholder="Add hashtag without # (e.g., selflove)"
          tags={settings.hashtags || []}
          onChange={(tags) => updateField('hashtags', tags)}
        />
      </Section>

      {/* Actions */}
      <FormActions
        onCancel={onCancel}
        submitLabel={submitLabel}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}

// Reusable Components

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
  required = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 transition"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 transition"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        min={min}
        max={max}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 transition"
      />
    </div>
  );
}

function TagInput({
  label,
  placeholder,
  tags,
  onChange,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder={placeholder}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500 transition"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition"
        >
          <FiPlus />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-gray-700 rounded-full text-sm flex items-center gap-2"
            >
              {tag}
              <button type="button" onClick={() => removeTag(i)}>
                <FiX className="text-gray-400 hover:text-white" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function FormActions({
  onCancel,
  submitLabel,
  isSubmitting,
}: {
  onCancel: () => void;
  submitLabel: string;
  isSubmitting: boolean;
}) {
  return (
    <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2.5 border border-gray-700 rounded-lg hover:bg-gray-800 transition"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 rounded-lg font-semibold transition disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}
