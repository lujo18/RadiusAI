import PresetPackService from '@/lib/api/services/presetPackService';
import type { PresetPack, PresetImage, CreatePresetPackRequest, CreatePresetImageRequest } from '@/types/presetPack';

export const presetPackApi = {
  // Preset Packs
  createPresetPack: async (data: CreatePresetPackRequest): Promise<PresetPack> => {
    return await PresetPackService.createPresetPack(data);
  },

  getPresetPacks: async (accessibility?: 'global' | 'private'): Promise<PresetPack[]> => {
    return await PresetPackService.getPresetPacks(accessibility);
  },

  getUserPrivatePacks: async (): Promise<PresetPack[]> => {
    return await PresetPackService.getUserPrivatePacks();
  },

  getPresetPack: async (id: string): Promise<PresetPack | null> => {
    return await PresetPackService.getPresetPack(id);
  },

  updatePresetPack: async (id: string, updates: Partial<PresetPack>): Promise<PresetPack> => {
    return await PresetPackService.updatePresetPack(id, updates);
  },

  deletePresetPack: async (id: string): Promise<void> => {
    return await PresetPackService.deletePresetPack(id);
  },

  // Preset Images
  uploadPresetImage: async (data: CreatePresetImageRequest): Promise<PresetImage> => {
    return await PresetPackService.uploadPresetImage(data);
  },

  getPresetImages: async (
    packId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ images: PresetImage[]; total: number; hasMore: boolean }> => {
    return await PresetPackService.getPresetImages(packId, options);
  },

  deletePresetImage: async (id: string): Promise<void> => {
    return await PresetPackService.deletePresetImage(id);
  },
};

export default presetPackApi;