import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import presetPackApi from '@/lib/api/surface/presetPackApi';
import type { PresetPack, PresetImage, CreatePresetPackRequest, CreatePresetImageRequest } from '@/types/presetPack';

// Query keys
const presetPackKeys = {
  all: ['preset-packs'] as const,
  lists: () => [...presetPackKeys.all, 'list'] as const,
  list: (accessibility?: string) => [...presetPackKeys.lists(), { accessibility }] as const,
  details: () => [...presetPackKeys.all, 'detail'] as const,
  detail: (id: string) => [...presetPackKeys.details(), id] as const,
  images: (packId: string) => [...presetPackKeys.detail(packId), 'images'] as const,
  imagesPaginated: (packId: string, page: number, limit: number) => 
    [...presetPackKeys.images(packId), { page, limit }] as const,
};

// Hooks for preset packs
export function usePresetPacks(accessibility?: 'global' | 'private') {
  return useQuery({
    queryKey: presetPackKeys.list(accessibility),
    queryFn: () => presetPackApi.getPresetPacks(accessibility),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserPrivatePacks() {
  return useQuery({
    queryKey: ['preset-packs', 'user-private'],
    queryFn: () => presetPackApi.getUserPrivatePacks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePresetPack(id: string) {
  return useQuery({
    queryKey: presetPackKeys.detail(id),
    queryFn: () => presetPackApi.getPresetPack(id),
    enabled: !!id,
  });
}

export function useCreatePresetPack() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePresetPackRequest) => presetPackApi.createPresetPack(data),
    onSuccess: (newPack) => {
      queryClient.invalidateQueries({ queryKey: presetPackKeys.lists() });
      console.log(`Preset pack "${newPack.name}" created successfully`);
    },
    onError: (error: Error) => {
      console.error(`Failed to create preset pack: ${error.message}`);
    },
  });
}

export function useUpdatePresetPack() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PresetPack> }) => 
      presetPackApi.updatePresetPack(id, updates),
    onSuccess: (updatedPack) => {
      queryClient.invalidateQueries({ queryKey: presetPackKeys.detail(updatedPack.id) });
      queryClient.invalidateQueries({ queryKey: presetPackKeys.lists() });
      console.log('Preset pack updated successfully');
    },
    onError: (error: Error) => {
      console.error(`Failed to update preset pack: ${error.message}`);
    },
  });
}

export function useDeletePresetPack() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => presetPackApi.deletePresetPack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: presetPackKeys.lists() });
      console.log('Preset pack deleted successfully');
    },
    onError: (error: Error) => {
      console.error(`Failed to delete preset pack: ${error.message}`);
    },
  });
}

// Hooks for preset images
export function usePresetImages(packId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: presetPackKeys.imagesPaginated(packId, page, limit),
    queryFn: () => presetPackApi.getPresetImages(packId, { page, limit }),
    enabled: !!packId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUploadPresetImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePresetImageRequest) => presetPackApi.uploadPresetImage(data),
    onSuccess: (newImage) => {
      queryClient.invalidateQueries({ queryKey: presetPackKeys.images(newImage.pack_id) });
      queryClient.invalidateQueries({ queryKey: presetPackKeys.detail(newImage.pack_id) });
      queryClient.invalidateQueries({ queryKey: presetPackKeys.lists() });
      console.log('Image uploaded successfully');
    },
    onError: (error: Error) => {
      console.error(`Failed to upload image: ${error.message}`);
    },
  });
}

export function useDeletePresetImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => presetPackApi.deletePresetImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: presetPackKeys.all });
      console.log('Image deleted successfully');
    },
    onError: (error: Error) => {
      console.error(`Failed to delete image: ${error.message}`);
    },
  });
}