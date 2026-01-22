"use client";

import { SYSTEM_TEMPLATES } from "@/util/templateJson";
import * as React from "react";
import { TemplateCard } from "./TemplateCard";
import { useEffect, useRef } from "react";

export const TemplateSelector = () => {
  const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(
    SYSTEM_TEMPLATES.template_library[0]?.template_id || null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement }>({});

  // Auto-center the active card
  useEffect(() => {
    if (activeTemplateId && cardRefs.current[activeTemplateId] && containerRef.current) {
      const activeCard = cardRefs.current[activeTemplateId];
      const container = containerRef.current;
      
      // Calculate scroll position to center the card
      const cardLeft = activeCard.offsetLeft;
      const cardWidth = activeCard.offsetWidth;
      const containerWidth = container.offsetWidth;
      
      const scrollPosition = cardLeft - (containerWidth - cardWidth) / 2;
      
      container.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [activeTemplateId]);

  const handleCardSelect = (templateId: string) => {
    setActiveTemplateId(templateId);
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="flex flex-row overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth items-start flex-nowrap"
        style={{
          scrollBehavior: "smooth",
          scrollPaddingLeft: "50%",
          scrollbarWidth: "none"
        }}
      >
        {SYSTEM_TEMPLATES.template_library.map((template, index) => (
          <div
            key={template.template_id}
            ref={(el) => {
              if (el) cardRefs.current[template.template_id] = el;
            }}
            className="relative flex-shrink-0 snap-center"
          >
            <TemplateCard
              template={template}
              isActive={activeTemplateId === template.template_id}
              expanded={activeTemplateId === template.template_id}
              onSelect={() => handleCardSelect(template.template_id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
