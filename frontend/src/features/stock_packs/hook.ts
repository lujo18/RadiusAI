import { useQuery } from '@tanstack/react-query';
import { stockPackApi } from './surface';

const STOCK_PACK_STALE_TIME = 30 * 60 * 1000; // 30 minutes — avoid frequent re-fetches

const stockPackKeys = {
  all: ['stock-packs'] as const,
  lists: () => [...stockPackKeys.all, 'list'] as const,
  thumbnails: (packIds: string[]) => [...stockPackKeys.all, 'thumbnails', packIds] as const,
  images: (packId: string) => [...stockPackKeys.all, 'images', packId] as const,
};

export function useStockPacks() {
  return useQuery({
    queryKey: stockPackKeys.lists(),
    queryFn: () => stockPackApi.getAllPacks(),
    staleTime: STOCK_PACK_STALE_TIME,
  });
}

export function useStockPackThumbnails(packIds: string[]) {
  return useQuery({
    queryKey: stockPackKeys.thumbnails(packIds),
    queryFn: () => stockPackApi.getPackThumbnails(packIds),
    enabled: packIds.length > 0,
    staleTime: STOCK_PACK_STALE_TIME,
  });
}

export function useStockPackImages(packId: string | null) {
  return useQuery({
    queryKey: stockPackKeys.images(packId ?? ''),
    queryFn: () => stockPackApi.getPackImages(packId!),
    enabled: !!packId,
    staleTime: STOCK_PACK_STALE_TIME,
  });
}
