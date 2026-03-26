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
import {
  ArrowUp,
  BadgeCheck,
  ChartBarIncreasing,
  ChartNoAxesColumnIncreasing,
  ChevronsUpDown,
  LayoutDashboard,
  Plus,
  Users,
} from "lucide-react";
import { useGetBrandUsage } from "@/features/usage/hooks";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Skeleton } from "../ui/skeleton";

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
  const { data: brandUsage, isLoading: brandUsageLoading } = useGetBrandUsage();

  if (brandUsageLoading) {
    return (
      <Skeleton/>
    )
  };

  const CreateButton = () => {
    return (
      <DropdownMenuItem
            className="p-2 flex justify-between"
            onClick={onCreateBrand}
            disabled={brandUsage?.remaining <= 0}
          >
            <div className="flex flex-row items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <span>Create Brand</span>
            </div>
            <span className="muted">
              {brandUsage?.brand_count ?? 0} /{" "}
              {brandUsage?.brand_limit ?? "Unlimited"}
            </span>
          </DropdownMenuItem>
    )
  }


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
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Brands
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => handleBrandSwitch(null)}
          className="gap-2 p-2"
        >
          <div className="flex size-6 items-center justify-center rounded-sm border">
            <LayoutDashboard className="size-4 shrink-0" />
          </div>
          All Brands
          {!activeBrandId && (
            <BadgeCheck className="ml-auto size-4 text-primary" />
          )}
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
            const brandName =
              (brand.brand_settings as any)?.name || "Unnamed Brand";
            return (
              <DropdownMenuItem
                key={brand.id}
                onClick={() => handleBrandSwitch(brand.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Users className="size-4 shrink-0" />
                </div>
                {brandName}
                {activeBrandId === brand.id && (
                  <BadgeCheck className="ml-auto size-4 text-primary" />
                )}
              </DropdownMenuItem>
            );
          })
        ) : (
          <DropdownMenuItem
            disabled
            className="gap-2 p-2 text-muted-foreground"
          >
            No brands yet
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <HoverCard openDelay={10} closeDelay={200}>
          {brandUsage?.remaining <= 0 ? (
            <HoverCardTrigger>
              <CreateButton/>
            </HoverCardTrigger>
          ) : (
            <CreateButton/>
          )}
          <HoverCardContent className="mt-2 flex flex-row items-center gap-2">
            <ChartNoAxesColumnIncreasing className="small text-primary" size={16}/>
            <span className="small text-primary">Upgrade to create more brands</span>
          </HoverCardContent>
          
        </HoverCard>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}