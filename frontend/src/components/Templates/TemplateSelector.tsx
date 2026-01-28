"use client";

import { SYSTEM_TEMPLATES } from "@/util/templateJson";
import * as React from "react";
import { TemplateCard } from "./TemplateCard";
import { useEffect, useRef } from "react";
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import CarouselWithFooter from "../ui/carousel-with-footer";
import { useCreateTemplate } from "@/lib/api/hooks";

export const TemplateSelector = ({ brandId }: { brandId: string }) => {

  const createTemplate = useCreateTemplate()
  const currentBrand = brandId


  const handleAddTemplate = async (templateId: string): Promise<void> => {
    const template = SYSTEM_TEMPLATES.template_library.filter((t)=> t.template_id === templateId)[0]

    const response = await createTemplate.mutateAsync({
      name: template.name,
      category: template.category,
      content_rules: template.content_rules,
      brand_id: currentBrand
    })


    console.log("Added template:", response)
  }

  return (
    <div className="">
      
        <CarouselWithFooter>
          {SYSTEM_TEMPLATES.template_library.map((template, index) => (
            <CarouselItem
              className="basis-1/3 lg:basis-1/3"
              key={template.template_id}
            >
              <div className="relative h-72 flex">
                <div className="absolute w-full h-full">
                  <TemplateCard
                    key={template.template_id}
                    template={template}
                    onSelect={() => handleAddTemplate(template.template_id)}
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselWithFooter>
    </div>
  );
};
