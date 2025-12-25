// /**
//  * Slide Generation Worker
//  * 
//  * This worker generates slide images from PostContent data.
//  * It runs in a separate thread to avoid blocking the UI during batch generation.
//  * 
//  * Architecture:
//  * - Receives PostContent (layout + slides array)
//  * - Creates OffscreenCanvas for each slide
//  * - Uses shared stageBuilder logic for consistency with visual editor
//  * - Returns Blob array for upload to Firebase Storage
//  */

// import type { PostContent } from '@/types/post';
// import { ASPECT_RATIOS } from '@/types/template';

// // Note: We don't use Konva in workers because it requires DOM access
// // Instead, we'll use Canvas 2D API directly for better worker compatibility

// interface WorkerMessage {
//   postContent: PostContent;
//   pixelRatio?: number; // Default: 2 for high DPI
// }

// interface WorkerResponse {
//   slideIndex: number;
//   blob?: Blob;
//   error?: string;
//   progress?: number;
// }

// self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
//   const { postContent, pixelRatio = 2 } = e.data;

//   try {
//     // Validate input
//     if (!postContent || !postContent.slides || !postContent.layout) {
//       throw new Error('Invalid PostContent: missing slides or layout');
//     }

//     const { slides, layout } = postContent;
//     const dimensions = ASPECT_RATIOS[layout.aspectRatio];
//     const totalSlides = slides.length;

//     // Process each slide sequentially
//     for (let i = 0; i < slides.length; i++) {
//       const slide = slides[i];

//       try {
//         // Create OffscreenCanvas with high DPI
//         const canvas = new OffscreenCanvas(
//           dimensions.width * pixelRatio,
//           dimensions.height * pixelRatio
//         );

//         const ctx = canvas.getContext('2d');
//         if (!ctx) {
//           throw new Error('Failed to get 2D context');
//         }

//         // Scale for high DPI
//         ctx.scale(pixelRatio, pixelRatio);

//         // Draw background
//         const background = slide.background;

//         if (background.type === 'solid' && background.color) {
//           ctx.fillStyle = background.color;
//           ctx.fillRect(0, 0, dimensions.width, dimensions.height);
//         } else if (background.type === 'gradient' && background.gradientColors) {
//           const [color1, color2] = background.gradientColors;
//           const angle = background.gradientAngle || 0;
          
//           const radians = (angle * Math.PI) / 180;
//           const x1 = dimensions.width / 2 - (Math.cos(radians) * dimensions.width) / 2;
//           const y1 = dimensions.height / 2 - (Math.sin(radians) * dimensions.height) / 2;
//           const x2 = dimensions.width / 2 + (Math.cos(radians) * dimensions.width) / 2;
//           const y2 = dimensions.height / 2 + (Math.sin(radians) * dimensions.height) / 2;

//           const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
//           gradient.addColorStop(0, color1);
//           gradient.addColorStop(1, color2);
          
//           ctx.fillStyle = gradient;
//           ctx.fillRect(0, 0, dimensions.width, dimensions.height);
//         }

//         // Draw text elements
//         slide.elements.forEach((element) => {
//           ctx.fillStyle = element.color;
//           ctx.font = `${element.fontStyle === 'italic' ? 'italic ' : ''}${element.fontStyle === 'bold' ? 'bold ' : ''}${element.fontSize}px ${element.fontFamily}`;
//           ctx.textAlign = element.align as CanvasTextAlign;
          
//           // Handle text wrapping if width is specified
//           if (element.width) {
//             wrapText(ctx, element.content, element.x, element.y, element.width, element.fontSize * 1.2);
//           } else {
//             ctx.fillText(element.content, element.x, element.y);
//           }
//         });

//         // Convert to blob using OffscreenCanvas API
//         const blob = await canvas.convertToBlob({
//           type: 'image/png',
//           quality: 1,
//         });

//         // Send result back to main thread
//         const response: WorkerResponse = {
//           slideIndex: slide.slideNumber,
//           blob,
//           progress: ((i + 1) / totalSlides) * 100,
//         };
//         self.postMessage(response);

//         // Cleanup
//         stage.destroy();

//       } catch (slideError: any) {
//         // Send error for this specific slide
//         const errorResponse: WorkerResponse = {
//           slideIndex: slide.slideNumber,
//           error: `Failed to generate slide ${slide.slideNumber}: ${slideError.message}`,
//         };
//         self.postMessage(errorResponse);
//       }
//     }

//   } catch (error: any) {
//     // Send fatal error
//     const errorResponse: WorkerResponse = {
//       slideIndex: -1,
//       error: error.message || 'Failed to process PostContent',
//     };
//     self.postMessage(errorResponse);
//   }
// };

// // Helper function to wrap text
// function wrapText(
//   ctx: OffscreenCanvasRenderingContext2D,
//   text: string,
//   x: number,
//   y: number,
//   maxWidth: number,
//   lineHeight: number
// ) {
//   const words = text.split(' ');
//   let line = '';
//   let currentY = y;

//   for (let i = 0; i < words.length; i++) {
//     const testLine = line + words[i] + ' ';
//     const metrics = ctx.measureText(testLine);
    
//     if (metrics.width > maxWidth && i > 0) {
//       ctx.fillText(line, x, currentY);
//       line = words[i] + ' ';
//       currentY += lineHeight;
//     } else {
//       line = testLine;
//     }
//   }
//   ctx.fillText(line, x, currentY);
// }
//         };
//         self.postMessage(response);

//       } catch (slideError: any) {