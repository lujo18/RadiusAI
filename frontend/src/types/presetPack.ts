export interface PresetPack {
  id: string;
  name: string;
  description: string;
  accessibility: 'global' | 'private';
  number_of_images: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface PresetImage {
  id: string;
  pack_id: string;
  url: string;
  tags: string[];
  vibe: string;
  objects: string[];
  composition: string;
  color_palette: string;
  aesthetic_score: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePresetPackRequest {
  name: string;
  description: string;
  accessibility: 'global' | 'private';
}

export interface CreatePresetImageRequest {
  pack_id: string;
  file: File;
  tags: string[];
  vibe: string;
  objects: string[];
  composition: string;
  color_palette: string;
  aesthetic_score: number;
}

export interface PresetPackWithImages extends PresetPack {
  images: PresetImage[];
}