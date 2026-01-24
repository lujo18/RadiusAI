
"use client";
import { motion } from "motion/react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ShiftCard } from "../ui/shift-card";
import { Card } from "../ui/card";


interface TemplateCardProps {
  template: any;
  onSelect?: () => void;
  isActive?: boolean;
  expanded?: boolean;
}

export function TemplateCard({ template, onSelect, isActive = false, expanded = false }: TemplateCardProps) {
  // --- Content Creators ---
  const topContent = (
    <Card
      className={`rounded-t-lg p-4 shadow-none border-b border-border transition-all duration-300 ${isActive ? 'bg-background text-foreground border-primary' : 'bg-card text-card-foreground'} ${expanded ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit border-muted text-muted-foreground font-medium tracking-tight">
          {template.primary_goal}
        </Badge>
        <h3 className="text-lg font-semibold text-foreground leading-tight">{template.name}</h3>
        {template.subtitle && (
          <div className="text-xs text-muted-foreground/80 font-medium truncate max-w-full">{template.subtitle}</div>
        )}
        <div className="flex items-center text-xs text-muted-foreground/80">
          <span className="font-medium">{template.hook_style}</span>
        </div>
      </div>
    </Card>
  );

  // No topAnimateContent for this style
  const topAnimateContent = null;

  const middleContent = (
    <div className={`flex flex-col items-center justify-center py-8 px-4 transition-all duration-300 ${isActive ? 'bg-background/80 text-foreground' : 'bg-card/80 text-card-foreground'}` }>
      <div className="text-center">
        <div className="text-3xl font-bold text-foreground/80 mb-1 tracking-tight">
          {template.slide_count || 5} Slides
        </div>
        <p className="text-xs text-muted-foreground/80 font-medium">
          {template.category || "Template Preview"}
        </p>
      </div>
    </div>
  );

  const bottomContent = (
    <Card
      className={`rounded-b-lg border-t-0 shadow-none px-4 pb-4 pt-2 transition-all duration-300 ${isActive ? 'bg-background text-foreground border-primary' : 'bg-card text-card-foreground'}`}
    >
      <div className="flex flex-col gap-2">
        <div className="text-sm text-muted-foreground/90 font-medium">
          <span className="font-semibold">Content Density:</span> {template.text_density}
        </div>
        {template.psychology && (
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{template.psychology}</p>
        )}
        <div>
          <h4 className="font-semibold text-xs text-foreground mb-1 mt-2">Slide Structure:</h4>
          <div className="space-y-1">
            {Object.entries(template?.structure || []).map(([key, value], idx) => (
              <div key={key} className="text-xs text-muted-foreground/80">
                <span className="font-semibold">Slide {idx + 1}:</span> {String(value)}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={onSelect} variant="secondary" className="flex-1">
            Select Template
          </Button>
          <Button variant="ghost" className="flex-1">
            Preview
          </Button>
        </div>
      </div>
    </Card>
  );

  // --- Render ---
  return (
    <ShiftCard
      key={template.template_id}
      className="bg-transparent shadow-none"
      topContent={topContent}
      topAnimateContent={topAnimateContent}
      middleContent={middleContent}
      bottomContent={bottomContent}
    />
  );
}

