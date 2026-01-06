/**
 * Shared Konva Stage Building Logic
 *
 * This module contains pure functions for building Konva stages from SlideDesign data.
 * Used by both the visual editor (DOM canvas) and the worker (OffscreenCanvas).
 *
 * Following Single Responsibility Principle - each function has one clear purpose.
 */

import Konva from "konva";
import type { Tables } from '@/types/database';
type SlideDesign = Tables<'slide_designs'>;
import { TextElement } from '@/types/parseTextElement';
type AspectRatio = Tables<'layout_configs'>['aspect_ratio'];
import { BackgroundSchema, Background } from '@/types/parseBackground';
type PostSlide = {
  background: Background;
  elements: TextElement[];
  [key: string]: any;
};
// Aspect ratios constant (define locally)
const ASPECT_RATIOS: Record<AspectRatio, { width: number; height: number }> = {
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};

/**
 * Creates a background layer for a slide
 * Handles solid colors, gradients, and images
 */
export function createBackgroundLayer(
  background: Background,
  width: number,
  height: number
): Konva.Layer {
  const layer = new Konva.Layer();

  if (background.type === "solid" && background.color) {
    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: background.color,
    });
    layer.add(rect);
  } else if (background.type === "gradient" && background.gradient_colors) {
    let [color1, color2] = background.gradient_colors;

    const angle = background.gradient_angle || 0;

    // Convert angle to radians for gradient calculation
    const radians = (angle * Math.PI) / 180;
    const x1 = width / 2 - (Math.cos(radians) * width) / 2;
    const y1 = height / 2 - (Math.sin(radians) * height) / 2;
    const x2 = width / 2 + (Math.cos(radians) * width) / 2;
    const y2 = height / 2 + (Math.sin(radians) * height) / 2;

    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: color1, // Set base fill to avoid transparency
      fillLinearGradientStartPoint: { x: x1, y: y1 },
      fillLinearGradientEndPoint: { x: x2, y: y2 },
      fillLinearGradientColorStops: [0, color1, 1, color2],
    });
    layer.add(rect);
  } else if (background.type === "image" && background.image_url) {
    // For worker: images need to be pre-loaded or use data URLs
    // For now, create a placeholder or skip
    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: "#333333", // Fallback color
    });
    layer.add(rect);
  }

  return layer;
}

/**
 * Creates a text element as a Konva Text node or Group
 * If stroke is present, creates a group with two text layers for clean outline
 */
export function createTextNode(element: TextElement): Konva.Text | Konva.Group {
  const baseConfig = {
    text: element.content,
    x: element.x,
    y: element.y,
    width: element.width,
    fontSize: element.font_size,
    fontFamily: element.font_family,
    fontStyle: element.font_style,
    align: element.align,
    letterSpacing: element.letter_spacing,
    lineHeight: element.line_height,
    listening: false,
  };

  // If there's a stroke, create a group with two text layers for clean outline
  if (element.stroke && element.stroke_width) {
    const group = new Konva.Group({
      id: element.id,
      x: 0,
      y: 0,
    });

    // First layer: stroke only (outline)
    const strokeText = new Konva.Text({
      ...baseConfig,
      fill: element.stroke,
      stroke: element.stroke,
      strokeWidth: element.stroke_width,
      shadowColor: element.shadow_color,
      shadowBlur: element.shadow_blur,
      shadowOffsetX: element.shadow_offset_x,
      shadowOffsetY: element.shadow_offset_y,
      shadowOpacity: element.shadow_opacity,
    });
    group.add(strokeText);

    // Second layer: fill only (on top, no stroke)
    const fillText = new Konva.Text({
      ...baseConfig,
      fill: element.color,
    });
    group.add(fillText);

    return group;
  }

  // No stroke: return simple text node
  return new Konva.Text({
    ...baseConfig,
    id: element.id,
    fill: element.color,
    shadowColor: element.shadow_color,
    shadowBlur: element.shadow_blur,
    shadowOffsetX: element.shadow_offset_x,
    shadowOffsetY: element.shadow_offset_y,
    shadowOpacity: element.shadow_opacity,
  });
}

/**
 * Creates a content layer with all text elements
 */
export function createContentLayer(elements: TextElement[]): Konva.Layer {
  const layer = new Konva.Layer();

  elements.forEach((element) => {
    const textNode = createTextNode(element);
    layer.add(textNode);
  });

  return layer;
}

/**
 * Builds a complete Konva Stage from SlideDesign
 * This is the core function used by both editor and worker
 *
 * @param slideDesign - The slide design configuration
 * @param aspectRatio - The aspect ratio for canvas dimensions
 * @param canvas - Optional canvas element (DOM or OffscreenCanvas)
 * @returns Configured Konva Stage
 */
export function buildStageFromSlide(
  slideDesign: SlideDesign,
  aspectRatio: AspectRatio,
  canvas?: HTMLCanvasElement | OffscreenCanvas
): Konva.Stage {
  const dimensions = ASPECT_RATIOS[aspectRatio];

  // Konva expects a string (container id) or HTMLDivElement, but for export we use a canvas (for OffscreenCanvas/DOM export)
  // We use 'container: undefined' and manually add layers, or use a dummy div if needed
  // Konva expects a string (container id) or HTMLDivElement. For export, use a dummy div as container.
  let container: any = undefined;
  if (canvas && typeof window !== 'undefined') {
    // If DOM, create a dummy div and append canvas
    container = document.createElement('div');
    if (canvas instanceof HTMLCanvasElement) {
      container.appendChild(canvas);
    }
  }
  const stage = new Konva.Stage({
    container,
    width: dimensions.width,
    height: dimensions.height,
  });

  // Validate and parse background from slideDesign
  const result = BackgroundSchema.safeParse(slideDesign.background);
  const background: Background = result.success
    ? result.data
    : { type: 'solid', color: '#000' };
  const backgroundLayer = createBackgroundLayer(
    background,
    dimensions.width,
    dimensions.height
  );
  stage.add(backgroundLayer);

  // Add content layer
  const elements: TextElement[] = Array.isArray(slideDesign.text_elements)
    ? slideDesign.text_elements as TextElement[]
    : [];
  const contentLayer = createContentLayer(elements);
  stage.add(contentLayer);

  return stage;
}

/**
 * Builds a Stage with high DPI for export
 * Used in worker for generating high-quality images
 */
export function buildStageForExport(
  slideDesign: PostSlide,
  aspectRatio: AspectRatio,
  pixelRatio: number = 2
): Konva.Stage {
  const dimensions = ASPECT_RATIOS[aspectRatio];

  // Create a temporary canvas element for the stage
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width * pixelRatio;
  canvas.height = dimensions.height * pixelRatio;

  // For export, use a dummy div as container and append canvas
  let exportContainer: any = undefined;
  if (typeof window !== 'undefined') {
    exportContainer = document.createElement('div');
    if (canvas instanceof HTMLCanvasElement) {
      exportContainer.appendChild(canvas);
    }
  }
  const stage = new Konva.Stage({
    width: dimensions.width * pixelRatio,
    height: dimensions.height * pixelRatio,
    container: exportContainer,
  });

  // Scale for high DPI
  stage.setAttrs({
    scaleX: pixelRatio,
    scaleY: pixelRatio,
  });

  // Add layers
  const backgroundLayer = createBackgroundLayer(
    slideDesign.background,
    dimensions.width,
    dimensions.height
  );
  stage.add(backgroundLayer);

  const contentLayer = createContentLayer(slideDesign.elements);
  stage.add(contentLayer);

  return stage;
}

/**
 * Converts a Konva Stage to a Blob (PNG)
 * Works with both DOM canvas and OffscreenCanvas
 */
export async function stageToBlob(
  stage: Konva.Stage,
  quality: number = 1
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      stage.toBlob({
        callback: (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert stage to blob"));
          }
        },
        mimeType: "image/png",
        quality,
        pixelRatio: 2,
      });
    } catch (error) {
      reject(error);
    }
  });
}
