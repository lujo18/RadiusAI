"use client";

import React, { useMemo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { useBrandCtas } from "@/lib/api/hooks/useBrandCtas";
import type { Database } from "@/types/database";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  BaseNode,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
  BaseNodeContent,
} from "@/components/base-node";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Item, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";

type BrandCta = Database["public"]["Tables"]["brand_ctas"]["Row"];

export interface CtaNodeData {
  brandId: string;
  selectedCtaId?: string;
  onCtaSelect?: (ctaId: string | null) => void;
}

export type CtaNodeProps = NodeProps & {
  data: CtaNodeData;
};

export const CtaNode: React.FC<CtaNodeProps> = ({ data }) => {
  const { brandId, selectedCtaId, onCtaSelect } = data;

  const { data: ctas, isLoading, error } = useBrandCtas(brandId);

  const handleCtaSelect = (ctaId: string | null) => {
    if (onCtaSelect) {
      onCtaSelect(ctaId);
    }
  };

  const selectedCta = ctas?.find((c) => c.id === selectedCtaId);

  const filteredCtas = useMemo(() => {
    if (!ctas) return [];
    return ctas.filter((cta) => !cta.is_deleted);
  }, [ctas]);

  const activeCtas = filteredCtas.filter((c) => c.is_active);

  return (
    <BaseNode className="w-80">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-primary border-2 border-background"
      />

      <BaseNodeHeader>
        <BaseNodeHeaderTitle className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          CTA Selector
        </BaseNodeHeaderTitle>
      </BaseNodeHeader>

      <BaseNodeContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading CTAs...
            </span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 text-center py-2">
            Failed to load CTAs
          </div>
        ) : !ctas || ctas.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-2">
            No CTAs found for this brand
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Select CTA
              </label>
              <Combobox
                items={activeCtas}
                value={(selectedCta as BrandCta) || null}
                onValueChange={handleCtaSelect as any}
                itemToStringLabel={(cta: BrandCta) => cta?.label ?? ""}
              >
                <ComboboxInput placeholder="Choose a CTA..." showClear />
                <ComboboxContent>
                  <ComboboxEmpty>No active CTAs found.</ComboboxEmpty>
                  <ComboboxList>
                    {activeCtas.map((cta) => (
                      <ComboboxItem key={cta.id} value={cta.id}>
                        <Item size="xs" className="p-0">
                          <ItemTitle className="font-medium whitespace-nowrap">
                            {cta.label}
                          </ItemTitle>
                          {cta.category && (
                            <Badge variant="secondary" className="text-xs">
                              {cta.category}
                            </Badge>
                          )}
                        </Item>
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            {selectedCta && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    CTA Details
                  </div>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Text:</span>
                      <span className="text-right max-w-40 line-clamp-2">
                        {selectedCta.cta_text}
                      </span>
                    </div>

                    {selectedCta.category && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedCta.category}
                        </Badge>
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
