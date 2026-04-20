"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/types/database";
import Step1TemplateSelection from "./Step1TemplateSelection";
import Step2TemplateEditor from "./Step2TemplateEditor";
import { EMPTY_CONTENT_RULES } from "./emptyTemplate";
import { Dialog, DialogContent } from "../animate-ui/components/radix/dialog";
import { templateGenerationService } from "@/features/generation/services/templateGenerationService";
import { useToast } from "@/hooks/use-toast";

type CreateTemplateInput = {
  name: string;
  category: string;
  style_config: any;
  content_rules?: any;
  is_default: boolean;
  tags?: string[];
  status?: string;
  favorite?: boolean;
};

interface TemplateCreatorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (template: CreateTemplateInput) => void;
  existingTemplate?: any;
  brandId?: string;
  templateUsage?: { template_count?: number; template_limit?: number | null; remaining?: number | null };
}

export default function TemplateCreator({
  visible,
  onClose,
  onSave,
  existingTemplate,
  brandId,
  templateUsage,
}: TemplateCreatorProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSystemTemplate, setSelectedSystemTemplate] = useState<
    string | null
  >(null);
  const [templateMode, setTemplateMode] = useState<"system" | "custom" | "ai" | null>(
    null,
  );
  const [customTemplateName, setCustomTemplateName] = useState("");

  // Template editor state
  const [formData, setFormData] = useState({
    name: existingTemplate?.name || "",
    category: existingTemplate?.category || ("educational" as string),
    status: existingTemplate?.status || "active",
    favorite: existingTemplate?.favorite || false,
    is_default: existingTemplate?.is_default || false,
    tags: existingTemplate?.tags || ([] as string[]),
    content_rules: existingTemplate?.content_rules || {},
    style_config: existingTemplate?.style_config || (null as any),
  });

  const getDefaultStyleConfig = (category: string, templateData?: any) => {
    // If using system template data, extract structure and rules from it
    if (templateData?.content_rules) {
      return {
        layout: {
          slideCount: templateData.content_rules.slide_count || 5,
          aspectRatio: "9:16",
          structure: Object.values(
            templateData.content_rules.structure || {},
          ).map((s: any) =>
            typeof s === "string" ? s.split(":")[0].trim() : s,
          ) || ["hook", "value", "value", "cta"],
        },
        visual: {
          background: {
            type: "gradient",
            colors: ["#0B0B0C", "#1a1a2e"],
            opacity: 1,
          },
          font: {
            family: "Inter",
            size: 48,
            color: "#F8FAFC",
            effects: ["drop-shadow"],
          },
          accentColor: "#10B981",
        },
        content: {
          tone: "direct",
          hookStyle: templateData.content_rules.hook_style || "question",
          useEmojis: true,
          ctaTemplate: "Follow for more",
          forbiddenWords: [],
        },
      };
    }

    // Fallback for custom templates
    const categories: Record<string, any> = {
      transformation: {
        slideCount: 7,
        structure: [
          "hook",
          "before",
          "transition",
          "progress",
          "comparison",
          "mindset",
          "cta",
        ],
      },
      educational: {
        slideCount: 6,
        structure: ["hook", "step1", "step2", "step3", "step4", "cta"],
      },
      narrative: {
        slideCount: 5,
        structure: ["hook", "setup", "conflict", "resolution", "cta"],
      },
      comparison: {
        slideCount: 5,
        structure: ["hook", "vs1", "vs2", "verdict", "cta"],
      },
    };

    const config = categories[category] || {
      slideCount: 5,
      structure: ["hook", "value", "value", "cta"],
    };

    return {
      layout: {
        slideCount: config.slideCount,
        aspectRatio: "9:16",
        structure: config.structure,
      },
      visual: {
        background: {
          type: "gradient",
          colors: ["#0B0B0C", "#1a1a2e"],
          opacity: 1,
        },
        font: {
          family: "Inter",
          size: 48,
          color: "#F8FAFC",
          effects: ["drop-shadow"],
        },
        accentColor: "#10B981",
      },
      content: {
        tone: "direct",
        hookStyle: "question",
        useEmojis: true,
        ctaTemplate: "Follow for more",
        forbiddenWords: [],
      },
    };
  };

  const handleSelectSystemTemplate = (category: string, templateData?: any) => {
    setSelectedSystemTemplate(category);
    setTemplateMode("system");
    setFormData((prev) => ({
      ...prev,
      category,
      name: templateData?.name || category,
      // DELEGATE: Style config. Decide if you still want, then handle solution
      // style_config: getDefaultStyleConfig(category, templateData),
      content_rules: templateData?.content_rules || EMPTY_CONTENT_RULES,
    }));
    setStep(2);
  };

  const handleCreateCustomTemplate = () => {
    setTemplateMode("custom");
    setFormData((prev) => ({
      ...prev,
      name: customTemplateName,
      category: "educational",
      style_config: getDefaultStyleConfig("educational"),
      content_rules: EMPTY_CONTENT_RULES,
    }));
    setStep(2);
  };

  const handleAiGenerateTemplate = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const generatedTemplate = await templateGenerationService.generateFromPrompt(prompt);
      
      setTemplateMode("ai");

      // Preserve the full generated structure in content_rules so all dynamic
      // properties (logic_engine, content_blueprint, slides, etc.) are editable.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name, category, template_id, ...contentFields } = generatedTemplate;

      setFormData((prev) => ({
        ...prev,
        name: generatedTemplate.name || "AI Generated Template",
        category: generatedTemplate.category || "educational",
        style_config: generatedTemplate.style_config || getDefaultStyleConfig(generatedTemplate.category || "educational"),
        content_rules: contentFields,
      }));
      setStep(2);
      
      toast({
        title: "Template Generated!",
        description: "AI has created a structure based on your description.",
      });
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      toast({
        title: "Generation Failed",
        description: error.response?.data?.detail || "Could not generate template. Please try again or use a system template.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setSelectedSystemTemplate(null);
    setTemplateMode(null);
    setCustomTemplateName("");
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveTemplate = () => {
    onSave({
      name: formData.name,
      category: formData.category,
      style_config: formData.style_config,
      content_rules: formData.content_rules,
      is_default: formData.is_default,
      tags: formData.tags,
      status: formData.status,
      favorite: formData.favorite,
    });
    setStep(1)
  };

  // Only render the dialog when visible
 
  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col lg:max-w-[90vw]">
        {step === 1 ? (
          <Step1TemplateSelection
            onSelectSystemTemplate={handleSelectSystemTemplate}
            onCreateCustomTemplate={handleCreateCustomTemplate}
            onAiGenerateTemplate={handleAiGenerateTemplate}
            isGenerating={isGenerating}
            customTemplateName={customTemplateName}
            setCustomTemplateName={setCustomTemplateName}
            onClose={onClose}
          />
        ) : (
          <Step2TemplateEditor
            formData={formData}
            onInputChange={handleInputChange}
            onSave={handleSaveTemplate}
            onCancel={handleBack}
            isEditing={!!existingTemplate}
            isTemplateCreation={!existingTemplate}
            templateUsage={templateUsage}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
