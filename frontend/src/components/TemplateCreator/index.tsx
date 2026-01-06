"use client";
import React from "react";

import { useState } from "react";
import { FiX, FiCheck } from "react-icons/fi";
import { Button } from '@/components/ui/button';
import { StyleConfig } from "./styleConfigTypes";
import type { Tables } from '@/types/database';
import { TextElementsArraySchema } from '@/types/parseTextElement';
import { BackgroundSchema } from '@/types/parseBackground';
import type { Background } from '@/types/parseBackground';
import type { TextElement } from '@/types/parseTextElement';
import { z } from 'zod';
type AspectRatio = Tables<'layout_configs'>['aspect_ratio'];
type SlideDesign = Tables<'slide_designs'>;

// TemplateCategory type
export type TemplateCategory = 'listicle' | 'quote' | 'story' | 'educational' | 'comparison';

type CreateTemplateInput = {
  name: string;
  category: TemplateCategory;
  style_config: StyleConfig;
  is_default: boolean;
};
type PostSlide = any;
import Step1BasicInfo from "./Step1BasicInfo";
import Step2VisualEditor from "./Step2VisualEditor";
import Step3SlideSequence from "./Step3SlideSequence";

interface TemplateCreatorProps {
  onClose: () => void;
  onSave: (template: CreateTemplateInput) => void;
  existingTemplate?: any;
}

export default function TemplateCreator({
  onClose,
  onSave,
  existingTemplate,
}: TemplateCreatorProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(existingTemplate?.name || "");
  const [category, setCategory] = useState<TemplateCategory>(
    existingTemplate?.category || "listicle"
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:5");
  const [isDefault, setIsDefault] = useState(
    existingTemplate?.isDefault || false
  );

  // Slide designs (S1, S2, S3, etc.)
  const [slideDesigns, setSlideDesigns] = useState<SlideDesign[]>([
    {
      id: "S1",
      name: "Hook Slide",
      background: {
        type: "gradient",
        gradient_colors: ["#667eea", "#764ba2"],
        gradient_angle: 135,
        color: null,
        image_url: null,
      },
      dynamic: true,
      template_id: "", // Will be set when saving
      created_at: new Date().toISOString(),
      text_elements: [],
    },
  ]);

  // Slide sequence mapping (which design to use for each slide number)
  // Always keep slideSequence in sync with slideCount and slideDesigns
  const initialSequence = Array.from({ length: 5 }, (_, i) => ({
    slide_number: i + 1,
    design_id: "S1"
  }));
  const [slideSequence, setSlideSequence] = useState<
    Array<{ slide_number: number; design_id: string }>
  >(initialSequence);

  // Sync slideSequence when slideCount changes
  const syncSlideSequence = (newCount: number) => {
    setSlideSequence((seq: Array<{ slide_number: number; design_id: string }>) => {
      const designId = slideDesigns[0]?.id || "S1";
      // Fill or trim to newCount
      const filled = Array.from({ length: newCount }, (_, i) => {
        const existing = seq.find((s: { slide_number: number; design_id: string }) => s["slide_number"] === i + 1);
        return existing && existing["design_id"] ? existing : { slide_number: i + 1, design_id: designId };
      });
      return filled;
    });
  };

  // Update slideCount and sync sequence
  const handleSetTotalSlides = (count: number) => {
    setSlideCount(count);
    syncSlideSequence(count);
  };

  const [slideCount, setSlideCount] = useState(5);
  const [selectedDesignId, setSelectedDesignId] = useState("S1");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );

  const handleCategoryChange = (newCategory: TemplateCategory) => {
    setCategory(newCategory);
  };


  // IMPORTANT: Map all UI state (camelCase) to API payload (snake_case) before saving.
  // This ensures compatibility with backend/Supabase expectations.
  const handleSave = () => {
    // Convert slide designs to legacy format for backend compatibility
    const legacySlideDesigns = slideDesigns.map(design => {
      let parsedBackground: Background = { type: 'solid', color: '#000' };
      let parsedTextElements: TextElement[] = [];
      try {
        parsedBackground = BackgroundSchema.parse(
          typeof design.background === 'string' ? JSON.parse(design.background) : design.background
        );
      } catch {}
      try {
        parsedTextElements = TextElementsArraySchema.parse(
          typeof design.text_elements === 'string' ? JSON.parse(design.text_elements) : design.text_elements
        );
      } catch {}
      return {
        id: design.id,
        name: design.name,
        background: parsedBackground,
        text_elements: parsedTextElements.map((te: TextElement) => ({
          id: te.id,
          type: te.type,
          content: te.content,
          font_size: te.font_size,
          font_family: te.font_family,
          font_style: te.font_style,
          color: te.color,
          x: te.x,
          y: te.y,
          width: te.width,
          align: te.align,
        })),
        dynamic: design.dynamic,
      };
    });

    // Use slideSequence directly (camelCase)
    const styleConfig = {
      layout: {
        aspect_ratio: aspectRatio,
        slide_count: slideCount,
      },
      slide_designs: legacySlideDesigns,
      slide_sequence: slideSequence,
    };

    const template: CreateTemplateInput = {
      name,
      category,
      style_config: styleConfig,
      is_default: isDefault,
    };
    onSave(template);
  };

  const addNewDesign = () => {
    const newId = `S${slideDesigns.length + 1}`;
    setSlideDesigns([
      ...slideDesigns,
      {
        id: newId,
        name: `Slide Design ${slideDesigns.length + 1}`,
        background: { type: "solid", color: "#1a1a1a" },
        dynamic: false,
        template_id: "",
        created_at: new Date().toISOString(),
        text_elements: [],
      },
    ]);
    setSelectedDesignId(newId);
  };

  const deleteDesign = (designId: string) => {
    if (slideDesigns.length === 1) return; // Keep at least one design
    setSlideDesigns(slideDesigns.filter((d) => d.id !== designId));
    if (selectedDesignId === designId) {
      setSelectedDesignId(slideDesigns[0].id);
    }
  };

  const duplicateDesign = (designId: string) => {
    const designToDuplicate = slideDesigns.find((d) => d.id === designId);
    if (!designToDuplicate) return;

    const newId = `S${slideDesigns.length + 1}`;
    let parsedBackground: Background = { type: 'solid', color: '#000' };
    let parsedTextElements: TextElement[] = [];
    try {
      parsedBackground = BackgroundSchema.parse(
        typeof designToDuplicate.background === 'string' ? JSON.parse(designToDuplicate.background) : designToDuplicate.background
      );
    } catch {}
    try {
      parsedTextElements = TextElementsArraySchema.parse(
        typeof designToDuplicate.text_elements === 'string' ? JSON.parse(designToDuplicate.text_elements) : designToDuplicate.text_elements
      );
    } catch {}
    setSlideDesigns([
      ...slideDesigns,
      {
        ...designToDuplicate,
        id: newId,
        name: `${designToDuplicate.name} (Copy)`,
        text_elements: parsedTextElements.map((el: TextElement) => ({
          ...el,
          id: `${newId}-${Math.random()}`,
        })),
        background: parsedBackground,
      },
    ]);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2">
      <div className="bg-card border border rounded-xl max-w-7xl w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-3 border-b border">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold font-main">
              {existingTemplate ? "Edit Template" : "Create New Template"}
            </h2>
            {/* Progress Bar - Inline */}
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-12 rounded-full ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Step {step} of 3</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {step === 1 && (
            <Step1BasicInfo
              name={name}
              setName={setName}
              category={category}
              setCategory={handleCategoryChange}
              isDefault={isDefault}
              setIsDefault={setIsDefault}
            />
          )}
          {step === 2 && (
            <Step2VisualEditor
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              slideDesigns={slideDesigns.map((d) => {
                let parsedBackground: Background = { type: 'solid', color: '#000' };
                let parsedTextElements: TextElement[] = [];
                try {
                  parsedBackground = BackgroundSchema.parse(
                    typeof d.background === 'string' ? JSON.parse(d.background) : d.background
                  );
                } catch {}
                try {
                  parsedTextElements = TextElementsArraySchema.parse(
                    typeof d.text_elements === 'string' ? JSON.parse(d.text_elements) : d.text_elements
                  );
                } catch {}
                return { ...d, background: parsedBackground, text_elements: parsedTextElements };
              })}
              setSlideDesigns={setSlideDesigns as unknown as (designs: SlideDesign[]) => void}
              selectedDesignId={selectedDesignId}
              setSelectedDesignId={setSelectedDesignId}
              selectedElementId={selectedElementId}
              setSelectedElementId={setSelectedElementId}
              addNewDesign={addNewDesign}
              deleteDesign={deleteDesign}
              duplicateDesign={duplicateDesign}
            />
          )}
          {step === 3 && (
            <Step3SlideSequence
              slideCount={slideCount}
              setTotalSlides={handleSetTotalSlides}
              slideDesigns={slideDesigns}
              slideSequence={slideSequence}
              setSlideSequence={setSlideSequence}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-3 border-t border bg-muted">
          <Button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            {step > 1 ? "Back" : "Cancel"}
          </Button>
          <div className="flex gap-2">
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !name}
                className="bg-primary hover:bg-primary/80 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold transition"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                className="bg-chart-4 hover:bg-chart-4/80 text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
              >
                <FiCheck size={16} />
                Save Template
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
