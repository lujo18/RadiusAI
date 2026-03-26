"use client";

import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Text as KonvaText, Group, Image as KonvaImage } from "react-konva";
import { Post } from "@/types/types";
import { parsePostContent } from "@/lib/parseJsonColumn.supabase";
import {
  BaseNode,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
  BaseNodeContent,
} from "@/components/base-node";
import { ChevronLeft, ChevronRight, Images, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ASPECT_RATIOS = {
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
} as const;

interface SlideCarouselEditorProps {
  posts: Post[];
  aspectRatio?: "4:5" | "9:16" | "1:1";
}

export function SlideCarouselEditor({
  posts,
  aspectRatio = "4:5",
}: SlideCarouselEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [zoom, setZoom] = useState(0.4);
  const [maxZoom, setMaxZoom] = useState(0.4);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Flatten all slides from all posts
  const allSlides = React.useMemo(() => {
    return posts.flatMap((post) => {
      // Parse post content to get slides
      const postContent = parsePostContent(post.content);
      const slides = postContent?.slides || [];
      
      return slides.map((slide, index) => ({
        ...slide,
        postId: post.id,
        slideIndex: index,
        postTitle: postContent?.caption || `Post ${posts.indexOf(post) + 1}`,
      }));
    });
  }, [posts]);

  const currentSlide = allSlides[currentSlideIndex];
  const canvasDimensions = ASPECT_RATIOS[aspectRatio as keyof typeof ASPECT_RATIOS];

  // Calculate maximum zoom to fit in container
  useEffect(() => {
    const calculateMaxZoom = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth - 40;
      const containerHeight = container.clientHeight - 120;

      const scaleX = containerWidth / canvasDimensions.width;
      const scaleY = containerHeight / canvasDimensions.height;
      const calculatedMaxZoom = Math.min(scaleX, scaleY, 1);

      setMaxZoom(calculatedMaxZoom);
      setZoom(calculatedMaxZoom);
    };

    calculateMaxZoom();
    window.addEventListener("resize", calculateMaxZoom);
    return () => window.removeEventListener("resize", calculateMaxZoom);
  }, [canvasDimensions]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.05, 1));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.05, 0.2));
  };

  const handleResetZoom = () => {
    setZoom(maxZoom);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : allSlides.length - 1));
    setSelectedElementId(null);
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev < allSlides.length - 1 ? prev + 1 : 0));
    setSelectedElementId(null);
  };

  if (allSlides.length === 0) {
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
          Slide Editor ({allSlides.length} slides)
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

          <div className="text-xs text-muted-foreground">
            Slide {currentSlideIndex + 1} of {allSlides.length}
          </div>
        </div>

        {/* Canvas Container */}
        <div
          ref={containerRef}
          className="border border-border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden"
          style={{ minHeight: "400px" }}
        >
          {currentSlide && (
            <Stage
              width={canvasDimensions.width * zoom}
              height={canvasDimensions.height * zoom}
              scale={{ x: zoom, y: zoom }}
            >
              <Layer>
                {/* Background */}
                <SlideBackgroundLayer
                  background={currentSlide.background}
                  width={canvasDimensions.width}
                  height={canvasDimensions.height}
                />

                {/* Text Elements */}
                {currentSlide.elements?.map((element: any) => (
                  <Group
                    key={element.id}
                    onClick={() => setSelectedElementId(element.id)}
                    onTap={() => setSelectedElementId(element.id)}
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    {/* Selection box */}
                    {selectedElementId === element.id && (
                      <Rect
                        x={element.x - 4}
                        y={element.y - 4}
                        width={element.width + 8}
                        height={80}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dash={[5, 5]}
                      />
                    )}

                    {/* Text */}
                    <KonvaText
                      x={element.x}
                      y={element.y}
                      text={element.content}
                      fontSize={element.font_size}
                      fontFamily={element.font_family || "Inter"}
                      fill={element.color || "#000000"}
                      width={element.width}
                      stroke={element.stroke}
                      strokeWidth={element.stroke_width || 0}
                      shadowColor={element.shadow_color}
                      shadowBlur={element.shadow_blur || 0}
                      shadowOffsetX={element.shadow_offset_x || 0}
                      shadowOffsetY={element.shadow_offset_y || 0}
                      align={element.align || "left"}
                    />
                  </Group>
                ))}
              </Layer>
            </Stage>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevSlide}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Card className="flex-1">
            <CardContent className="pt-3 pb-3">
              <div className="text-xs text-muted-foreground">
                <div className="font-medium text-foreground">
                  {currentSlide?.postTitle}
                </div>
                <div>Slide {(currentSlide?.slideIndex ?? 0) + 1}</div>
              </div>
            </CardContent>
          </Card>

          <Button
            size="sm"
            variant="outline"
            onClick={handleNextSlide}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Element Inspector */}
        {selectedElementId && currentSlide && (
          <ElementInspector
            element={currentSlide.elements?.find(
              (el: any) => el.id === selectedElementId
            )}
          />
        )}
      </BaseNodeContent>
    </BaseNode>
  );
}

interface SlideBackgroundLayerProps {
  background: any;
  width: number;
  height: number;
}

function SlideBackgroundLayer({ background, width, height }: SlideBackgroundLayerProps) {
  if (!background) {
    return <Rect width={width} height={height} fill="#ffffff" />;
  }

  switch (background.type) {
    case "solid":
      return <Rect width={width} height={height} fill={background.color || "#ffffff"} />;

    case "gradient":
      const angle = (background.gradient_angle || 45) * (Math.PI / 180);
      const [color1, color2] = background.gradient_colors || ["#000000", "#ffffff"];

      return (
        <Rect
          width={width}
          height={height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{
            x: width * Math.cos(angle),
            y: height * Math.sin(angle),
          }}
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
}

function ElementInspector({ element }: ElementInspectorProps) {
  if (!element) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Element Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
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
            <div className="font-medium capitalize">{element.align || "left"}</div>
          </div>
        </div>
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
