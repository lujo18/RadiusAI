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
import { useCreateBrand } from '@/features/brand/hooks';
import { useGenerateBrand } from '@/features/generation/hooks';
import type { Database } from "@/types/database";
import { getCurrentUser } from "@/lib/supabase/auth";
import { useUserProfile } from '@/features/user/hooks';

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
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const generateMutation = useGenerateBrand();

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

      const response = (useUser.data as any)?.id
      
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
    // top-level steps mapping:
    // 0: StartChoice
    // 1: AIInputPage
    // 2: Identity (Step0BrandIdentity)
    // 3: Aesthetic (Step1AestheticAudience)
    // 4: Voice (Step2BrandVoice)
    // 5: Tone (Step3ToneEmojis)
    // 6: Hashtags (Step4HashtagsPreferences)
    switch (currentStep) {
      case 2: // Identity
        return !!(settings.name && settings.niche);
      case 3: // Aesthetic
        return !!(settings.aesthetic && settings.target_audience);
      case 4: // Voice & Pillars
        return !!(settings.brand_voice && settings.content_pillars && settings.content_pillars.length > 0);
      case 5: // Tone & Emojis
        return !!(settings.tone_of_voice && settings.emoji_usage);
      case 6: // Hashtags & Preferences
        return true; // Optional fields
      default:
        return true; // Start/AI pages are allowed
    }
  };

  const steps = [
    { title: "How do you want to start?", description: "Choose an entry point" },
    { title: "Describe your brand", description: "A sentence or two is enough" },
    { title: "Identity", description: "Name, niche and description" },
    { title: "Aesthetic", description: "Visual & audience settings" },
    { title: "Voice", description: "Brand voice & pillars" },
    { title: "Tone", description: "Tone and emoji usage" },
    { title: "Hashtags", description: "Hashtag preferences" },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <StartChoice onChooseAI={() => setCurrentStep(1)} onChooseManual={() => setCurrentStep(2)} />;
      case 1:
        return (
          <AIInputPage
            aiPrompt={aiPrompt}
            setAiPrompt={setAiPrompt}
            isGenerating={isGenerating}
          />
        );
      case 2:
        return (
          <Step0BrandIdentity
            settings={settings}
            updateField={updateField}
            description={brandDescription}
            setDescription={setBrandDescription}
          />
        );
      case 3:
        return <Step1AestheticAudience settings={settings} updateField={updateField} />;
      case 4:
        return (
          <Step2BrandVoice
            settings={settings}
            updateField={updateField}
            handleAddTag={(v: string) => handleAddTag("content_pillars", v)}
            handleRemoveTag={(i: number) => handleRemoveTag("content_pillars", i)}
          />
        );
      case 5:
        return <Step3ToneEmojis settings={settings} updateField={updateField} />;
      case 6:
        return (
          <Step4HashtagsPreferences
            settings={settings}
            updateField={updateField}
            handleAddTag={(field, v) => handleAddTag(field, v)}
            handleRemoveTag={(field, i) => handleRemoveTag(field, i)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-3xl max-h-[90vh] overflow-hidden flex flex-col md:max-w-3xl ${currentStep > 0 && "h-[90vh]"}`}>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle>{steps[currentStep].title}</DialogTitle>
              <DialogDescription>{steps[currentStep].description}</DialogDescription>
            </div>
            {hasLoadedFromStorage && settings.name && (
              <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap mr-5">
                Draft saved
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-1 ">
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

        {currentStep !== 0 && (
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
            ) : currentStep === 1 ? (
              <Button
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    const data = await generateMutation.mutateAsync(aiPrompt);

                    const generated: BrandSettingsData = {
                      ...defaultSettings,
                      name: (data as any).name || defaultSettings.name,
                      niche: (data as any).niche || defaultSettings.niche,
                      aesthetic: (data as any).aesthetic || defaultSettings.aesthetic,
                      target_audience: (data as any).target_audience || defaultSettings.target_audience,
                      brand_voice: (data as any).brand_voice || defaultSettings.brand_voice,
                      content_pillars: (data as any).content_pillars || defaultSettings.content_pillars,
                      tone_of_voice: (data as any).tone_of_voice || defaultSettings.tone_of_voice,
                      emoji_usage: (data as any).emoji_usage || defaultSettings.emoji_usage,
                      forbidden_words: (data as any).forbidden_words || defaultSettings.forbidden_words,
                      preferred_words: (data as any).preferred_words || defaultSettings.preferred_words,
                      hashtag_style: (data as any).hashtag_style || defaultSettings.hashtag_style,
                      hashtag_count: (data as any).hashtag_count || defaultSettings.hashtag_count,
                      hashtags: (data as any).hashtags || defaultSettings.hashtags,
                      
                    };

                    setSettings(generated);
                    setBrandDescription(`Generated from AI: ${aiPrompt}`);
                    setCurrentStep(2);
                  } catch (err) {
                    console.error("AI generation failed", err);
                    alert("AI generation failed. See console.");
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={generateMutation.isPending || !aiPrompt.trim()}
                className="flex items-center gap-2"
              >
                {isGenerating ? "Generating..." : "Generate"}
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
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Missing UI components used by the wizard (added here) ---
function StartChoice({
  onChooseAI,
  onChooseManual,
}: {
  onChooseAI: () => void;
  onChooseManual: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 border border-border rounded-lg bg-card/50">
        <h3 className="text-lg font-semibold">Describe with AI</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Provide a short prompt and we'll generate a complete brand profile you can edit.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={onChooseAI}>Use AI</Button>
          
        </div>
      </div>

      <div className="p-4 border border-border rounded-lg bg-card/50">
        <h3 className="text-lg font-semibold">Start from scratch</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Fill in fields manually in the editor. Good if you already know your brand.
        </p>
        <div className="mt-4">
          <Button variant="secondary" onClick={onChooseManual}>
            Create Manually
          </Button>
        </div>
      </div>
    </div>
  );
}

function AIInputPage({
  aiPrompt,
  setAiPrompt,
  isGenerating,
}: {
  aiPrompt: string;
  setAiPrompt: (s: string) => void;
  isGenerating: boolean;
}) {
  const examples = [
    "Fitness brand for busy professionals, tone: blunt & motivating",
    "Personal finance educator for Gen Z, tone: casual and helpful",
    "Vegan recipes brand: clean aesthetics, friendly tone",
  ];

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">Describe your brand</label>
      <textarea
        value={aiPrompt}
        onChange={(e) => setAiPrompt(e.target.value)}
        placeholder="e.g. I'm a fitness coach who focuses on short, no-nonsense tips for busy people..."
        className="w-full h-40 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />

      <div className="text-sm text-muted-foreground">Examples</div>
      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            className="px-3 py-1 rounded-full bg-muted text-sm"
            onClick={() => setAiPrompt(ex)}
          >
            {ex}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => setAiPrompt("")}>Clear</Button>
      </div>
    </div>
  );
}

function BrandEditor({
  settings,
  updateField,
  description,
  setDescription,
  handleAddTag,
  handleRemoveTag,
}: {
  settings: BrandSettingsData;
  updateField: (field: keyof BrandSettingsData, value: any) => void;
  description: string;
  setDescription: (value: string) => void;
  handleAddTag: (field: "content_pillars" | "forbidden_words" | "preferred_words" | "hashtags", value: string) => void;
  handleRemoveTag: (field: "content_pillars" | "forbidden_words" | "preferred_words" | "hashtags", index: number) => void;
}) {
  const editorSteps = [
    { id: 0, label: "Identity" },
    { id: 1, label: "Aesthetic" },
    { id: 2, label: "Voice" },
    { id: 3, label: "Tone" },
    { id: 4, label: "Hashtags" },
  ];
  const [editorStep, setEditorStep] = useState(0);

  const renderEditorStep = () => {
    switch (editorStep) {
      case 0:
        return (
          <Step0BrandIdentity
            settings={settings}
            updateField={updateField}
            description={description}
            setDescription={setDescription}
          />
        );
      case 1:
        return <Step1AestheticAudience settings={settings} updateField={updateField} />;
      case 2:
        return (
          <Step2BrandVoice
            settings={settings}
            updateField={updateField}
            handleAddTag={(v: string) => handleAddTag("content_pillars", v)}
            handleRemoveTag={(i: number) => handleRemoveTag("content_pillars", i)}
          />
        );
      case 3:
        return <Step3ToneEmojis settings={settings} updateField={updateField} />;
      case 4:
        return (
          <Step4HashtagsPreferences
            settings={settings}
            updateField={updateField}
            handleAddTag={(field, v) => handleAddTag(field, v)}
            handleRemoveTag={(field, i) => handleRemoveTag(field, i)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">Editor progress</div>
          <div className="text-xs text-muted-foreground">{editorStep + 1}/{editorSteps.length}</div>
        </div>

        <div className="w-full bg-muted h-2 rounded-full overflow-hidden mb-3">
          <div
            className="h-2 bg-primary"
            style={{ width: `${Math.round((editorStep / (editorSteps.length - 1)) * 100)}%` }}
          />
        </div>

        <div className="flex gap-2 mb-3">
          {editorSteps.map((s) => (
            <button
              key={s.id}
              onClick={() => setEditorStep(s.id)}
              className={`px-3 py-1 rounded-full text-sm ${
                s.id === editorStep ? "bg-primary text-background" : "bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="p-4 border border-border rounded-lg bg-card/50">{renderEditorStep()}</div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setEditorStep((s) => Math.max(0, s - 1))}
            disabled={editorStep === 0}
          >
            Back
          </Button>

          <Button
            onClick={() => setEditorStep((s) => Math.min(editorSteps.length - 1, s + 1))}
            className="ml-auto"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
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
