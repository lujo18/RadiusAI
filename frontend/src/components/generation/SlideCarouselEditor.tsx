"use client";

import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Text as KonvaText, Group, Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import { Post } from "@/types/types";
import { parsePostContent } from "@/lib/parseJsonColumn.supabase";
import {
  BaseNode,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
  BaseNodeContent,
} from "@/components/base-node";
import { ChevronLeft, ChevronRight, Images, ZoomIn, ZoomOut, Edit2, Lock } from "lucide-react";
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
  const stageRef = useRef<Konva.Stage>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [zoom, setZoom] = useState(0.4);
  const [maxZoom, setMaxZoom] = useState(0.4);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedElements, setEditedElements] = useState<Record<string, any>>({});
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleToggleEditMode = () => {
    if (isEditMode) {
      handleSaveEdits();
    } else {
      setIsEditMode(true);
    }
  };

  const handleElementDragEnd = (element: any, newX: number, newY: number) => {
    if (!isEditMode) return;
    setEditedElements((prev) => ({
      ...prev,
      [element.id]: { ...element, x: newX, y: newY },
    }));
  };

  const handleEditText = (elementId: string) => {
    if (!isEditMode) return;
    setEditingTextId(elementId);
  };

  const handleTextChange = (elementId: string, newText: string) => {
    setEditedElements((prev) => ({
      ...prev,
      [elementId]: {
        ...(prev[elementId] || currentSlide?.elements?.find((el: any) => el.id === elementId)),
        content: newText,
      },
    }));
  };

  const handleSaveEdits = () => {
    setIsEditMode(false);
    setEditedElements({});
    setEditingTextId(null);
    // TODO: Persist edited elements back to the post
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

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isEditMode ? "default" : "outline"}
              onClick={handleToggleEditMode}
              className="h-8 px-2 gap-1.5 text-xs"
              title={isEditMode ? "Save edits" : "Edit elements"}
            >
              {isEditMode ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Save
                </>
              ) : (
                <>
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </>
              )}
            </Button>

            <div className="text-xs text-muted-foreground">
              Slide {currentSlideIndex + 1} of {allSlides.length}
            </div>
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
              ref={stageRef}
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
                {currentSlide.elements?.map((element: any) => {
                  const editedElement = editedElements[element.id] || element;
                  const isEditingThis = editingTextId === element.id;
                  return (
                    <Group
                      key={element.id}
                      draggable={isEditMode && !isEditingThis}
                      onClick={() => {
                        setSelectedElementId(element.id);
                        if (isEditMode) {
                          handleEditText(element.id);
                        }
                      }}
                      onDblClick={() => {
                        if (isEditMode) {
                          handleEditText(element.id);
                        }
                      }}
                      onTap={() => setSelectedElementId(element.id)}
                      onDragEnd={(e) =>
                        handleElementDragEnd(element, e.target.x(), e.target.y())
                      }
                      style={{
                        cursor: isEditMode ? "move" : "pointer",
                      }}
                    >
                      {/* Selection box */}
                      {selectedElementId === element.id && (
                        <Rect
                          x={editedElement.x - 4}
                          y={editedElement.y - 4}
                          width={editedElement.width + 8}
                          height={80}
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dash={[5, 5]}
                        />
                      )}

                      {/* Text */}
                      <KonvaText
                        x={editedElement.x}
                        y={editedElement.y}
                        text={editedElement.content}
                        fontSize={editedElement.font_size}
                        fontFamily={editedElement.font_family || "Inter"}
                        fill={editedElement.color || "#000000"}
                        width={editedElement.width}
                        stroke={editedElement.stroke}
                        strokeWidth={editedElement.stroke_width || 0}
                        shadowColor={editedElement.shadow_color}
                        shadowBlur={editedElement.shadow_blur || 0}
                        shadowOffsetX={editedElement.shadow_offset_x || 0}
                        shadowOffsetY={editedElement.shadow_offset_y || 0}
                        align={editedElement.align || "left"}
                        opacity={isEditingThis ? 0.5 : 1}
                      />
                    </Group>
                  );
                })}
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

        {/* Element Inspector / Editor */}
        {selectedElementId && currentSlide && (
          <ElementInspector
            element={editedElements[selectedElementId] || currentSlide.elements?.find(
              (el: any) => el.id === selectedElementId
            )}
            isEditMode={isEditMode}
            editingTextId={editingTextId}
            onTextChange={(text) => handleTextChange(selectedElementId, text)}
            textInputRef={textInputRef}
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
      const [color1, color2] = background.gradient_colors || ["#000000", "#ffffff"];
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
  textInputRef 
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
              <div className="font-medium capitalize">{element.align || "left"}</div>
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
