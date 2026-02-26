import React from "react";

import { Background, BackgroundSchema } from "@/types/parseBackground";
import { Card } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
type SlideDesign = { id: string; name: string; [key: string]: any };

interface Step3SlideSequenceProps {
  slideCount: number;
  setTotalSlides: (count: number) => void;
  slideDesigns: SlideDesign[];
  slideSequence: Array<{ slide_number: number; design_id: string }>;
  setSlideSequence: (
    sequence: Array<{ slide_number: number; design_id: string }>
  ) => void;
}

export default function Step3SlideSequence({
  slideCount,
  setTotalSlides,
  slideDesigns,
  slideSequence,
  setSlideSequence,
}: Step3SlideSequenceProps) {
  const updateSlideMapping = (slideNumber: number, designId: string) => {
    const existing = slideSequence.find(
      (s: any) => s["slide_number"] === slideNumber
    );
    if (existing) {
      setSlideSequence(
        slideSequence.map((s: any) =>
          s["slide_number"] === slideNumber ? { ...s, design_id: designId } : s
        )
      );
    } else {
      setSlideSequence([
        ...slideSequence,
        { slide_number: slideNumber, design_id: designId },
      ]);
    }
  };

  const getDesignForSlide = (slideNumber: number) => {
    return (
      slideSequence.find((s: any) => s["slide_number"] === slideNumber)
        ?.design_id || slideDesigns[0]?.id
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto overflow-y-auto h-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-1">Slide Sequence</h3>
        <p className="text-muted-foreground text-sm">
          Map your slide designs to specific slide positions. You can reuse the
          same design across multiple slides.
        </p>
      </div>

      {/* Total Slides Control */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">
          Total Number of Slides (Radius)
        </label>
        <input
          type="range"
          min={3}
          max={10}
          value={slideCount}
          onChange={(e) => setTotalSlides(parseInt(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>3 slides</span>
          <span className="font-bold text-primary">{slideCount} slides</span>
          <span>10 slides</span>
        </div>
      </div>

      {/* Slide Mapping Grid */}
      <div className="space-y-3">
        {Array.from({ length: slideCount }, (_, i) => i + 1).map((slideNum) => (
          <Card key={slideNum} className="flex flex-row">
            <div className="flex-shrink-0 w-24">
              <span className="text-sm font-semibold text-gray-400">
                Slide {slideNum}
              </span>
            </div>

            <div className="flex-1">
              <Select
                onValueChange={(val) => updateSlideMapping(slideNum, val)}
              >
                <SelectTrigger className="flex">
                  <SelectValue placeholder="Select a slide" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Slide</SelectLabel>
                    {slideDesigns.map((design: SlideDesign) => (
                      <SelectItem value={design.id}>
                        {design.id} - {design.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Preview indicator */}
            <div className="flex-shrink-0">
              {(() => {
                const designId = getDesignForSlide(slideNum);
                const design = slideDesigns.find(
                  (d: SlideDesign) => d.id === designId
                );

                const background: Background = BackgroundSchema.parse(
                  design?.background
                );
                return (
                  <div
                    className="w-12 h-12 rounded border-2 border-gray-600"
                    style={{
                      background:
                        background.type === "solid"
                          ? background.color || "#1a1a1a"
                          : background.type === "gradient"
                          ? `linear-gradient(135deg, ${
                              background.gradient_colors?.[0] || "#1a1a1a"
                            }, ${background.gradient_colors?.[1] || "#1a1a1a"})`
                          : "#1a1a1a",
                    }}
                  />
                );
              })()}
            </div>
          
            <Button 
              onClick={() => {
                const designId = getDesignForSlide(slideNum);
                const design = slideDesigns.find((d: SlideDesign) => d.id === designId);
                
                // Copy design name or full design object as JSON
                navigator.clipboard.writeText(
                  design ? JSON.stringify(design, null, 2) : ''
                ).then(() => {
                  // Optional: Show a toast notification
                  console.log('Layout copied to clipboard');
                }).catch(err => {
                  console.error('Failed to copy:', err);
                });
              }}
            >
              Copy layout
            </Button>
          </Card>
        ))}
      </div>

      {/* Summary Block */}
      <div className="mt-6 bg-primary/10 border border-primary/30 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Summary</h4>
        <div className="text-sm text-gray-300 space-y-1">
          {slideDesigns.map((design: SlideDesign) => {
            const count = slideSequence.filter(
              (s: any) => s.design_id === design.id
            ).length;
            if (count === 0) return null;
            return (
              <div key={design.id}>
                <span className="font-semibold">{design.id}</span> used in{" "}
                {count} slide{count > 1 ? "s" : ""}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
