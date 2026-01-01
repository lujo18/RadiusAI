import React from "react";
// All types now sourced from database.ts
import type { Tables } from '@/types/database';
import type { TextElement, SlideDesign, AspectRatio } from './types';

export type BackgroundConfig = Tables<'slide_designs'>['background'];
export type PostSlide = {
  background: BackgroundConfig;
  elements: TextElement[];
  [key: string]: any;
};
