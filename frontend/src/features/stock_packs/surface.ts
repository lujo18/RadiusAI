import { StockPackService } from './service';
import type { StockPack, StockPackThumbnail, StockPackImage } from './service';

export const stockPackApi = {
  getAllPacks: async (): Promise<StockPack[]> => {
    return await StockPackService.getAllPacks();
  },

  getPackThumbnails: async (packIds: string[]): Promise<StockPackThumbnail[]> => {
    return await StockPackService.getPackThumbnails(packIds);
  },

  getPackImages: async (bucketDirectory: string): Promise<StockPackImage[]> => {
    return await StockPackService.getPackImages(bucketDirectory);
  },
};

export default stockPackApi;
export type { StockPack, StockPackThumbnail, StockPackImage };
