/**
 * Core Slide Structure Types
 * 
 * These types define the fundamental building blocks for slides.
 * Used across:
 * - Template creation (visual editor)
 * - Post generation (AI content filling)
 * - Slide rendering (Konva, backend renderer)
 */

export type TextElement = {
  id: string;
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: 'normal' | 'bold' | 'italic';
  color: string;
  x: number;
  y: number;
  width: number;
  align: 'left' | 'center' | 'right';
};

export type BackgroundConfig = {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradientColors?: [string, string];
  gradientAngle?: number;
  imageUrl?: string;
};

export type SlideDesign = {
  id: string;
  name: string;
  background: BackgroundConfig;
  elements: TextElement[];
  dynamic?: boolean;
};
