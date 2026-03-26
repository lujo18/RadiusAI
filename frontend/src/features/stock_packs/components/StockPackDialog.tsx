"use client";

import { useState } from "react";
import { ArrowLeft, Check, ImageIcon, Loader2, Package } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useStockPackImages, useStockPacks } from "../hook";
import { getImageFromKey } from "../util";
import type { StockPack } from "../surface";

interface StockPackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setSelectedPack?: (packName: string) => void;
}

export function StockPackDialog({
  open,
  onOpenChange,
  setSelectedPack,
}: StockPackDialogProps) {
  const selectable = !!setSelectedPack;
  const [activePack, setActivePack] = useState<StockPack | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<number | null>(null);

  const { data: packs, isLoading: packsLoading } = useStockPacks();
  const { data: packImages, isLoading: imagesLoading } = useStockPackImages(
    activePack?.bucket_directory ?? null
  );

  const handlePackClick = (pack: StockPack) => {
    if (selectable) {
      setSelectedPackId((prev) => (prev === pack.id ? null : pack.id));
    }
    setActivePack(pack);
  };

  const handleUsePack = () => {
    const pack = packs?.find((p) => p.id === selectedPackId);
    if (pack && setSelectedPack) {
      setSelectedPack(pack.name);
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    setActivePack(null);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setActivePack(null);
      setSelectedPackId(null);
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[80vh] flex flex-col gap-0 p-0 overflow-hidden"
        showCloseButton
      >
        {/* Header */}
        <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            {activePack && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={handleBack}
                aria-label="Back to packs"
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            <DialogTitle>
              {activePack ? activePack.name : "Stock Packs"}
            </DialogTitle>
            {activePack && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {activePack.image_count} images
              </Badge>
            )}
          </div>
          {activePack?.description && (
            <p className="text-muted-foreground text-xs pl-9">
              {activePack.description}
            </p>
          )}
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {activePack ? (
            <PackImagesView
              isLoading={imagesLoading}
              images={packImages ?? []}
            />
          ) : (
            <PackListView
              isLoading={packsLoading}
              packs={packs ?? []}
              selectable={selectable}
              selectedPackId={selectedPackId}
              onPackClick={handlePackClick}
            />
          )}
        </div>

        {/* Footer — only shown in selectable mode */}
        {selectable && (
          <DialogFooter className="shrink-0">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedPackId}
              onClick={handleUsePack}
            >
              Use Pack
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Pack list view ────────────────────────────────────────────────────────────

interface PackListViewProps {
  isLoading: boolean;
  packs: StockPack[];
  selectable: boolean;
  selectedPackId: number | null;
  onPackClick: (pack: StockPack) => void;
}

function PackListView({
  isLoading,
  packs,
  selectable,
  selectedPackId,
  onPackClick,
}: PackListViewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!packs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Package className="size-10 opacity-40" />
        <p className="text-sm">No stock packs available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {packs.map((pack) => {
        const isSelected = selectedPackId === pack.id;
        return (
          <button
            key={pack.id}
            type="button"
            onClick={() => onPackClick(pack)}
            className={cn(
              "group relative rounded-lg border bg-card text-left transition-all duration-150 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectable
                ? isSelected
                  ? "border-primary ring-1 ring-primary"
                  : "hover:border-border/80 hover:bg-card/80"
                : "hover:border-border/80 hover:bg-card/80"
            )}
          >
            {/* Thumbnail area */}
            <div className="aspect-video w-full bg-muted flex items-center justify-center">
              <ImageIcon className="size-8 text-muted-foreground/40" />
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="font-medium text-sm leading-tight truncate">
                {pack.name}
              </p>
              {pack.description && (
                <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">
                  {pack.description}
                </p>
              )}
              <p className="text-muted-foreground text-xs mt-1">
                {pack.image_count} images
              </p>
            </div>

            {/* Selection checkmark */}
            {selectable && isSelected && (
              <span className="absolute top-2 right-2 size-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="size-3 text-primary-foreground" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Pack images view ──────────────────────────────────────────────────────────

interface PackImagesViewProps {
  isLoading: boolean;
  images: { key: string; size: number; last_modified: string; etag: string }[];
}

function PackImagesView({ isLoading, images }: PackImagesViewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (!images.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <ImageIcon className="size-10 opacity-40" />
        <p className="text-sm">No images in this pack</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {images.map((image) => (
        <div
          key={image.key}
          className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border"
        >
          <Image
            src={getImageFromKey(image.key)}
            alt="Stock image"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        </div>
      ))}
    </div>
  );
}
