"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ChevronLeft } from "lucide-react";
import { useStockPacks, useStockPackImages } from "../hook";
import type { StockPack } from "../service";
import clsx from "clsx";

interface StockPacksDialogProps {
  /**
   * If provided, enables selection mode with a "Use Pack" button.
   * Callback receives the selected pack name.
   */
  setSelectedPack?: (packName: string) => void;
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

  const [viewingPackId, setViewingPackId] = useState<string | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  const { data: packImages = [] } = useStockPackImages(viewingPackId);

  const isSelectionMode = !!setSelectedPack;
  const activePacks = packs.filter((p) => p.is_active);
  const viewingPack = activePacks.find((p) => p.id === viewingPackId);

  const handleSelectPack = (packId: string) => {
    if (isSelectionMode) {
      setSelectedPackId(packId);
    }
  };

  const handleUsePack = () => {
    if (isSelectionMode && selectedPackId) {
      const pack = activePacks.find((p) => p.id === selectedPackId);
      if (pack) {
        setSelectedPack(pack.name);
        setOpen(false);
        // Reset state
        setSelectedPackId(null);
        setViewingPackId(null);
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
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl max-h-[80vh] translate-x-[-50%] translate-y-[-50%] rounded-lg border border-border bg-background p-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
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
              <Dialog.Title className="text-lg font-semibold">
                {viewingPackId ? viewingPack?.name : "Stock Packs"}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="p-1 hover:bg-muted rounded transition-colors">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 px-6 py-4">
            {!viewingPackId ? (
              // Packs Grid
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {activePacks.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => handleOpenPack(pack.id)}
                    className={clsx(
                      "text-left rounded-lg border-2 p-4 transition-all",
                      isSelectionMode && selectedPackId === pack.id
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50",
                    )}
                  >
                    <div className="font-medium text-sm">{pack.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {pack.image_count} images
                    </div>
                    {pack.description && (
                      <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {pack.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              // Images Grid
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {packImages.map((image) => (
                  <div
                    key={image.id}
                    className="rounded-lg overflow-hidden bg-muted aspect-square"
                  >
                    <img
                      src={image.url}
                      alt={image.alt || "Pack image"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Use Pack button (selection mode only) */}
          {isSelectionMode && (
            <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors text-sm font-medium">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleUsePack}
                disabled={!selectedPackId}
                className={clsx(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  selectedPackId
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
              >
                Use Pack
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
