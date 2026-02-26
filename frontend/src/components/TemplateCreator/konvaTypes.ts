import React from "react";
import type { Background } from '@/types/parseBackground';
import type { TextElement, SlideDesign, AspectRatio } from './types';

export type BackgroundConfig = Background;
export type PostSlide = {
  background: BackgroundConfig;
  elements: TextElement[];
  [key: string]: any;
};
