"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog";
import { useCreateBrand } from "@/lib/api/hooks";
import type { Database } from "@/types/database";
import { getCurrentUser } from "@/lib/supabase/auth";
import { useUserProfile } from "@/lib/api/hooks/useUser";

const STORAGE_KEY = "brand_wizard_draft";
const STORAGE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

type BrandSettingsData = {
  name: string;
  niche: string;
  aesthetic: string;
  target_audience: string;
  brand_voice: string;
  content_pillars: string[];
  tone_of_voice: string;
  emoji_usage: string;
  forbidden_words: string[];
  preferred_words: string[];
  hashtag_style: string;
  hashtag_count: number;
  hashtags: string[] | null;
};

interface BrandSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultSettings: BrandSettingsData = {
  name: "",
  niche: "",
  aesthetic: "",
  target_audience: "",
  brand_voice: "",
  content_pillars: [],
  tone_of_voice: "casual",
  emoji_usage: "moderate",
  forbidden_words: [],
  preferred_words: [],
  hashtag_style: "mixed",
  hashtag_count: 10,
  hashtags: [],
};

export default function BrandSetupWizard({
  isOpen,
  onClose,
}: BrandSetupWizardProps) {
  const router = useRouter();
  const useUser = useUserProfile()
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState<BrandSettingsData>(defaultSettings);
  const [brandDescription, setBrandDescription] = useState("");
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const createBrandMutation = useCreateBrand();

  // Load from local storage on mount or when dialog opens
  useEffect(() => {
    if (isOpen && !hasLoadedFromStorage) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const now = Date.now();
          
          // Check if data is still valid (not expired)
          if (parsed.timestamp && now - parsed.timestamp < STORAGE_TTL) {
            setSettings(parsed.settings || defaultSettings);
            setBrandDescription(parsed.description || "");
            setCurrentStep(parsed.step || 0);
          } else {
            // Data expired, clear it
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (error) {
          console.error("Failed to load wizard data from storage:", error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setHasLoadedFromStorage(true);
    }
  }, [isOpen, hasLoadedFromStorage]);

  // Save to local storage whenever settings change
  useEffect(() => {
    if (hasLoadedFromStorage && isOpen) {
      const toSave = {
        settings,
        description: brandDescription,
        step: currentStep,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [settings, brandDescription, currentStep, hasLoadedFromStorage, isOpen]);

  const updateField = (field: keyof BrandSettingsData, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = (field: "content_pillars" | "forbidden_words" | "preferred_words" | "hashtags", value: string) => {
    if (!value.trim()) return;
    const currentTags = (settings[field] as string[]) || [];
    if (!currentTags.includes(value)) {
      updateField(field, [...currentTags, value]);
    }
  };

  const handleRemoveTag = (field: "content_pillars" | "forbidden_words" | "preferred_words" | "hashtags", index: number) => {
    const currentTags = (settings[field] as string[]) || [];
    updateField(field, currentTags.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDiscardDraft = () => {
    if (confirm("Are you sure you want to discard this draft? This cannot be undone.")) {
      localStorage.removeItem(STORAGE_KEY);
      setSettings(defaultSettings);
      setBrandDescription("");
      setCurrentStep(0);
      setHasLoadedFromStorage(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Get current user ID from auth store or local storage
    ;

      const response = useUser.data?.id
      
      if (!response) {
        alert('Failed to get user information');
        return;
      }

      const userId = response;

      // Create brand object with brand_settings as JSON
      const brandData = {
        user_id: userId,
        late_profile_id: `profile_${Date.now()}`, // Temp ID - will be replaced with Late API profile ID
        description: brandDescription || null,
        brand_settings: settings, // Pass settings as JSON object
        post_count: 0,
        template_count: 0,
      };

      await createBrandMutation.mutateAsync(brandData);
      
      // Clear local storage on successful completion
      localStorage.removeItem(STORAGE_KEY);
      
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Failed to create brand:", error);
      alert("Failed to create brand. Please try again.");
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 0: // Brand Name & Niche
        return !!(settings.name && settings.niche);
      case 1: // Aesthetic & Audience
        return !!(settings.aesthetic && settings.target_audience);
      case 2: // Voice & Pillars
        return !!(settings.brand_voice && settings.content_pillars && settings.content_pillars.length > 0);
      case 3: // Tone & Emojis
        return !!(settings.tone_of_voice && settings.emoji_usage);
      case 4: // Hashtags & Preferences
        return true; // Optional fields
      default:
        return false;
    }
  };

  const steps = [
    {
      title: "Brand Identity",
      description: "Tell us about your brand's core identity",
    },
    {
      title: "Aesthetic & Audience",
      description: "Define your visual style and target audience",
    },
    {
      title: "Brand Voice",
      description: "Establish your brand personality and pillars",
    },
    {
      title: "Tone & Emojis",
      description: "Set your communication style",
    },
    {
      title: "Hashtags & Preferences",
      description: "Configure hashtag strategy and word preferences",
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step0BrandIdentity 
            settings={settings} 
            updateField={updateField}
            description={brandDescription}
            setDescription={setBrandDescription}
          />
        );
      case 1:
        return <Step1AestheticAudience settings={settings} updateField={updateField} />;
      case 2:
        return (
          <Step2BrandVoice 
            settings={settings} 
            updateField={updateField} 
            handleAddTag={(value: string) => handleAddTag("content_pillars", value)}
            handleRemoveTag={(index: number) => handleRemoveTag("content_pillars", index)}
          />
        );
      case 3:
        return <Step3ToneEmojis settings={settings} updateField={updateField} />;
      case 4:
        return (
          <Step4HashtagsPreferences 
            settings={settings} 
            updateField={updateField} 
            handleAddTag={(field: "forbidden_words" | "preferred_words" | "hashtags", value: string) => handleAddTag(field, value)}
            handleRemoveTag={(field: "forbidden_words" | "preferred_words" | "hashtags", index: number) => handleRemoveTag(field, index)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle>{steps[currentStep].title}</DialogTitle>
              <DialogDescription>{steps[currentStep].description}</DialogDescription>
            </div>
            {hasLoadedFromStorage && currentStep === 0 && settings.name && (
              <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap ml-2">
                Draft saved
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index <= currentStep
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderStepContent()}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDiscardDraft}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Discard Draft
          </Button>

          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex-1" />

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={createBrandMutation.isPending || !isStepValid()}
              className="flex items-center gap-2"
            >
              {createBrandMutation.isPending ? "Creating..." : "Create Brand"}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Step Components

function Step0BrandIdentity({
  settings,
  updateField,
  description,
  setDescription,
}: {
  settings: BrandSettingsData;
  updateField: (field: keyof BrandSettingsData, value: any) => void;
  description: string;
  setDescription: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Brand Name *</label>
        <input
          type="text"
          placeholder="e.g., Fitness Brand, Tech Reviews"
          value={settings.name || ""}
          onChange={(e) => updateField("name", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Brand Description</label>
        <textarea
          placeholder="Optional: Describe your brand in a few words"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Niche *</label>
        <input
          type="text"
          placeholder="e.g., Self Improvement, Fitness, Tech"
          value={settings.niche || ""}
          onChange={(e) => updateField("niche", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}

function Step1AestheticAudience({
  settings,
  updateField,
}: {
  settings: BrandSettingsData;
  updateField: (field: keyof BrandSettingsData, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Aesthetic *</label>
        <input
          type="text"
          placeholder="e.g., Dark and grungy, Minimalist, Vibrant"
          value={settings.aesthetic || ""}
          onChange={(e) => updateField("aesthetic", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Target Audience *</label>
        <input
          type="text"
          placeholder="e.g., Gen Z, 18-25, professionals"
          value={settings.target_audience || ""}
          onChange={(e) => updateField("target_audience", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}

function Step2BrandVoice({
  settings,
  updateField,
  handleAddTag,
  handleRemoveTag,
}: {
  settings: BrandSettingsData;
  updateField: (field: keyof BrandSettingsData, value: any) => void;
  handleAddTag: (value: string) => void;
  handleRemoveTag: (index: number) => void;
}) {
  const [newPillar, setNewPillar] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Brand Voice *</label>
        <input
          type="text"
          placeholder="e.g., Raw, authentic, no BS"
          value={settings.brand_voice || ""}
          onChange={(e) => updateField("brand_voice", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Content Pillars * (min. 1)</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="e.g., confidence, dating, fitness"
            value={newPillar}
            onChange={(e) => setNewPillar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddTag(newPillar);
                setNewPillar("");
              }
            }}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleAddTag(newPillar);
              setNewPillar("");
            }}
          >
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {settings.content_pillars?.map((pillar, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
            >
              {pillar}
              <button
                onClick={() => handleRemoveTag(index)}
                className="ml-1 text-lg font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3ToneEmojis({
  settings,
  updateField,
}: {
  settings: BrandSettingsData;
  updateField: (field: keyof BrandSettingsData, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Tone of Voice *</label>
        <select
          value={settings.tone_of_voice || "casual"}
          onChange={(e) => updateField("tone_of_voice", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="casual">Casual</option>
          <option value="professional">Professional</option>
          <option value="humorous">Humorous</option>
          <option value="edgy">Edgy</option>
          <option value="inspirational">Inspirational</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Emoji Usage *</label>
        <select
          value={settings.emoji_usage || "moderate"}
          onChange={(e) => updateField("emoji_usage", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="none">None</option>
          <option value="minimal">Minimal</option>
          <option value="moderate">Moderate</option>
          <option value="heavy">Heavy</option>
        </select>
      </div>
    </div>
  );
}

function Step4HashtagsPreferences({
  settings,
  updateField,
  handleAddTag,
  handleRemoveTag,
}: {
  settings: BrandSettingsData;
  updateField: (field: keyof BrandSettingsData, value: any) => void;
  handleAddTag: (field: "forbidden_words" | "preferred_words" | "hashtags", value: string) => void;
  handleRemoveTag: (field: "forbidden_words" | "preferred_words" | "hashtags", index: number) => void;
}) {
  const [newForbiddenWord, setNewForbiddenWord] = useState("");
  const [newPreferredWord, setNewPreferredWord] = useState("");
  const [newHashtag, setNewHashtag] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Hashtag Style</label>
        <select
          value={settings.hashtag_style || "mixed"}
          onChange={(e) => updateField("hashtag_style", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="niche">Niche</option>
          <option value="trending">Trending</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Hashtag Count</label>
        <input
          type="number"
          min="0"
          max="30"
          value={settings.hashtag_count || 10}
          onChange={(e) => updateField("hashtag_count", parseInt(e.target.value))}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Forbidden Words</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Words to avoid..."
            value={newForbiddenWord}
            onChange={(e) => setNewForbiddenWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddTag("forbidden_words", newForbiddenWord);
                setNewForbiddenWord("");
              }
            }}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleAddTag("forbidden_words", newForbiddenWord);
              setNewForbiddenWord("");
            }}
          >
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {settings.forbidden_words?.map((word, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm"
            >
              {word}
              <button
                onClick={() => handleRemoveTag("forbidden_words", index)}
                className="ml-1 text-lg font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Preferred Words</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Words to use..."
            value={newPreferredWord}
            onChange={(e) => setNewPreferredWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddTag("preferred_words", newPreferredWord);
                setNewPreferredWord("");
              }
            }}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleAddTag("preferred_words", newPreferredWord);
              setNewPreferredWord("");
            }}
          >
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {settings.preferred_words?.map((word, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
            >
              {word}
              <button
                onClick={() => handleRemoveTag("preferred_words", index)}
                className="ml-1 text-lg font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Brand Hashtags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="e.g., #YourBrand"
            value={newHashtag}
            onChange={(e) => setNewHashtag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddTag("hashtags", newHashtag);
                setNewHashtag("");
              }
            }}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleAddTag("hashtags", newHashtag);
              setNewHashtag("");
            }}
          >
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {settings.hashtags?.map((tag, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag("hashtags", index)}
                className="ml-1 text-lg font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
