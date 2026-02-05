import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/animate-ui/components/radix/sidebar";
import { BadgeCheck, ChevronsUpDown, LayoutDashboard, Plus, Users } from "lucide-react";

interface BrandSelectorProps {
  brands?: any[];
  brandsLoading?: boolean;
  activeBrandId?: string | null;
  isMobile?: boolean;
  displayName: string;
  displayPlan: string;
  handleBrandSwitch: (brandId: string | null) => void;
  onCreateBrand: () => void;
}

export default function BrandSelector({
  brands = [],
  brandsLoading = false,
  activeBrandId = null,
  isMobile = false,
  displayName,
  displayPlan,
  handleBrandSwitch,
  onCreateBrand,
}: BrandSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Users className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{displayName}</span>
            <span className="truncate text-xs">{displayPlan}</span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="start"
        side={isMobile ? "bottom" : "right"}
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">Brands</DropdownMenuLabel>

        <DropdownMenuItem onClick={() => handleBrandSwitch(null)} className="gap-2 p-2">
          <div className="flex size-6 items-center justify-center rounded-sm border">
            <LayoutDashboard className="size-4 shrink-0" />
          </div>
          All Brands
          {!activeBrandId && <BadgeCheck className="ml-auto size-4 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {brandsLoading ? (
          <DropdownMenuItem disabled className="gap-2 p-2">
            <div className="flex size-6 items-center justify-center rounded-sm border">
              <Users className="size-4 shrink-0 animate-pulse" />
            </div>
            Loading brands...
          </DropdownMenuItem>
        ) : brands && brands.length > 0 ? (
          brands.map((brand) => {
            const brandName = (brand.brand_settings as any)?.name || "Unnamed Brand";
            return (
              <DropdownMenuItem key={brand.id} onClick={() => handleBrandSwitch(brand.id)} className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Users className="size-4 shrink-0" />
                </div>
                {brandName}
                {activeBrandId === brand.id && <BadgeCheck className="ml-auto size-4 text-primary" />}
              </DropdownMenuItem>
            );
          })
        ) : (
          <DropdownMenuItem disabled className="gap-2 p-2 text-muted-foreground">No brands yet</DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 p-2" onClick={onCreateBrand}>
          <div className="flex size-6 items-center justify-center rounded-md border bg-background">
            <Plus className="size-4" />
          </div>
          <div className="font-medium text-muted-foreground">Create Brand</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
