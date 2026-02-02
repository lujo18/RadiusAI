import { PresetPackRepository } from '@/lib/supabase/repos/PresetPackRepository';
import type { PresetPack, PresetImage, CreatePresetPackRequest, CreatePresetImageRequest } from '@/types/presetPack';
import { z } from 'zod';

// Validation schemas
const createPresetPackSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  accessibility: z.enum(['global', 'private']),
});

const createPresetImageSchema = z.object({
  pack_id: z.string().uuid(),
  file: z.instanceof(File),
  tags: z.array(z.string()).min(1),
  vibe: z.string().min(1),
  objects: z.array(z.string()),
  composition: z.string().min(1),
  color_palette: z.string().min(1),
  aesthetic_score: z.number().min(0).max(1),
});

export class PresetPackService {
  static async createPresetPack(data: CreatePresetPackRequest): Promise<PresetPack> {
    const validatedData = createPresetPackSchema.parse(data);
    return await PresetPackRepository.createPresetPack(validatedData);
  }

  static async getPresetPacks(accessibility?: 'global' | 'private'): Promise<PresetPack[]> {
    return await PresetPackRepository.getPresetPacks(accessibility);
  }

  static async getUserPrivatePacks(): Promise<PresetPack[]> {
    return await PresetPackRepository.getUserPrivatePacks();
  }

  static async getPresetPack(id: string): Promise<PresetPack | null> {
    return await PresetPackRepository.getPresetPack(id);
  }

  static async updatePresetPack(id: string, updates: Partial<PresetPack>): Promise<PresetPack> {
    return await PresetPackRepository.updatePresetPack(id, updates);
  }

  static async deletePresetPack(id: string): Promise<void> {
    return await PresetPackRepository.deletePresetPack(id);
  }

  static async uploadPresetImage(data: CreatePresetImageRequest): Promise<PresetImage> {
    const validatedData = createPresetImageSchema.parse(data);
    return await PresetPackRepository.uploadPresetImage(validatedData);
  }

  static async getPresetImages(
    packId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ images: PresetImage[]; total: number; hasMore: boolean }> {
    return await PresetPackRepository.getPresetImages(packId, options);
  }

  static async deletePresetImage(id: string): Promise<void> {
    return await PresetPackRepository.deletePresetImage(id);
  }
}

export default PresetPackService;