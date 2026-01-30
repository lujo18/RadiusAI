"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import CarouselWithFooter from "@/components/ui/carousel-with-footer";
import { CarouselItem } from "@/components/ui/carousel";

type PostSlidePreviewProps = {
  slides: string[];
  className?: string;
};

export const PostSlidePreview = ({ slides, className }: PostSlidePreviewProps) => {
  if (!slides?.length) {
    return (
      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        No slides available
      </div>
    );
  }

  return (
    <div className={className}>
      <CarouselWithFooter>
        {slides.map((slide, index) => (
          <CarouselItem className="basis-1/2 md:basis-1/3" key={slide}>
            <Card className="p-0">
              <img 
                src={slide} 
                alt={`Slide ${index + 1}`}
                className="w-full h-auto rounded-lg"
              />
            </Card>
          </CarouselItem>
        ))}
      </CarouselWithFooter>
    </div>
  );
};