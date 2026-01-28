
"use client";
import { Check } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ShiftCard } from "../ui/shift-card";
import { useState } from "react";
import { LoadingButton } from "../ui/loading-button";

interface TemplateCardProps {
  template: any;
  onSelect: () => Promise<void>;
}

export function TemplateCard({ template, onSelect }: TemplateCardProps) {

  const [templateSelected, setTemplateSelected] = useState(false)
  

  const addTemplate = async () => {
    const response = await onSelect()
    console.log("CARD TEMPLATE", response)

    setTemplateSelected(response!!)

  }

  // Content for the top part of the card (always visible)
  const topContent = (
    <div className="bg-accent/90 rounded-md text-primary shadow-[0px_1px_1px_0px_rgba(0,0,0,0.05),0px_1px_1px_0px_rgba(255,252,240,0.5)_inset,0px_0px_0px_1px_hsla(0,0%,100%,0.1)_inset,0px_0px_1px_0px_rgba(28,27,26,0.5)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(0,0,0,0.1),0_2px_2px_0_rgba(0,0,0,0.1),0_4px_4px_0_rgba(0,0,0,0.1),0_8px_8px_0_rgba(0,0,0,0.1)]">
      <div className="p-4">
        <Badge variant={"outline"} className="w-fit text-xs mb-2">
          {template.content_rules.goal}
        </Badge>
        <h3 className="text-lg font-semibold max-w-full overflow-hidden">
          {template.name}
        </h3>
      </div>
    </div>
  );

  // Content that animates into top from the middle (can be empty)
  const topAnimateContent = null;

  // Content that animates from the top to the middle (main content)
  const middleContent = (
    <div className="text-center">
      <div className="text-3xl font-bold text-foreground/80 mb-1 tracking-tight">
        {template.slide_count || 5} Slides
      </div>
      <p className="text-xs text-muted-foreground/80 font-medium">
        {template.category || "Template Preview"}
      </p>
    </div>
  );

  // Content for the bottom part that shows on hover
  const bottomContent = (
    <div className="pb-4">
      <div className="flex w-full flex-col gap-1 bg-primary/90 border-t border-t-black/10 rounded-t-lg px-4 pb-4">
        <div className=" text-[14px] font-medium text-white dark:text-[#171717] flex gap-1 pt-2.5 items-center">
          <Check/>
          <p className="font-bold">Use this template</p>
        </div>
        <div className="w-full text-pretty font-sans text-[13px] leading-4 text-neutral-200 dark:text-[#171717] pb-2">
          {template.psychology ? template.psychology : "Create engaging carousel content with this template."}
        </div>

        <div className="bg-accent/80 dark:bg-accent px-1 py-1 rounded-xl flex flex-col gap-3">
          <LoadingButton onClick={addTemplate} variant="default" className="w-full text-xs">
            {templateSelected ? "Template Saved" : "Select Template" }
          </LoadingButton>
        </div>
      </div>
    </div>
  );

  return (
    <ShiftCard
      className="bg-card h-62 dark:bg-[#1A1A1A] w-full"
      topContent={topContent}
      topAnimateContent={topAnimateContent}
      middleContent={middleContent}
      bottomContent={bottomContent}
    />
  );
}