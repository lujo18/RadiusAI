"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { useStockPacks } from "@/features/stock_packs/hook";
import { StockPackDialog } from "@/features/stock_packs/components";
import { Badge } from "@/components/ui/badge";
import { Images, Loader2 } from "lucide-react";
import {
  BaseNode,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
  BaseNodeContent,
} from "@/components/base-node";
import { Separator } from "@/components/ui/separator";

export interface StockPackNodeData {
  selectedPackId?: string;
  onPackSelect?: (bucketDirectory: string | null) => void;
}

export type StockPackNodeProps = NodeProps & {
  data: StockPackNodeData;
};

const StockPackNodeComponent: React.FC<StockPackNodeProps> = ({ data }) => {
  const { selectedPackId, onPackSelect } = data;
  const { data: packs = [], isLoading, error } = useStockPacks();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePackSelect = (bucketDirectory: string) => {
    if (onPackSelect) {
      onPackSelect(bucketDirectory);
    }
    setDialogOpen(false);
  };

  const selectedPack = selectedPackId 
    ? packs.find((p) => String(p.id) === selectedPackId || p.bucket_directory === selectedPackId)
    : null;
  const activePacks = packs; // All packs from the API are considered active

  return (
    <BaseNode className="w-80">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-primary border-2 border-background"
      />

      <BaseNodeHeader>
        <BaseNodeHeaderTitle className="flex items-center gap-2 text-sm">
          <Images className="w-4 h-4 text-primary" />
          Stock Pack Selector
        </BaseNodeHeaderTitle>
      </BaseNodeHeader>

      <BaseNodeContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading packs...
            </span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 text-center py-2">
            Failed to load stock packs
          </div>
        ) : !packs || activePacks.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-2">
            No active stock packs available
          </div>
        ) : (
          <div className="space-y-3">
            <StockPackDialog 
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              setSelectedPack={handlePackSelect}
            >
              <button className="w-full px-3 py-2 rounded-md border border-primary bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                {selectedPack ? "Change Pack" : "Select a Pack"}
              </button>
            </StockPackDialog>
            

            {selectedPack && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Selected Pack
                  </div>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedPack.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Images:</span>
                      <Badge variant="secondary" className="text-xs">
                        {selectedPack.image_count}
                      </Badge>
                    </div>
                    {selectedPack.description && (
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">Description:</span>
                        <span className="text-xs line-clamp-2">
                          {selectedPack.description}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </BaseNodeContent>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
    </BaseNode>
  );
};

export const StockPackNode = memo(StockPackNodeComponent);
