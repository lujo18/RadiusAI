"use client";

import React, { useMemo, memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { useTemplates } from '@/features/templates/hooks';
import type { Tables } from "@/types/database";

import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export interface TemplateNodeData {
  brandId: string;
  selectedTemplateId?: string;
  onTemplateSelect?: (templateId: string | null) => void;
}

export type TemplateNodeProps = NodeProps & {
  data: TemplateNodeData;
};

const TemplateNodeComponent: React.FC<TemplateNodeProps> = ({ data }) => {
  const { brandId, selectedTemplateId, onTemplateSelect } = data;

  const { data: templates, isLoading, error } = useTemplates(brandId);
  const router = useRouter()
  const templatesArr = templates as any[];

  const handleTemplateSelect = (templateId: string | null, eventDetails?: any) => {
    if (onTemplateSelect) {
      onTemplateSelect(templateId);
    }
  };

  const selectedTemplate = (templatesArr as any[])?.find((t: any) => t.id === selectedTemplateId) as Tables<'templates'> | undefined;

  const filteredTemplates = useMemo(() => {
    if (!templatesArr) return [] as Tables<'templates'>[];
    return templatesArr.filter((template: any) => template.id !== "") as Tables<'templates'>[];
  }, [templatesArr]);

  return (
    <BaseNode className="w-80">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-primary border-2 border-background"
      />

      <BaseNodeHeader>
        <BaseNodeHeaderTitle className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-primary" />
          Template Selector  
        </BaseNodeHeaderTitle>
      </BaseNodeHeader>

      <BaseNodeContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading templates...
            </span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 text-center py-2">
            Failed to load templates
          </div>
        ) : !templatesArr || templatesArr.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-2">
            <p className="mb-4">No templates found for this brand</p>

            <Button onClick={() => router.push(`templates`)}>Create your first template</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Select Template
              </label>
              <Combobox
                items={filteredTemplates}
                value={(selectedTemplate as Tables<'templates'>) || null}
                onValueChange={handleTemplateSelect as any}
                itemToStringLabel={(template: Tables<'templates'>) => template?.name ?? ""}
              >
                <ComboboxInput placeholder="Choose a template..." showClear />
                <ComboboxContent>
                  <ComboboxEmpty>No templates found.</ComboboxEmpty>
                  <ComboboxList>
                    {filteredTemplates.map((template: Tables<'templates'>) => (
                      <ComboboxItem key={template.id} value={template.id}>
                        <Item size="xs" className="p-0">
                          <ItemTitle className="font-medium whitespace-nowrap">
                            {template.name}
                          </ItemTitle>
                         
                            {template.category && (
                              <Badge variant="secondary" className="text-xs">
                                {template.category}
                              </Badge>
                            )}
                          
                        </Item>
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            {selectedTemplate && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Template Details
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedTemplate.category || "N/A"}
                    </Badge>
                  </div>
                  {(selectedTemplate.content_rules as any)?.slide_count && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slides:</span>
                      <span>{(selectedTemplate.content_rules as any).slide_count}</span>
                    </div>
                  )}
                  {(selectedTemplate.content_rules as any)?.platform_optimized && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platforms:</span>
                      <div className="flex gap-1">
                        {(selectedTemplate.content_rules as any).platform_optimized?.map(
                          (platform: string) => (
                            <Badge
                              key={platform}
                              variant="secondary"
                              className="text-xs"
                            >
                              {platform}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
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

export const TemplateNode = memo(TemplateNodeComponent);
