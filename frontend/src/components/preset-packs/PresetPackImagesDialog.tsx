'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePresetImages } from '@/lib/api/hooks/usePresetPacks';
import type { PresetPack } from '@/types/presetPack';

interface PresetPackImagesDialogProps {
  pack: PresetPack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageSelect?: (imageUrl: string) => void;
}

export function PresetPackImagesDialog({ 
  pack, 
  open, 
  onOpenChange,
  onImageSelect 
}: PresetPackImagesDialogProps) {
  const { data: imageData, isLoading } = usePresetImages(
    pack?.id || '',
    1,
    100
  );

  const images = imageData?.images || [];

  if (!pack) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{pack.name}</DialogTitle>
          <DialogDescription className="text-foreground/70">
            {pack.description || 'Select an image from this pack'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i} 
                  className="aspect-square bg-card/50 rounded-lg animate-pulse border border-border"
                />
              ))}
            </div>
          ) : images && images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div 
                  key={image.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-card/30 hover:bg-card/50 transition-all duration-200"
                >
                  <img
                    src={image.url}
                    alt={image.tags?.join(', ') || 'Preset image'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                    {onImageSelect && (
                      <Button
                        size="sm"
                        onClick={() => {
                          onImageSelect(image.url);
                          onOpenChange(false);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 btn-primary"
                      >
                        Select
                      </Button>
                    )}
                  </div>
                  
                  {/* Image info */}
                  {image.tags && image.tags.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <p className="text-white text-xs truncate">
                        {image.tags.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-card/50 border border-border flex items-center justify-center mb-4">
                <svg 
                  className="w-8 h-8 text-foreground/40" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Images Yet
              </h3>
              <p className="text-foreground/60 text-sm max-w-md">
                This pack doesn't contain any images yet. Add some images to see them here.
              </p>
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center justify-between text-sm text-foreground/60">
            <span>
              {images.length} image{images.length !== 1 ? 's' : ''}
            </span>
            <span className="px-2 py-1 rounded-md bg-card/50 border border-border text-xs">
              {pack.accessibility}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}