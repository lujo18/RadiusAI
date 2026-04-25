"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text as KonvaText,
  Group,
  Image as KonvaImage,
  Label,
  Tag,
} from "react-konva";
import type Konva from "konva";
import { Post } from "@/types/types";
import { parsePostContent } from "@/lib/parseJsonColumn.supabase";
import {
  BaseNode,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
  BaseNodeContent,
} from "@/components/base-node";
import {
  ChevronLeft,
  ChevronRight,
  Images,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselItem } from "../ui/carousel";
import CarouselWithFooter from "../ui/carousel-with-footer";
import EditableKonvaText from "../PostEditor/EditableKonvaText";
import { produce } from "immer";

const ASPECT_RATIOS = {
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
} as const;

// SlideCard measures its parent and scales the canonical canvas to fit.
function SlideCard({
  aspectRatio = "4:5",
  zoom = 1,
  isActive = false,
  children,
}: {
  aspectRatio?: "4:5" | "1:1" | "9:16";
  zoom?: number;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 10, h: 20 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const canonical = ASPECT_RATIOS[aspectRatio as keyof typeof ASPECT_RATIOS];

  if (size.w === 0 || size.h === 0) {
    return <div ref={wrapRef} style={{ width: "100%", height: "100%" }} />;
  }

  const fit = Math.min(size.w / canonical.width, size.h / canonical.height, 1);
  const scale = fit * zoom;

  const cssW = Math.max(1, canonical.width * fit);
  const cssH = Math.max(1, canonical.height * fit);

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: cssW,
          height: cssH,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        <Stage
          width={canonical.width}
          height={canonical.height}
          scaleX={scale}
          scaleY={scale}
          listening={isActive}
        >
          {children}
        </Stage>
      </div>
    </div>
  );
}

interface SlideCarouselEditorProps {
  post: Post;
  setPost: (updatedpost: Post) => void;
  aspectRatio?: "4:5" | "9:16" | "1:1";
}

export function SlideCarouselEditor({
  post,
  setPost,
  aspectRatio = "4:5",
}: SlideCarouselEditorProps) {
  const [editedPost, setEditedPost] = useState(post);

  const [fontLoaded, setFontLoaded] = useState(false);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1.5);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  const isEditMode = false;
  const [editedElements, setEditedElements] = useState<Record<string, any>>({});

  const canvasDimensions =
    ASPECT_RATIOS[aspectRatio as keyof typeof ASPECT_RATIOS];

  const currentSlideshowContent = editedPost?.content;
  const currentSlide = currentSlideshowContent?.slides?.[currentSlideIndex];

  useEffect(() => {
    document.fonts.load('16px "Tiktok Sans"').then(() => {
      setFontLoaded(true);
    });
  }, []);

  const getEditedElement = (slide: number, id: string) => {
    return editedPost?.content?.slides?.[slide]?.elements.find(
      (el: any) => el.id === id,
    );
  };

  const updateEditedElementContent = (
    slide: number,
    id: string,
    updates: object,
  ) => {
    setEditedPost(
      produce((draft) => {
        const element = draft?.content?.slides?.[slide].elements.find(
          (el: any) => el.id === id,
        );
        console.log("UPDATE", element, updates)
        if (element) Object.assign(element, updates);
      }),
    );
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.05, 1));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.05, 0.2));
  };

  const handleResetZoom = () => {
    setZoom(maxZoom);
  };

  if (!fontLoaded) {
    return (
      <BaseNode>
        <BaseNodeHeader>
          <BaseNodeHeaderTitle className="flex items-center gap-2 text-sm">
            <Images className="w-4 h-4 text-primary" />
            Slide Editor
          </BaseNodeHeaderTitle>
        </BaseNodeHeader>
        <BaseNodeContent>
          <div className="text-sm text-muted-foreground text-center py-6">
            Fonts not loaded yet.
          </div>
        </BaseNodeContent>
      </BaseNode>
    );
  }

  if (!editedPost) {
    return (
      <BaseNode>
        <BaseNodeHeader>
          <BaseNodeHeaderTitle className="flex items-center gap-2 text-sm">
            <Images className="w-4 h-4 text-primary" />
            Slide Editor
          </BaseNodeHeaderTitle>
        </BaseNodeHeader>
        <BaseNodeContent>
          <div className="text-sm text-muted-foreground text-center py-6">
            No slides generated yet
          </div>
        </BaseNodeContent>
      </BaseNode>
    );
  }

  return (
    <BaseNode>
      <BaseNodeHeader>
        <BaseNodeHeaderTitle className="flex items-center gap-2 text-sm">
          <Images className="w-4 h-4 text-primary" />
          Slide Editor
        </BaseNodeHeaderTitle>
      </BaseNodeHeader>

      <BaseNodeContent className="space-y-3">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 justify-between">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              disabled={zoom <= 0.2}
              className="h-8 w-8 p-0"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              disabled={zoom >= 1}
              className="h-8 w-8 p-0"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetZoom}
              className="h-8 px-2 text-xs"
              title="Reset zoom"
            >
              Reset
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              Slide {currentSlideIndex + 1} of{" "}
              {currentSlideshowContent?.slides?.length}
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <CarouselWithFooter
          externalCurrent={currentSlideIndex}
          setExternalCurrent={(idx) => {
            setCurrentSlideIndex(idx);
          }}
          opts={{ watchDrag: false }}
        >
          <CarouselItem className="basis-1 md:basis-1/3"></CarouselItem>
          {currentSlideshowContent &&
            (currentSlideshowContent as any)?.slides?.map(
              (slide: any, slideIndex: number) => {
                const isActive =
                  slideIndex === currentSlideIndex;

                return (
                  <CarouselItem
                    key={slide.slide_id}
                    className="basis-1 md:basis-1/3"
                    onClick={() => {
                      setCurrentSlideIndex(slideIndex);
                    }}
                  >
                    <Card
                      className="overflow-hidden p-0 relative"
                      style={{
                        aspectRatio: "3/4",
                        transform: `scale(${isActive ? 1 : 0.8})`,
                        transformOrigin: "center",
                        zIndex: isActive ? 99 : "auto",
                        minHeight: 20,
                      }}
                    >
                      <SlideCard
                        aspectRatio={aspectRatio}
                        zoom={zoom}
                        isActive={isActive}
                      >
                        <Layer>
                          {/* Background */}

                          <SlideBackgroundLayer
                            background={slide.background}
                            width={canvasDimensions.width}
                            height={canvasDimensions.height}
                          />
                          {/* Text Elements */}
                          {slide.elements?.map((element: any) => {
                            return (
                              // <EditableText
                              //   element={element}
                              //   isSelected={selectedElementId == element.id}
                              // />

                              <EditableKonvaText
                                key={element.id}
                                stateElement={getEditedElement(
                                  slideIndex,
                                  element.id,
                                )}
                                updateStateElement={(updates) =>
                                  updateEditedElementContent(
                                    slideIndex,
                                    element.id,
                                    updates,
                                  )
                                }
                              />
                            );
                          })}
                        </Layer>
                      </SlideCard>
                      {!isActive && (
                        <div className="absolute left-0 right-0 top-0 bottom-0 bg-background/20 z-10"></div>
                      )}
                    </Card>
                  </CarouselItem>
                );
              },
            )}

          <CarouselItem className="basis-1 md:basis-1/3"></CarouselItem>
        </CarouselWithFooter>

        {/* Element Inspector / Editor */}
        {selectedElementId && currentSlide && (
          <ElementInspector
            element={
              editedElements[selectedElementId] ||
              currentSlide.elements?.find(
                (el: any) => el.id === selectedElementId,
              )
            }
            isEditMode={isEditMode}
            editingTextId={null}
            textInputRef={undefined}
          />
        )}
      </BaseNodeContent>
      <div>
        <p>{JSON.stringify(editedPost.content)}</p>
      </div>
    </BaseNode>
  );
}

interface SlideBackgroundLayerProps {
  background: any;
  width: number;
  height: number;
}

function SlideBackgroundLayer({
  background,
  width,
  height,
}: SlideBackgroundLayerProps) {
  if (!background) {
    return <Rect width={width} height={height} fill="#ffffff" />;
  }

  switch (background.type) {
    case "solid":
      return (
        <Rect
          width={width}
          height={height}
          fill={background.color || "#ffffff"}
        />
      );

    case "gradient":
      const [color1, color2] = background.gradient_colors || [
        "#000000",
        "#ffffff",
      ];
      const angle = background.gradient_angle || 0;

      // Use same gradient calculation as stageBuilder for consistency
      const radians = (angle * Math.PI) / 180;
      const x1 = width / 2 - (Math.cos(radians) * width) / 2;
      const y1 = height / 2 - (Math.sin(radians) * height) / 2;
      const x2 = width / 2 + (Math.cos(radians) * width) / 2;
      const y2 = height / 2 + (Math.sin(radians) * height) / 2;

      return (
        <Rect
          width={width}
          height={height}
          fill={color1}
          fillLinearGradientStartPoint={{ x: x1, y: y1 }}
          fillLinearGradientEndPoint={{ x: x2, y: y2 }}
          fillLinearGradientColorStops={[0, color1, 1, color2]}
        />
      );

    case "image":
      return (
        <>
          <Rect width={width} height={height} fill="#ffffff" />
          {background.image_url && (
            <KonvaImageElement
              src={background.image_url}
              width={width}
              height={height}
            />
          )}
        </>
      );

    default:
      return <Rect width={width} height={height} fill="#ffffff" />;
  }
}

interface KonvaImageElementProps {
  src: string;
  width: number;
  height: number;
}

function KonvaImageElement({ src, width, height }: KonvaImageElementProps) {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = src;
  }, [src]);

  if (!image) {
    return <Rect width={width} height={height} fill="#f0f0f0" />;
  }

  return (
    <>
      <KonvaImage image={image} width={width} height={height} />
      {/* 30% overlay for text readability */}
      <Rect width={width} height={height} fill="rgba(0, 0, 0, 0.3)" />
    </>
  );
}

interface ElementInspectorProps {
  element?: any;
  isEditMode?: boolean;
  editingTextId?: string | null;
  onTextChange?: (text: string) => void;
  textInputRef?: React.RefObject<HTMLInputElement | null>;
}

function ElementInspector({
  element,
  isEditMode = false,
  editingTextId = null,
  onTextChange,
  textInputRef,
}: ElementInspectorProps) {
  if (!element) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Element Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {isEditMode && editingTextId === element.id ? (
          <div className="space-y-2">
            <div>
              <label className="text-muted-foreground text-xs mb-1 block">
                Edit Text
              </label>
              <input
                ref={textInputRef}
                type="text"
                defaultValue={element.content}
                onChange={(e) => onTextChange?.(e.target.value)}
                autoFocus
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                placeholder="Enter text..."
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-muted-foreground">Font Family</div>
              <div className="font-medium">{element.font_family}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Size</div>
              <div className="font-medium">{element.font_size}px</div>
            </div>
            <div>
              <div className="text-muted-foreground">Color</div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: element.color }}
                />
                <code className="text-xs">{element.color}</code>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Alignment</div>
              <div className="font-medium capitalize">
                {element.align || "left"}
              </div>
            </div>
          </div>
        )}
        <div className="pt-2 border-t">
          <div className="text-muted-foreground mb-1">Content</div>
          <div className="bg-muted p-2 rounded text-xs line-clamp-2">
            {element.content}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
