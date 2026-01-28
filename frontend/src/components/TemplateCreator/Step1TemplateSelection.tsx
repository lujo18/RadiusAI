"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Plus, X } from "lucide-react";
import { SYSTEM_TEMPLATES } from "@/util/templateJson";
import { DialogTitle,DialogHeader, DialogDescription } from "../animate-ui/components/radix/dialog";

interface Step1TemplateSelectionProps {
  onSelectSystemTemplate: (category: string, templateData: any) => void;
  onCreateCustomTemplate: () => void;
  customTemplateName: string;
  setCustomTemplateName: (name: string) => void;
  onClose: () => void;
}

export default function Step1TemplateSelection({
  onSelectSystemTemplate,
  onCreateCustomTemplate,
  customTemplateName,
  setCustomTemplateName,
  onClose,
}: Step1TemplateSelectionProps) {
  const handleCreateCustom = () => {
    if (customTemplateName.trim()) {
      onCreateCustomTemplate();
    }
  };

  const systemTemplates = SYSTEM_TEMPLATES.template_library;

  return (
    <>
      {/* Header */}
      <DialogHeader className="">
        
          <DialogTitle className="text-2xl font-bold text-foreground">Create Template</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Choose a system template or create a custom one
          </DialogDescription>
        
      </DialogHeader>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl">
          {/* System Templates */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">System Templates</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Start with a pre-built template structure
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {systemTemplates.map((template) => (
                <button
                  key={template.template_id}
                  onClick={() => onSelectSystemTemplate(template.category, template)}
                  className="text-left"
                >
                  <Card className="h-full hover:border-primary/50 hover:bg-foreground/5 transition-all duration-300 cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div>
                            <CardTitle className="text-base group-hover:text-primary transition-colors">
                              {template.name}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {template.best_for[0]}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase">
                            {template.content_rules?.slide_count || 0} slides
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {template.category}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.content_rules?.goal}
                        </p>
                        {template.best_for.length > 1 && (
                          <div className="pt-1 flex flex-wrap gap-1">
                            {template.best_for.slice(1, 3).map((use, i) => (
                              <span
                                key={i}
                                className="text-xs bg-foreground/10 text-foreground px-2 py-0.5 rounded"
                              >
                                {use}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Template */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground mb-2">Custom Template</h2>
              <p className="text-sm text-muted-foreground">
                Create from scratch
              </p>
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  New Custom
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="template-name" className="text-sm">
                    Template Name
                  </Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., My Format"
                    value={customTemplateName}
                    onChange={(e) => setCustomTemplateName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customTemplateName.trim()) {
                        handleCreateCustom();
                      }
                    }}
                    className="bg-background border-border focus:border-primary h-9"
                  />
                </div>

                <Button
                  onClick={handleCreateCustom}
                  disabled={!customTemplateName.trim()}
                  className="w-full h-9 bg-primary hover:bg-primary/80 disabled:bg-muted disabled:cursor-not-allowed text-sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Create
                </Button>

                <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                  Customize all properties on the next step.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
