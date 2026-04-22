import backendClient from "@/lib/api/clients/backendClient";
import stockPacksRepo, { StockPackRow } from "./repo";
import { env } from "process";

export type StockPack = StockPackRow;

export interface StockPackThumbnail {
  pack_id: string;
  images: any[];
}

export interface StockPackImage {
  key: string;
  size: number;
  last_modified: string;
  etag: string;
}

export class StockPackService {
  // TODO: implement — return all active stock packs
  static async getAllPacks(): Promise<StockPackRow[]> {
    return stockPacksRepo.list();
  }

  // TODO: implement — return thumbnail images for the given pack ids
  static async getPackThumbnails(
    packIds: string[],
  ): Promise<StockPackThumbnail[]> {
    // For demonstration, we'll return placeholder thumbnails based on pack IDs
    const packs = stockPacksRepo.list();
    const chosenPacks = (await packs).filter((pack) =>
      packIds.includes(String(pack.id)),
    );

    return Promise.all(
      chosenPacks.map(async (pack) => {
        const urls = pack.thumbnail_urls ?? [];
        const bucketDirectory = pack.bucket_directory;

        const response = await fetch(
          "https://stock-read-worker.useradius.workers.dev" +
            "?prefix=" +
            bucketDirectory +
            "/" +
            urls[0],
        );

        const data = (await response.json()) as any;
        const cleaned = Array.isArray(data) ? data : data?.objects || [];

        return {
          pack_id: String(pack.id),
          images: cleaned,
        } as StockPackThumbnail;
      }),
    );
  }

  // TODO: implement — return all images for a given pack
  static async getPackImages(
    bucketDirectory: string,
  ): Promise<StockPackImage[]> {
    const response = await fetch(
      "https://stock-read-worker.useradius.workers.dev" +
        "?prefix=" +
        bucketDirectory +
        "/",
    );
    const data = (await response.json()) as any;

    console.log(
      "Fetched images for pack",
      bucketDirectory,
      "response:",
      data,
      "url",
      "https://stock-read-worker.useradius.workers.dev?prefix=" +
        bucketDirectory +
        "/",
    );

    // If the API returns { objects: [...] }, extract it; otherwise assume it's already an array
    return Array.isArray(data) ? data : data?.objects || [];
  }
}

export default StockPackService;
