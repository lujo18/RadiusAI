import React from "react";
// Type guards and parsing helpers for Supabase JSON columns
import type { Json } from '@/types/database';

export function isBackgroundConfig(obj: any): obj is BackgroundConfig {
	return obj && typeof obj === 'object' && 'type' in obj;
}

export function parseBackground(json: Json): BackgroundConfig {
	if (isBackgroundConfig(json)) return json as BackgroundConfig;
	if (typeof json === 'string') {
		try {
			const parsed = JSON.parse(json);
			if (isBackgroundConfig(parsed)) return parsed;
		} catch {}
	}
	return {
		type: 'solid',
		color: '#000000',
		gradient_colors: null,
		gradient_angle: null,
		image_url: null,
	};
}

export function parseTextElements(json: Json): TextElement[] {
	if (Array.isArray(json)) return json as TextElement[];
	if (typeof json === 'string') {
		try {
			const parsed = JSON.parse(json);
			if (Array.isArray(parsed)) return parsed as TextElement[];
		} catch {}
	}
	return [];
}
import type { Background } from '@/types/parseBackground';
import type { SlideDesign as LibSlideDesign } from '@/lib/slideTemplates';

/** "4:5" | "1:1" | "9:16" */
export type AspectRatio = '4:5' | '1:1' | '9:16';
export type TextElement = import('@/types/parseTextElement').TextElement;
export type BackgroundConfig = Background;
export type SlideDesign = LibSlideDesign;
