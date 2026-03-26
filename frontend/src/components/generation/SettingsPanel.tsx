"use client";

import React, { useMemo, useState } from "react";
import { useTemplates } from "@/features/templates/hooks";
import { useBrand } from "@/features/brand/hooks";
import { useBrandCtas } from "@/features/brand_ctas/hooks";
import { useStockPacks } from "@/features/stock_packs/hook";
import type { Tables } from "@/types/database";
import type { Database } from "@/types/database";

import {
  BaseNode,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
  BaseNodeContent,
} from "@/components/base-node";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, Building2, CheckCircle2, Images, Sparkles } from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Item, ItemTitle } from "@/components/ui/item";
import { StockPackDialog } from "@/features/stock_packs/components";
import { useRouter } from "next/navigation";

type BrandCta = Database["public"]["Tables"]["brand_ctas"]["Row"];

interface SettingsPanelProps {
  brandId: string;
  selectedTemplateId: string | null;
  selectedCtaId: string | null;
  selectedPackId: string | null;
  selectedProfile: string;
  onTemplateSelect: (templateId: string | null) => void;
  onCtaSelect: (ctaId: string | null) => void;
  onPackSelect: (bucketDirectory: string | null) => void;
  onGenerateClick: () => void;
  isGenerating?: boolean;
}

export function SettingsPanel({
  brandId,
  selectedTemplateId,
  selectedCtaId,
  selectedPackId,
  selectedProfile,
  onTemplateSelect,
  onCtaSelect,
  onPackSelect,
  onGenerateClick,
  isGenerating = false,
}: SettingsPanelProps) {
  const router = useRouter();
  const [stockPackDialogOpen, setStockPackDialogOpen] = useState(false);
  const { data: templates, isLoading: templatesLoading } = useTemplates(brandId);
  const { data: brand, isLoading: brandLoading } = useBrand(brandId);
  const { data: ctas, isLoading: ctasLoading } = useBrandCtas(brandId);
  const { data: packs = [], isLoading: packsLoading } = useStockPacks();

  const templatesArr = (templates as any[]) || [];
  const filteredTemplates = useMemo(() => {
    return templatesArr.filter((template: any) => template.id !== "");
  }, [templatesArr]);

  const selectedTemplate = filteredTemplates?.find(
    (t: any) => t.id === selectedTemplateId
  ) as Tables<"templates"> | undefined;

  const filteredCtas = useMemo(() => {
    if (!ctas) return [] as BrandCta[];
    return ctas.filter((cta: BrandCta) => !cta.is_deleted) as BrandCta[];
  }, [ctas]);

  const activeCtas = filteredCtas.filter((c: BrandCta) => c.is_active);
  const selectedCta = ctas?.find((c: BrandCta) => c.id === selectedCtaId);

  const selectedPack = selectedPackId
    ? packs.find(
        (p) => String(p.id) === selectedPackId || p.bucket_directory === selectedPackId
      )
    : null;

  const allLoading =
    templatesLoading || brandLoading || ctasLoading || packsLoading;

  type BrandSettings = {
    name?: string;
    niche?: string;
    aesthetic?: string;
    content_pillars?: string[];
  };

  return (
    <div className="flex flex-col gap-4 h-fit">
      {/* Template Selector */}
      <BaseNode>
        <BaseNodeHeader>
          <BaseNodeHeaderTitle className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-primary" />
            Template Selector
          </BaseNodeHeaderTitle>
        </BaseNodeHeader>

        <BaseNodeContent className="space-y-4">
          {templatesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading templates...
              </span>
            </div>
          ) : !templatesArr || templatesArr.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-2">
              <p className="mb-4">No templates found for this brand</p>
              <Button
                size="sm"
                onClick={() => router.push(`templates`)}
              >
                Create your first template
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Select Template
                </label>
                <Combobox
                  items={filteredTemplates}
                  value={(selectedTemplate as Tables<"templates">) || null}
                  onValueChange={onTemplateSelect as any}
                  itemToStringLabel={(template: Tables<"templates">) =>
                    template?.name ?? ""
                  }
                >
                  <ComboboxInput placeholder="Choose a template..." showClear />
                  <ComboboxContent>
                    <ComboboxEmpty>No templates found.</ComboboxEmpty>
                    <ComboboxList>
                      {filteredTemplates.map((template: Tables<"templates">) => (
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
                        <span>
                          {(selectedTemplate.content_rules as any).slide_count}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </BaseNodeContent>
      </BaseNode>

      {/* Brand Selector */}
      <BaseNode>
        <BaseNodeHeader>
          <BaseNodeHeaderTitle className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-primary" />
            Current Brand
          </BaseNodeHeaderTitle>
        </BaseNodeHeader>

        <BaseNodeContent className="space-y-4">
          {brandLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading brand...
              </span>
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
                      <span className="font-medium">
                        {(brand.brand_settings as BrandSettings).name}
                      </span>
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

              {(brand.brand_settings as BrandSettings)?.content_pillars &&
                (brand.brand_settings as BrandSettings).content_pillars!.length >
                  0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Content Pillars
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(brand.brand_settings as BrandSettings)
                          .content_pillars!.slice(0, 3)
                          .map((pillar: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {pillar}
                            </Badge>
                          ))}
                        {(brand.brand_settings as BrandSettings)
                          .content_pillars!.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +
                            {(brand.brand_settings as BrandSettings)
                              .content_pillars!.length - 3}{" "}
                            more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                )}
            </div>
          )}
        </BaseNodeContent>
      </BaseNode>

      {/* CTA Selector */}
      <BaseNode>
        <BaseNodeHeader>
          <BaseNodeHeaderTitle className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            CTA Selector
          </BaseNodeHeaderTitle>
        </BaseNodeHeader>

        <BaseNodeContent className="space-y-4">
          {ctasLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading CTAs...
              </span>
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
                  onValueChange={onCtaSelect as any}
                  itemToStringLabel={(cta: BrandCta) => cta?.label ?? ""}
                >
                  <ComboboxInput placeholder="Choose a CTA..." showClear />
                  <ComboboxContent>
                    <ComboboxEmpty>No CTAs found.</ComboboxEmpty>
                    <ComboboxList>
                      {activeCtas.map((cta: BrandCta) => (
                        <ComboboxItem key={cta.id} value={cta.id}>
                          <Item size="xs" className="p-0">
                            <ItemTitle className="font-medium">
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
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    CTA Details
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Text:</span>
                      <span className="text-xs truncate max-w-32 text-right">
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
              )}
            </div>
          )}
        </BaseNodeContent>
      </BaseNode>

      {/* Stock Pack Selector */}
      <BaseNode>
        <BaseNodeHeader>
          <BaseNodeHeaderTitle className="flex items-center gap-2 text-sm">
            <Images className="w-4 h-4 text-primary" />
            Stock Pack Selector
          </BaseNodeHeaderTitle>
        </BaseNodeHeader>

        <BaseNodeContent className="space-y-4">
          {packsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading packs...
              </span>
            </div>
          ) : !packs || packs.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-2">
              No active stock packs available
            </div>
          ) : (
            <div className="space-y-3">
              <StockPackDialog
                open={stockPackDialogOpen}
                onOpenChange={setStockPackDialogOpen}
                setSelectedPack={(bucketDirectory) => onPackSelect(bucketDirectory)}
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
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </BaseNodeContent>
      </BaseNode>

      {/* Generate Button */}
      <button
        onClick={onGenerateClick}
        disabled={isGenerating || !selectedTemplateId}
        className="w-full bg-primary rounded-lg p-4 shadow-sm border border-border hover:shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        <span className="font-medium">
          {isGenerating ? "Generating..." : "Generate"}
        </span>
        {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
      </button>
    </div>
  );
}
