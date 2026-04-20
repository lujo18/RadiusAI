"use client";

import React, { useState } from "react";

import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { useStockPacks, useStockPackImages } from "../hook";
import type { StockPack } from "../service";
import clsx from "clsx";
import { getImageFromKey } from "../util";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/animate-ui/components/radix/dialog";

interface StockPacksDialogProps {
  /**
   * If provided, enables selection mode with a "Use Pack" button.
   * Callback receives the selected pack's bucket_directory.
   */
  setSelectedPack?: (bucketDirectory: string) => void;
  children?: React.ReactNode;
}

/**
 * StockPacksDialog
 * - Visual browse mode (default): Click cards to view images inside
 * - Selection mode (when setSelectedPack is provided): Click to select, Use Pack to confirm
 */
export default function StockPacksDialog({
  setSelectedPack,
  children,
}: StockPacksDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: packs = [] } = useStockPacks();

  const [viewingPackId, setViewingPackId] = useState<string | null>(null); // stores pack ID
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  const isSelectionMode = !!setSelectedPack;
  const activePacks = packs; // All packs from the API are considered active
  const viewingPack = activePacks.find((p) => String(p.id) === viewingPackId);

  // Pass bucket_directory to the hook, not the pack ID
  const { data: packImagesRaw = [] } = useStockPackImages(
    viewingPack?.bucket_directory || null,
  );
  const packImages = packImagesRaw;

  const handleSelectPack = (packId: string) => {
    if (isSelectionMode) {
      setSelectedPackId(packId);
    }
  };

  const handleUsePack = () => {
    if (isSelectionMode && (selectedPackId || viewingPackId)) {
      const packId = selectedPackId || viewingPackId;
      const pack = activePacks.find((p) => String(p.id) === packId);
      if (pack && pack.bucket_directory) {
        setSelectedPack(pack.bucket_directory);
        setOpen(false);
        // Reset state
        setSelectedPackId(null);
        setViewingPackId(null);
      } else {
        console.error(
          "Pack not found for ID:",
          packId,
          "Available:",
          activePacks.map((p) => ({ id: p.id, dir: p.bucket_directory })),
        );
      }
    }
  };

  const handleBackFromImages = () => {
    setViewingPackId(null);
    if (isSelectionMode) {
      setSelectedPackId(null);
    }
  };

  const handleOpenPack = (packId: string) => {
    if (isSelectionMode) {
      setSelectedPackId(packId);
    } else {
      setViewingPackId(packId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className="max-w-2xl lg:max-w-5xl max-h-[80vh] p-0 flex flex-col"
        showCloseButton={true}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            {viewingPackId && (
              <button
                onClick={handleBackFromImages}
                className="p-1 hover:bg-muted rounded transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
            <DialogTitle>
              {viewingPackId ? viewingPack?.name : "Stock Packs"}
            </DialogTitle>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 px-6 py-4 flex flex-col overflow-y-auto w-full">
          {!viewingPackId ? (
            // Packs Grid
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 w-full">
              {activePacks.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => setViewingPackId(String(pack.id))}
                  className={clsx(
                    "text-left rounded-lg border-2 p-4 transition-all duration-200 hover:scale-105 hover:shadow-lg",
                    isSelectionMode && selectedPackId === String(pack.id)
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50 hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{pack.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {pack.image_count} image
                        {pack.image_count !== 1 ? "s" : ""}
                      </div>
                      {pack.description && (
                        <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {pack.description}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Images Grid - scrollable container
            <div className="min-h-0 overflow-y-auto w-full">
              {/* <p>IMGS:{JSON.stringify(packImages)}</p> */}
              {packImages && packImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6 w-full">
                  {packImages.map((image) => (
                    <div
                      key={image.key}
                      className="group relative rounded-lg overflow-hidden bg-muted aspect-[3/4] hover:shadow-lg transition-all duration-200"
                    >
                      <img
                        src={getImageFromKey(image.key)}
                        alt={getImageFromKey(image.key) || "Pack image"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                      {/* Subtle overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No images in this pack yet
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Use Pack button (selection mode only) */}
        {isSelectionMode && (
          <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
            {viewingPackId ? (
              <button onClick={() => setViewingPackId(null)} className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors text-sm font-medium">
                Back
              </button>
            ) : (
              <DialogClose asChild>
                <button className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors text-sm font-medium">
                  Cancel
                </button>
              </DialogClose>
            )}
            <button
              onClick={handleUsePack}
              disabled={!selectedPackId && !viewingPackId}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                selectedPackId || viewingPackId
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              Use Pack
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
