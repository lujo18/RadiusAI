import backendClient from "@/lib/api/clients/backendClient";
import stockPacksRepo, { StockPackRow } from "./repo";



export interface StockPackThumbnail {
  pack_id: string;
  url: string;
}

export interface StockPackImage {
  id: string;
  pack_id: string;
  url: string;
  alt?: string;
}

export class StockPackService {
  // TODO: implement — return all active stock packs
  static async getAllPacks(): Promise<StockPackRow[]> {
    return stockPacksRepo.list()
  }

  // TODO: implement — return thumbnail images for the given pack ids
  static async getPackThumbnails(packIds: string[]): Promise<StockPackThumbnail[]> {
    throw new Error('getPackThumbnails: not implemented');
  }

  // TODO: implement — return all images for a given pack
  static async getPackImages(packId: string): Promise<StockPackImage[]> {
    backendClient
  }
}

export default StockPackService;
