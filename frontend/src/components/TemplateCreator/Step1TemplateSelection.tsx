"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { SYSTEM_TEMPLATES } from "@/util/templateJson";
import { DialogTitle,DialogHeader, DialogDescription } from "../animate-ui/components/radix/dialog";

interface Step1TemplateSelectionProps {
  onSelectSystemTemplate: (category: string, templateData: any) => void;
  onCreateCustomTemplate: () => void;
  onAiGenerateTemplate: (prompt: string) => void;
  isGenerating?: boolean;
  customTemplateName: string;
  setCustomTemplateName: (name: string) => void;
  onClose: () => void;
}

export default function Step1TemplateSelection({
  onSelectSystemTemplate,
  onCreateCustomTemplate,
  onAiGenerateTemplate,
  isGenerating = false,
  onClose,
}: Step1TemplateSelectionProps) {
  const [aiPrompt, setAiPrompt] = React.useState("");

  const handleAiGenerate = () => {
    if (aiPrompt.trim() && !isGenerating) {
      onAiGenerateTemplate(aiPrompt);
    }
  };

  const systemTemplates = SYSTEM_TEMPLATES.template_library;

  return (
    <>
      {/* Header */}
      <DialogHeader className="px-6 pt-6 pb-2">
        <DialogTitle className="text-2xl font-bold text-foreground">Create Template</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground mt-1">
          Describe your slide format and AI will create the template structure for you
        </DialogDescription>
      </DialogHeader>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-12">
        {/* AI Generation Secion */}
        <section className="px-12">
          <Card className="bg-muted shadow-md overflow-hidden border">
            <CardContent>
              <Textarea
                placeholder="Describe your slide format (e.g., 'A 5-slide educational carousel with a hook, 3 value tips, and a follow CTA'). AI will handle the structure, rules, and style for you."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isGenerating}
                className="min-h-15  max-h-40 dark:bg-transparent bg-transparent border-none focus-visible:ring-0 text-base resize-none placeholder:text-muted-foreground/60 p-0 leading-relaxed"
              />
              <div className="flex justify-end ">
                <Button 
                  onClick={handleAiGenerate}
                  disabled={!aiPrompt.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Template
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* System Templates */}
        <section className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">Or start with a System Template</h2>
            <p className="text-sm text-muted-foreground">
              Choose a pre-built structure to customize manually
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemTemplates.map((template) => (
              <button
                key={template.template_id}
                onClick={() => onSelectSystemTemplate(template.category, template)}
                className="text-left"
              >
                <Card className="h-full hover:border-primary/50 hover:bg-foreground/5 transition-all duration-300 cursor-pointer group shadow-sm border-border/40">
                  <CardHeader className="pb-3 px-4 pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div>
                          <CardTitle className="text-base group-hover:text-primary transition-colors font-semibold">
                            {template.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.best_for[0]}
                          </p>
                        </div>
                      </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary/80 uppercase tracking-tighter">
                          {template.content_rules?.slide_count || 0} slides
                        </span>
                        <span className="text-xs text-muted-foreground/50">•</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {template.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-normal">
                        {template.content_rules?.goal}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
