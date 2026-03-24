"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StockPacksDialog from "@/features/stock_packs/components/StockPacksDialog";
import { useStockPacks } from "@/features/stock_packs/hook";
import type { AutomationWizardData } from "../AutomationWizard";
import { X } from "lucide-react";

interface AutomationWizardStep5StockPackProps {
  data: AutomationWizardData;
  onChange: (data: AutomationWizardData) => void;
}

export function AutomationWizardStep5StockPack({
  data,
  onChange,
}: AutomationWizardStep5StockPackProps) {
  const { data: packs = [] } = useStockPacks();
  const [dialogOpen, setDialogOpen] = useState(false);

  const selectedPack = packs.find(
    (p) => p.bucket_directory === data.stockPackDirectory,
  );

  const handleSelectPack = (bucketDirectory: string | null) => {
    onChange({
      ...data,
      stockPackDirectory: bucketDirectory,
    });
    setDialogOpen(false);
  };

  const handleClearSelection = () => {
    onChange({
      ...data,
      stockPackDirectory: null,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Image Source</h3>
        <p className="text-sm text-foreground/60 mb-4">
          Choose where images come from for your automated posts. Select a stock
          pack for consistent brand aesthetics, or use the default Unsplash
          images.
        </p>
      </div>

      {/* Current Selection Display */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Current Selection</label>

        {selectedPack ? (
          <Card className="p-4 border-primary/50 bg-primary/5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{selectedPack.name}</h4>
                <p className="text-xs text-foreground/60 mt-1">
                  {selectedPack.description}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">
                    {selectedPack.bucket_directory}
                  </Badge>
                  <span className="text-xs text-foreground/60">
                    {selectedPack.image_count} images
                  </span>
                </div>
              </div>
              <button
                onClick={handleClearSelection}
                className="p-1 hover:bg-destructive/10 rounded transition-colors"
                aria-label="Remove selection"
              >
                <X className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </Card>
        ) : (
          <Card className="p-4 border-border/50 bg-muted/30">
            <p className="text-sm text-foreground/60">
              No stock pack selected. Posts will use Unsplash images based on AI
              content.
            </p>
          </Card>
        )}
      </div>

      {/* Stock Pack Selection Button */}
      <div>
        <StockPacksDialog
          setSelectedPack={handleSelectPack}
        >
          <Button className="w-full" variant="outline">
            {selectedPack ? "Change Stock Pack" : "Select Stock Pack"}
          </Button>
        </StockPacksDialog>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
          💡 Stock Packs vs. Default Images
        </h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>
            <strong>Stock Pack:</strong> Curated aesthetic images with consistent
            style (e.g., "Clean Girl Lifestyle", "Coquette")
          </li>
          <li>
            <strong>Default (Unsplash):</strong> AI-generated image queries, more
            variety but less brand consistency
          </li>
        </ul>
      </div>
    </div>
  );
}
