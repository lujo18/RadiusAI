"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { useBrands } from "@/lib/api/hooks/useBrands";
import { useBrandFilter } from "@/hooks/useBrandFilter";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuAction,
} from "@/components/animate-ui/components/radix/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AudioWaveform,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Calendar,
  ChevronRight,
  ChevronsUpDown,
  Command,
  CreditCard,
  FileText,
  Folder,
  Forward,
  Frame,
  GalleryVerticalEnd,
  LayoutDashboard,
  LogOut,
  Map,
  MoreHorizontal,
  PieChart,
  Plus,
  Settings,
  Settings2,
  Sparkles,
  SquareTerminal,
  Trash2,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "../ui/badge";
import { isAdminUser, useUserProfile } from "@/lib/api/hooks/useUser";

interface SidebarWrapperProps {
  activeTab: string;
  setActiveTab: (
    tab:
      | "overview"
      | "calendar"
      | "templates"
      | "analytics"
      | "style"
      | "generate"
      | "profiles"
  ) => void;
  onLogout: () => void;
  header?: React.ReactNode;
  children: React.ReactNode;
}

export default function DashboardSidebar({
  activeTab,
  setActiveTab,
  onLogout,
  header,
  children,
}: SidebarWrapperProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const supabaseUser = useAuthStore((state) => state.supabaseUser);
  const { activeBrandId } = useBrandFilter();
  
  // Fetch user brands
  const { data: brands, isLoading: brandsLoading } = useBrands();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Build base path with brandId
  const basePath = activeBrandId ? `/brand/${activeBrandId}` : '/brand';

  const navItems = [
    {
      title: "Overview",
      icon: LayoutDashboard,
      key: "overview" as const,
      href: activeBrandId ? basePath : '/overview',
    },
    {
      title: "Posts",
      icon: GalleryVerticalEnd,
      key: "posts" as const,
      href: activeBrandId ? `${basePath}/posts` : '/brand',
    },
    {
      title: "Generate",
      icon: Sparkles,
      key: "generate" as const,
      href: activeBrandId ? `${basePath}/generate` : '/brand',
    },
    {
      title: "Calendar",
      icon: Calendar,
      key: "calendar" as const,
      href: activeBrandId ? `${basePath}/calendar` : '/brand',
    },
    {
      title: "Templates",
      icon: FileText,
      key: "templates" as const,
      href: activeBrandId ? `${basePath}/templates` : '/brand',
    },
    {
      title: "Analytics",
      icon: BarChart3,
      key: "analytics" as const,
      href: activeBrandId ? `${basePath}/analytics` : '/brand',
    },
    {
      title: "Settings",
      icon: Settings,
      key: "settings" as const,
      href: activeBrandId ? `${basePath}/settings` : '/brand',
    },
  ];

  const pathname = usePathname();

  // Get active brand details
  const activeBrand = brands?.find((b) => b.id === activeBrandId);
  const displayName = activeBrand 
    ? ((activeBrand.brand_settings as any)?.name || 'Brand') 
    : "All Brands";
  const displayPlan = activeBrand ? "Brand View" : "Overview";

  // Navigate to brand route
  const handleBrandSwitch = (brandId: string | null) => {
    if (brandId === null) {
      // Go to "All Brands" - route to /overview
      router.push('/overview');
    } else {
      // Go to specific brand - route to /brand/{brandId}
      const pathSegments = pathname.split('/').filter(Boolean);
      const currentPage = pathSegments[pathSegments.length - 1];
      const isSubPage = ['generate', 'calendar', 'templates', 'analytics', 'settings'].includes(currentPage);
      router.push(isSubPage ? `/brand/${brandId}/${currentPage}` : `/brand/${brandId}`);
    }
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
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
                      <span className="truncate font-semibold">
                        {displayName}
                      </span>
                      <span className="truncate text-xs">
                        {displayPlan}
                      </span>
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
                  
                  {/* All Brands Option */}
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
                  
                  {/* Individual Brands */}
                  {brandsLoading ? (
                    <DropdownMenuItem disabled className="gap-2 p-2">
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Users className="size-4 shrink-0 animate-pulse" />
                      </div>
                      Loading brands...
                    </DropdownMenuItem>
                  ) : brands && brands.length > 0 ? (
                    brands.map((brand) => {
                      const brandName = (brand.brand_settings as any)?.name || 'Unnamed Brand';
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
                    <DropdownMenuItem disabled className="gap-2 p-2 text-muted-foreground">
                      No brands yet
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="gap-2 p-2"
                    asChild
                  >
                    <Link href="/brand/profiles">
                      <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                        <Plus className="size-4" />
                      </div>
                      <div className="font-medium text-muted-foreground">
                        Create Brand
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>

        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.href ||
                      (item.href === "/brand" && pathname === "/brand")
                    }
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={supabaseUser?.user_metadata?.avatar_url}
                        alt={user?.name || user?.email || "User"}
                      />
                      <AvatarFallback className="rounded-lg">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.name || "User"} {isAdminUser() && <Badge>Dev</Badge>}
                      </span>
                      <span className="truncate text-xs">{user?.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={supabaseUser?.user_metadata?.avatar_url}
                          alt={user?.name || user?.email || "User"}
                        />
                        <AvatarFallback className="rounded-lg">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user?.name || "User"}
                        </span>
                    
                        <span className="truncate text-xs">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {user?.plan === null && (
                      <>
                        <DropdownMenuItem>
                          <Sparkles />
                          Upgrade to Pro
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => setActiveTab("style")}>
                      <Settings />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard />
                      Billing
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        {header}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </>
  );
}
