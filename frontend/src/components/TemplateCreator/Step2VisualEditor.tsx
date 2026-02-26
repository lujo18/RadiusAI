import React, { ReactEventHandler } from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  FiPlus,
  FiTrash2,
  FiCopy,
  FiType,
  FiImage,
  FiZoomIn,
  FiZoomOut,
  FiCheck,
  FiLayers,
} from "react-icons/fi";
import Image from "next/image";
import { Stage, Layer, Rect, Text as KonvaText, Line, Group } from "react-konva";
import { TextElement, TextElementsArraySchema } from "@/types/parseTextElement";
import { BackgroundSchema } from "@/types/parseBackground";
import { z } from "zod";
type SlideDesign = {
  id: string;
  name: string;
  text_elements: TextElement[];
  background: any;
  [key: string]: any;
};
type AspectRatio = '4:5' | '1:1' | '9:16';
// Aspect ratios constant (define locally if missing)
const ASPECT_RATIOS = {
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
} as const;

import { Switch } from "../animate-ui/components/radix/switch";
import { IconButton } from "../animate-ui/components/buttons/icon";
import { TIKTOK_STYLES, STYLE_CATEGORIES, getTiktokStyle, applyTiktokStyleToKonva } from "@/lib/konva/tiktokTextStyles";

interface Step2VisualEditorProps {
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  slideDesigns: SlideDesign[];
  setSlideDesigns: (designs: SlideDesign[]) => void;
  selectedDesignId: string;
  setSelectedDesignId: (id: string) => void;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  addNewDesign: () => void;
  deleteDesign: (id: string) => void;
  duplicateDesign: (id: string) => void;
}

export default function Step2VisualEditor({
  aspectRatio,
  setAspectRatio,
  slideDesigns,
  setSlideDesigns,
  selectedDesignId,
  setSelectedDesignId,
  selectedElementId,
  setSelectedElementId,
  addNewDesign,
  deleteDesign,
  duplicateDesign,
}: Step2VisualEditorProps) {
  // Parse/validate JSONB columns for selectedDesign
  const rawDesign = slideDesigns.find((d) => d.id === selectedDesignId);
  let selectedDesign: SlideDesign;
  if (rawDesign) {
    let parsedBackground: any = { type: "solid", color: "#000" };
    let parsedTextElements: TextElement[] = [];
    try {
      parsedBackground = BackgroundSchema.parse(
        typeof rawDesign.background === "string"
          ? JSON.parse(rawDesign.background)
          : rawDesign.background
      );
    } catch {
      parsedBackground = { type: "solid", color: "#000" };
    }
    try {
      parsedTextElements = TextElementsArraySchema.parse(
        typeof rawDesign.text_elements === "string"
          ? JSON.parse(rawDesign.text_elements)
          : rawDesign.text_elements
      );
    } catch {
      parsedTextElements = [];
    }
    selectedDesign = {
      ...rawDesign,
      background: parsedBackground,
      text_elements: parsedTextElements,
    };
  } else {
    selectedDesign = {
      id: "",
      name: "",
      background: { type: "solid", color: "#000" },
      dynamic: false,
      text_elements: [],
      template_id: "",
      created_at: "",
    } as SlideDesign;
  }
  const canvasDimensions =
    ASPECT_RATIOS[aspectRatio as keyof typeof ASPECT_RATIOS];
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [snapGuides, setSnapGuides] = useState<{
    vertical: boolean;
    horizontal: boolean;
  }>({ vertical: false, horizontal: false });

  // Calculate maximum zoom that fits in container
  useEffect(() => {
    const calculateMaxZoom = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth - 40; // Account for padding
      const containerHeight = container.clientHeight - 100; // Account for controls and margins

      const scaleX = containerWidth / canvasDimensions.width;
      const scaleY = containerHeight / canvasDimensions.height;
      const calculatedMaxZoom = Math.min(scaleX, scaleY, 1); // Don't exceed 100%

      setMaxZoom(calculatedMaxZoom);
      setZoom(calculatedMaxZoom); // Set initial zoom to fit
    };

    calculateMaxZoom();
    window.addEventListener("resize", calculateMaxZoom);
    return () => window.removeEventListener("resize", calculateMaxZoom);
  }, [canvasDimensions]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 1)); // Max 100%
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.2)); // Min 20%
  };

  const handleResetZoom = () => {
    setZoom(maxZoom);
  };

  const toggleDynmaic = (value: boolean) => {
    setSlideDesigns(
      slideDesigns.map((d: SlideDesign) =>
        d.id === selectedDesignId ? { ...d, dynamic: value } : d
      )
    );
  };

  const updateBackground = (updates: Partial<SlideDesign["background"]>) => {
    setSlideDesigns(
      slideDesigns.map((d: SlideDesign) => {
        if (d.id !== selectedDesignId) return d;
        // Parse current background
        let currentBg: any = { type: "solid", color: "#000" };
        try {
          currentBg = BackgroundSchema.parse(
            typeof d.background === "string"
              ? JSON.parse(d.background)
              : d.background
          );
        } catch {}
        // Merge updates
        const newBg = { ...currentBg, ...updates };
        return { ...d, background: newBg };
      })
    );
  };

  const addTextElement = (
    textType: "header" | "body" | "subheader" | "caption"
  ) => {
    const fontSizes = {
      header: 72,
      body: 48,
      subheader: 56,
      caption: 36,
    };

    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      type: "text",
      content:
        textType === "header"
          ? "Add Header"
          : textType === "body"
          ? "Add Body Text"
          : textType === "subheader"
          ? "Add Subheader"
          : "Add Caption",
      font_size: fontSizes[textType],
      font_family: "Inter",
      font_style:
        textType === "header" || textType === "subheader" ? "bold" : "normal",
      color: "#ffffff",
      x: 100,
      y: 100 + (selectedDesign?.text_elements?.length || 0) * 100,
      width: canvasDimensions.width - 200,
      align: "center",
    };

    setSlideDesigns(
      slideDesigns.map((d: SlideDesign) => {
        if (d.id !== selectedDesignId) return d;
        let currentElements: TextElement[] = [];
        try {
          currentElements = TextElementsArraySchema.parse(
            typeof d.text_elements === "string"
              ? JSON.parse(d.text_elements)
              : d.text_elements
          );
        } catch {}
        return { ...d, text_elements: [...currentElements, newElement] };
      })
    );
  };

  const updateElement = (elementId: string, updates: Partial<TextElement>) => {
    setSlideDesigns(
      slideDesigns.map((d: SlideDesign) => {
        if (d.id !== selectedDesignId) return d;
        let currentElements: TextElement[] = [];
        try {
          currentElements = TextElementsArraySchema.parse(
            typeof d.text_elements === "string"
              ? JSON.parse(d.text_elements)
              : d.text_elements
          );
        } catch {}
        return {
          ...d,
          text_elements: currentElements.map((el: TextElement) =>
            el.id === elementId ? { ...el, ...updates } : el
          ),
        };
      })
    );
  };

  const deleteElement = (elementId: string) => {
    setSlideDesigns(
      slideDesigns.map((d: SlideDesign) => {
        if (d.id !== selectedDesignId) return d;
        let currentElements: TextElement[] = [];
        try {
          currentElements = TextElementsArraySchema.parse(
            typeof d.text_elements === "string"
              ? JSON.parse(d.text_elements)
              : d.text_elements
          );
        } catch {}
        return {
          ...d,
          text_elements: currentElements.filter(
            (el: TextElement) => el.id !== elementId
          ),
        };
      })
    );
    setSelectedElementId(null);
  };

  const selectedElement = (selectedDesign?.text_elements || []).find(
    (el: TextElement) => el.id === selectedElementId
  );

  const applyPreset = (presetName: string) => {
    const preset = getTiktokStyle(presetName);
    if (!preset || !selectedElement) return;

    updateElement(selectedElement.id, {
      font_family: preset.fontFamily,
      font_size: preset.fontSize,
      color: preset.fill,
      font_style: preset.fontStyle || 'normal',
      stroke: preset.stroke,
      stroke_width: preset.strokeWidth,
      shadow_color: preset.shadowColor,
      shadow_blur: preset.shadowBlur,
      shadow_offset_x: preset.shadowOffset?.x,
      shadow_offset_y: preset.shadowOffset?.y,
      shadow_opacity: preset.shadowOpacity,
      letter_spacing: preset.letterSpacing,
      line_height: preset.lineHeight,
    });
  };

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Design List */}
      <div className="w-64 border-r border flex flex-col">
        <div className="p-4 border-b border">
          <h3 className="font-semibold mb-2">Slide Designs</h3>
          <Button onClick={addNewDesign} className="w-full">
            <FiPlus /> New Design
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {slideDesigns.map((design: SlideDesign) => (
            <div
              key={design.id}
              onClick={() => setSelectedDesignId(design.id)}
              className={`p-3 rounded-lg cursor-pointer border-2 transition ${
                selectedDesignId === design.id
                  ? "border-primary bg-primary/10"
                  : "border bg-muted/50 hover:border/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm flex items-center gap-2">
                  <Image
                    src="/images/icon-primary.png"
                    alt="Radius Logo"
                    width={18}
                    height={18}
                  />
                  {design.id}
                </span>
                <div className="flex gap-1">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateDesign(design.id);
                    }}
                  >
                    <FiCopy />
                  </IconButton>

                  {slideDesigns.length > 1 && (
                    <IconButton
                      variant={"destructive"}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDesign(design.id);
                      }}
                    >
                      <FiTrash2 />
                    </IconButton>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{design.name}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {(design.text_elements || []).length} elements
              </p>
            </div>
          ))}
        </div>
      </div>
      {/* Center Canvas */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-col items-center bg-muted/30 p-4 overflow-auto"
      >
        <div className="mb-2 flex items-center gap-3 flex-shrink-0">
          {/* Aspect Ratio Selector */}
          <div className="flex gap-2">
            {Object.entries(ASPECT_RATIOS).map(([ratio, dims]) => (
              <Button
                key={ratio}
                onClick={() => setAspectRatio(ratio as AspectRatio)}
                className={
                  aspectRatio === ratio
                    ? "bg-primary"
                    : "bg-muted hover:bg-muted/80"
                }
              >
                {ratio}
              </Button>
            ))}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 ml-4 border-l border-gray-600 pl-4">
            <Button onClick={handleZoomOut} title="Zoom Out">
              <FiZoomOut size={16} />
            </Button>
            <Button onClick={handleResetZoom} title="Fit to Screen">
              {Math.round(zoom * 100)}%
            </Button>
            <Button onClick={handleZoomIn} title="Zoom In">
              <FiZoomIn size={16} />
            </Button>
          </div>
        </div>

        {/* Scrollable Canvas Container */}
        <div className="flex-1 w-full flex items-center justify-center">
          <div
            className="bg-muted rounded-lg shadow-2xl overflow-hidden m-4"
            style={{
              width: canvasDimensions.width * zoom,
              height: canvasDimensions.height * zoom,
            }}
          >
            <Stage
              width={canvasDimensions.width * zoom}
              height={canvasDimensions.height * zoom}
              scaleX={zoom}
              scaleY={zoom}
              onClick={(e) => {
                // Deselect when clicking on stage background
                if (e.target === e.target.getStage()) {
                  setSelectedElementId(null);
                }
              }}
              onTap={(e) => {
                // Deselect when tapping on stage background (mobile)
                if (e.target === e.target.getStage()) {
                  setSelectedElementId(null);
                }
              }}
            >
              <Layer>
                {/* Background */}
                {selectedDesign?.background?.type === "solid" && (
                  <Rect
                    width={canvasDimensions.width}
                    height={canvasDimensions.height}
                    fill={selectedDesign.background.color || "#000000"}
                  />
                )}
                {selectedDesign?.background?.type === "gradient" && (
                  <Rect
                    width={canvasDimensions.width}
                    height={canvasDimensions.height}
                    fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                    fillLinearGradientEndPoint={{
                      x: canvasDimensions.width,
                      y: canvasDimensions.height,
                    }}
                    fillLinearGradientColorStops={[
                      0,
                      selectedDesign.background.gradient_colors?.[0] ||
                        "#667eea",
                      1,
                      selectedDesign.background.gradient_colors?.[1] ||
                        "#764ba2",
                    ]}
                  />
                )}

                {/* Snap Guides */}
                {snapGuides.vertical && (
                  <Line
                    points={[
                      canvasDimensions.width / 2,
                      0,
                      canvasDimensions.width / 2,
                      canvasDimensions.height,
                    ]}
                    stroke="#f59e0b"
                    strokeWidth={1}
                    dash={[4, 4]}
                    listening={false}
                  />
                )}
                {snapGuides.horizontal && (
                  <Line
                    points={[
                      0,
                      canvasDimensions.height / 2,
                      canvasDimensions.width,
                      canvasDimensions.height / 2,
                    ]}
                    stroke="#f59e0b"
                    strokeWidth={1}
                    dash={[4, 4]}
                    listening={false}
                  />
                )}

                {/* Text Elements */}
                {(selectedDesign?.text_elements || []).map(
                  (element: TextElement) => {
                    const SNAP_THRESHOLD = 10; // pixels
                    const centerX = canvasDimensions.width / 2;
                    const centerY = canvasDimensions.height / 2;

                    const baseProps = {
                      text: element.content,
                      x: 0, // Relative to group
                      y: 0, // Relative to group
                      width: element.width,
                      fontSize: element.font_size,
                      fontFamily: element.font_family,
                      fontStyle: element.font_style,
                      align: element.align,
                      letterSpacing: element.letter_spacing ?? undefined,
                      lineHeight: element.line_height ?? undefined,
                      perfectDrawEnabled: false,
                    };

                    const handleDragMove = (e: any) => {
                      const node = e.target;
                      const elementCenterX = node.x() + node.width() / 2;
                      const elementCenterY = node.y() + node.height() / 2;

                      let newX = node.x();
                      let newY = node.y();

                      // Snap to vertical center
                      if (Math.abs(elementCenterX - centerX) < SNAP_THRESHOLD) {
                        newX = centerX - node.width() / 2;
                      }

                      // Snap to horizontal center
                      if (Math.abs(elementCenterY - centerY) < SNAP_THRESHOLD) {
                        newY = centerY - node.height() / 2;
                      }

                      node.x(newX);
                      node.y(newY);
                    };

                    const handleDragEnd = (e: any) => {
                      const node = e.target;
                      updateElement(element.id, {
                        x: node.x(),
                        y: node.y(),
                      });
                    };

                    // If stroke exists, render with double-layer technique for clean outline
                    if (element.stroke && element.stroke_width) {
                      return (
                        <Group
                          key={element.id}
                          x={element.x}
                          y={element.y}
                          draggable
                          onClick={() => setSelectedElementId(element.id)}
                          onTap={() => setSelectedElementId(element.id)}
                          onDragMove={handleDragMove}
                          onDragEnd={handleDragEnd}
                        >
                          {/* Stroke layer (outline) */}
                          <KonvaText
                            {...baseProps}
                            fill={element.stroke}
                            stroke={element.stroke}
                            strokeWidth={element.stroke_width}
                            shadowColor={element.shadow_color ?? undefined}
                            shadowBlur={element.shadow_blur ?? undefined}
                            shadowOffsetX={element.shadow_offset_x ?? undefined}
                            shadowOffsetY={element.shadow_offset_y ?? undefined}
                            shadowOpacity={element.shadow_opacity ?? undefined}
                          />
                          {/* Fill layer (on top) */}
                          <KonvaText
                            {...baseProps}
                            fill={element.color}
                          />
                        </Group>
                      );
                    }

                    // No stroke: simple single-layer text
                    return (
                      <KonvaText
                        key={element.id}
                        {...baseProps}
                        x={element.x}
                        y={element.y}
                        fill={element.color}
                        shadowColor={element.shadow_color ?? undefined}
                        shadowBlur={element.shadow_blur ?? undefined}
                        shadowOffsetX={element.shadow_offset_x ?? undefined}
                        shadowOffsetY={element.shadow_offset_y ?? undefined}
                        shadowOpacity={element.shadow_opacity ?? undefined}
                        draggable
                        onClick={() => setSelectedElementId(element.id)}
                        onTap={() => setSelectedElementId(element.id)}
                        onDragMove={handleDragMove}
                        onDragEnd={handleDragEnd}
                      />
                    );
                  }
                )}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Right Sidebar - Properties Panel */}
      </div>
      <div className="w-80 border-l border-gray-700 flex flex-col overflow-y-auto">
        {/* Design Name */}
        <div className="p-4 border-b border-gray-700">
          <label className="block text-xs font-semibold mb-2 text-gray-400">
            Design Name
          </label>
          <input
            type="text"
            value={selectedDesign?.name || ""}
            onChange={(e) => {
              setSlideDesigns(
                slideDesigns.map((d: SlideDesign) =>
                  d.id === selectedDesignId ? { ...d, name: e.target.value } : d
                )
              );
            }}
            className="w-full bg-muted border border-muted/80 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="p-4 border-b border-muted/80">
          <div className="flex flex-row flex-1 justify-between items-center mb-2">
            <h3 className="font-semibold text-sm flex gap-2">
              Dynamic Content
            </h3>
            <Switch
              checked={selectedDesign?.dynamic || false}
              onCheckedChange={(checked) => toggleDynmaic(checked)}
            />
          </div>
          <label className="block text-xs font-semibold mb-2 text-muted">
            Text elements on this page will be autofilled when generating
            content.
          </label>
        </div>

        {/* Add Elements */}
        <div className="p-4 border-b border-muted/80">
          <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <FiPlus /> Add Element
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => addTextElement("header")}>Header</Button>
            <Button onClick={() => addTextElement("subheader")}>
              Subheader
            </Button>
            <Button onClick={() => addTextElement("body")}>Body</Button>
            <Button onClick={() => addTextElement("caption")}>Caption</Button>
          </div>
        </div>

        {/* Background Settings */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <FiImage /> Background
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-2 text-gray-400">
                Type
              </label>
              <div className="flex gap-2">
                {["solid", "gradient", "image"].map((type) => (
                  <Button
                    key={type}
                    onClick={() =>
                      updateBackground({
                        type: type as "solid" | "gradient" | "image",
                      })
                    }
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {selectedDesign?.background?.type === "solid" && (
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">
                  Color
                </label>
                <input
                  type="color"
                  value={selectedDesign.background.color || "#000000"}
                  onChange={(e) => updateBackground({ color: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
            )}

            {selectedDesign?.background?.type === "gradient" && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">
                    Color 1
                  </label>
                  <input
                    type="color"
                    value={
                      selectedDesign.background.gradient_colors?.[0] ||
                      "#667eea"
                    }
                    onChange={(e) =>
                      updateBackground({
                        gradient_colors: [
                          e.target.value,
                          selectedDesign.background.gradient_colors?.[1] ||
                            "#764ba2",
                        ],
                      })
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">
                    Color 2
                  </label>
                  <input
                    type="color"
                    value={
                      selectedDesign.background.gradient_colors?.[1] ||
                      "#764ba2"
                    }
                    onChange={(e) =>
                      updateBackground({
                        gradient_colors: [
                          selectedDesign.background.gradient_colors?.[0] ||
                            "#667eea",
                          e.target.value,
                        ],
                      })
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Element Properties */}
        {selectedElement && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FiLayers /> Text Properties
              </h3>
              <Button onClick={() => deleteElement(selectedElement.id)}>
                <FiTrash2 size={16} />
              </Button>
            </div>

            <div className="space-y-3">
              {/* TikTok Text Presets */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">
                  TikTok Presets
                </label>
                <div className="space-y-2">
                  {/* Classic */}
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Classic</p>
                    <div className="grid grid-cols-1 gap-1">
                      {STYLE_CATEGORIES.classic.map((styleName) => (
                        <Button
                          key={styleName}
                          onClick={() => applyPreset(styleName)}
                          className="text-xs py-1 h-7 capitalize bg-muted hover:bg-primary/20"
                        >
                          {styleName}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {/* Bold */}
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Bold & Impactful</p>
                    <div className="grid grid-cols-2 gap-1">
                      {STYLE_CATEGORIES.bold.map((styleName) => (
                        <Button
                          key={styleName}
                          onClick={() => applyPreset(styleName)}
                          className="text-xs py-1 h-7 capitalize bg-muted hover:bg-primary/20"
                        >
                          {styleName.replace(/([A-Z])/g, ' $1').trim()}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {/* Vibrant */}
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Vibrant</p>
                    <div className="grid grid-cols-2 gap-1">
                      {STYLE_CATEGORIES.vibrant.map((styleName) => (
                        <Button
                          key={styleName}
                          onClick={() => applyPreset(styleName)}
                          className="text-xs py-1 h-7 capitalize bg-muted hover:bg-primary/20"
                        >
                          {styleName.replace(/([A-Z])/g, ' $1').trim()}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {/* Clean */}
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Clean & Minimal</p>
                    <div className="grid grid-cols-2 gap-1">
                      {STYLE_CATEGORIES.clean.map((styleName) => (
                        <Button
                          key={styleName}
                          onClick={() => applyPreset(styleName)}
                          className="text-xs py-1 h-7 capitalize bg-muted hover:bg-primary/20"
                        >
                          {styleName.replace(/([A-Z])/g, ' $1').trim()}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {/* Soft */}
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Soft & Friendly</p>
                    <div className="grid grid-cols-2 gap-1">
                      {STYLE_CATEGORIES.soft.map((styleName) => (
                        <Button
                          key={styleName}
                          onClick={() => applyPreset(styleName)}
                          className="text-xs py-1 h-7 capitalize bg-muted hover:bg-primary/20"
                        >
                          {styleName.replace(/([A-Z])/g, ' $1').trim()}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">
                  Content
                </label>
                <textarea
                  value={
                    selectedDesign?.dynamic
                      ? selectedElement.content
                      : "Content will be generated by AI"
                  }
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      content: e.target.value,
                    })
                  }
                  className="w-full bg-muted border border-muted/80 rounded px-3 py-2 text-sm resize-none"
                  rows={3}
                  disabled={!selectedDesign?.dynamic}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={selectedElement.font_size}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        font_size: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-muted border border-muted/80 rounded px-3 py-2 text-sm"
                    min={12}
                    max={120}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">
                    Color
                  </label>
                  <input
                    type="color"
                    value={selectedElement.color}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        color: e.target.value,
                      })
                    }
                    className="w-full h-9 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">
                  Font Family
                </label>
                <select
                  value={selectedElement.font_family}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      font_family: e.target.value,
                    })
                  }
                  className="w-full bg-muted border border-muted/80 rounded px-3 py-2 text-sm"
                >
                  <option>Inter</option>
                  <option>Montserrat</option>
                  <option>Poppins</option>
                  <option>Georgia</option>
                  <option>Arial</option>
                  <option>Helvetica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">
                  Font Style
                </label>
                <div className="flex gap-2">
                  {["normal", "bold", "italic"].map((style) => (
                    <Button
                      key={style}
                      onClick={() =>
                        updateElement(selectedElement.id, {
                          font_style: style as any,
                        })
                      }
                      className={`flex-1 px-3 py-2 rounded text-xs font-semibold capitalize ${
                        selectedElement.font_style === style
                          ? "bg-primary"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">
                  Alignment
                </label>
                <div className="flex gap-2">
                  {["left", "center", "right"].map((align) => (
                    <Button
                      key={align}
                      onClick={() =>
                        updateElement(selectedElement.id, {
                          align: align as any,
                        })
                      }
                      className={`flex-1 px-3 py-2 rounded text-xs font-semibold capitalize ${
                        selectedElement.align === align
                          ? "bg-primary"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {align}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Stroke/Outline */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">
                  Outline (Stroke)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Color</label>
                    <input
                      type="color"
                      value={selectedElement.stroke || "#000000"}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          stroke: e.target.value,
                        })
                      }
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Width</label>
                    <input
                      type="number"
                      value={selectedElement.stroke_width || 0}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          stroke_width: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-muted border border-muted/80 rounded px-2 py-1 text-sm"
                      min={0}
                      max={20}
                    />
                  </div>
                </div>
              </div>

              {/* Shadow */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">
                  Shadow
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Color</label>
                    <input
                      type="color"
                      value={selectedElement.shadow_color || "#000000"}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          shadow_color: e.target.value,
                        })
                      }
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Blur</label>
                    <input
                      type="number"
                      value={selectedElement.shadow_blur || 0}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          shadow_blur: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-muted border border-muted/80 rounded px-2 py-1 text-sm"
                      min={0}
                      max={50}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Offset X</label>
                    <input
                      type="number"
                      value={selectedElement.shadow_offset_x || 0}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          shadow_offset_x: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-muted border border-muted/80 rounded px-2 py-1 text-sm"
                      min={-20}
                      max={20}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Offset Y</label>
                    <input
                      type="number"
                      value={selectedElement.shadow_offset_y || 0}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          shadow_offset_y: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-muted border border-muted/80 rounded px-2 py-1 text-sm"
                      min={-20}
                      max={20}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Typography */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">
                  Advanced Typography
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Letter Spacing</label>
                    <input
                      type="number"
                      value={selectedElement.letter_spacing || 0}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          letter_spacing: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-muted border border-muted/80 rounded px-2 py-1 text-sm"
                      min={-10}
                      max={20}
                      step={0.5}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Line Height</label>
                    <input
                      type="number"
                      value={selectedElement.line_height || 1}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          line_height: parseFloat(e.target.value) || 1,
                        })
                      }
                      className="w-full bg-muted border border-muted/80 rounded px-2 py-1 text-sm"
                      min={0.5}
                      max={3}
                      step={0.1}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
