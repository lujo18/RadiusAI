/**
 * Slide Generation Worker
 * 
 * This worker generates slide images from PostContent data.
 * It runs in a separate thread to avoid blocking the UI during batch generation.
 * 
 * Architecture:
 * - Receives PostContent (layout + slides array)
 * - Creates OffscreenCanvas for each slide
 * - Uses shared stageBuilder logic for consistency with visual editor
 * - Returns Blob array for upload to Firebase Storage
 */

import Konva from 'konva';
import type { PostContent } from '@/types/post';
import { ASPECT_RATIOS } from '@/types/template';

// Import shared rendering logic
// Note: In worker context, we need to ensure Konva can work with OffscreenCanvas
// Modern browsers support this, but we handle errors gracefully

interface WorkerMessage {
  postContent: PostContent;
  pixelRatio?: number; // Default: 2 for high DPI
}

interface WorkerResponse {
  slideIndex: number;
  blob?: Blob;
  error?: string;
  progress?: number;
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { postContent, pixelRatio = 2 } = e.data;

  try {
    // Validate input
    if (!postContent || !postContent.slides || !postContent.layout) {
      throw new Error('Invalid PostContent: missing slides or layout');
    }

    const { slides, layout } = postContent;
    const dimensions = ASPECT_RATIOS[layout.aspectRatio];
    const totalSlides = slides.length;

    // Process each slide sequentially
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];

      try {
        // Create OffscreenCanvas with high DPI
        const canvas = new OffscreenCanvas(
          dimensions.width * pixelRatio,
          dimensions.height * pixelRatio
        );

        // Build Konva stage using shared logic
        // We manually construct the stage here because OffscreenCanvas requires special handling
        const stage = new Konva.Stage({
          container: canvas as any,
          width: dimensions.width,
          height: dimensions.height,
        });

        // Scale for high DPI
        stage.scale({ x: pixelRatio, y: pixelRatio });

        // Create background layer
        const backgroundLayer = new Konva.Layer();
        const background = slide.background;

        if (background.type === 'solid' && background.color) {
          const rect = new Konva.Rect({
            x: 0,
            y: 0,
            width: dimensions.width,
            height: dimensions.height,
            fill: background.color,
          });
          backgroundLayer.add(rect);
        } else if (background.type === 'gradient' && background.gradientColors) {
          const [color1, color2] = background.gradientColors;
          const angle = background.gradientAngle || 0;
          
          const radians = (angle * Math.PI) / 180;
          const x1 = dimensions.width / 2 - (Math.cos(radians) * dimensions.width) / 2;
          const y1 = dimensions.height / 2 - (Math.sin(radians) * dimensions.height) / 2;
          const x2 = dimensions.width / 2 + (Math.cos(radians) * dimensions.width) / 2;
          const y2 = dimensions.height / 2 + (Math.sin(radians) * dimensions.height) / 2;

          const rect = new Konva.Rect({
            x: 0,
            y: 0,
            width: dimensions.width,
            height: dimensions.height,
            fillLinearGradientStartPoint: { x: x1, y: y1 },
            fillLinearGradientEndPoint: { x: x2, y: y2 },
            fillLinearGradientColorStops: [0, color1, 1, color2],
          });
          backgroundLayer.add(rect);
        }

        stage.add(backgroundLayer);

        // Create content layer with text elements
        const contentLayer = new Konva.Layer();
        slide.elements.forEach((element) => {
          const textNode = new Konva.Text({
            id: element.id,
            text: element.content,
            x: element.x,
            y: element.y,
            width: element.width,
            fontSize: element.fontSize,
            fontFamily: element.fontFamily,
            fontStyle: element.fontStyle,
            fill: element.color,
            align: element.align,
          });
          contentLayer.add(textNode);
        });

        stage.add(contentLayer);

        // Render the stage
        stage.draw();

        // Convert to blob using OffscreenCanvas API
        const blob = await canvas.convertToBlob({
          type: 'image/png',
          quality: 1,
        });

        // Send result back to main thread
        const response: WorkerResponse = {
          slideIndex: slide.slideNumber,
          blob,
          progress: ((i + 1) / totalSlides) * 100,
        };
        self.postMessage(response);

        // Cleanup
        stage.destroy();

      } catch (slideError: any) {
        // Send error for this specific slide
        const errorResponse: WorkerResponse = {
          slideIndex: slide.slideNumber,
          error: `Failed to generate slide ${slide.slideNumber}: ${slideError.message}`,
        };
        self.postMessage(errorResponse);
      }
    }

  } catch (error: any) {
    // Send fatal error
    const errorResponse: WorkerResponse = {
      slideIndex: -1,
      error: error.message || 'Failed to process PostContent',
    };
    self.postMessage(errorResponse);
  }
};
