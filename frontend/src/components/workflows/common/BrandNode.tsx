"use client";

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useBrand } from '@/lib/api/hooks';
import { Badge } from '@/components/ui/badge';
import { Building2, Loader2, FileText, BarChart3 } from 'lucide-react';
import {
  BaseNode,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
  BaseNodeContent,
} from '@/components/base-node';
import { Separator } from '@/components/ui/separator';

export interface BrandNodeData {
  brandId: string;
}

export type BrandNodeProps = NodeProps & {
  data: BrandNodeData;
};

type BrandSettings = {
  name?: string;
  niche?: string;
  aesthetic?: string;
  content_pillars?: string[];
};

export const BrandNode: React.FC<BrandNodeProps> = ({ data }) => {
  const { brandId } = data;

  const { data: brand, isLoading, error } = useBrand(brandId);

  return (
    <BaseNode className="w-80">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-primary border-2 border-background"
      />

      <BaseNodeHeader>
        <BaseNodeHeaderTitle className="flex items-center gap-2 text-sm">
          <Building2 className="w-4 h-4 text-primary" />
          Current Brand
        </BaseNodeHeaderTitle>
      </BaseNodeHeader>

      <BaseNodeContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading brand...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 text-center py-2">
            Failed to load brand
          </div>
        ) : !brand ? (
          <div className="text-sm text-muted-foreground text-center py-2">
            Brand not found
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Brand Details
              </div>
              <div className="text-sm space-y-2">
                {(brand.brand_settings as BrandSettings)?.name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{(brand.brand_settings as BrandSettings).name}</span>
                  </div>
                )}
                {brand.description && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description:</span>
                    <span className="text-xs text-right max-w-32 truncate" title={brand.description}>
                      {brand.description}
                    </span>
                  </div>
                )}
                {(brand.brand_settings as BrandSettings)?.niche && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Niche:</span>
                    <Badge variant="secondary" className="text-xs">
                      {(brand.brand_settings as BrandSettings).niche}
                    </Badge>
                  </div>
                )}
                {(brand.brand_settings as BrandSettings)?.aesthetic && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aesthetic:</span>
                    <Badge variant="outline" className="text-xs">
                      {(brand.brand_settings as BrandSettings).aesthetic}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <Separator/>

            {((brand.brand_settings as BrandSettings)?.content_pillars) && ((brand.brand_settings as BrandSettings).content_pillars!.length > 0) && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Content Pillars
                </div>
                <div className="flex flex-wrap gap-1">
                  {(brand.brand_settings as BrandSettings).content_pillars!.slice(0, 3).map((pillar: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {pillar}
                    </Badge>
                  ))}
                  {(brand.brand_settings as BrandSettings).content_pillars!.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{(brand.brand_settings as BrandSettings).content_pillars!.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
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
