"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store";
import { useBrands } from "@/features/brand/hooks";
import { useBrandFilter } from "@/hooks/useBrandFilter";
import BrandSetupWizard from "@/components/Profiles/BrandSetupWizard";
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
import { UsageMeter } from "@/components/billingsdk/usage-meter";
import { useGetBrandUsage, useUsage } from "@/features/usage/hooks";
import { useGetCreditsUsage } from "@/features/usage/hooks";
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
  AlertTriangle,
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
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  Loader2,
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
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "../ui/badge";
import { useSidebarNav } from "./sidebarContext";
import { isAdminUser, useUserProfile } from "@/features/user/hooks";
import BrandSelector from "./BrandSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import { FcIdea } from "react-icons/fc";
import { Button } from "../ui/button";
import { QuickMessagingDialog } from "@/features/messaging/components/QuickMessageDialog";

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
      | "profiles",
  ) => void;
  onLogout: () => void;
  header?: React.ReactNode;
  children: React.ReactNode;
}

type SupportStep = 'type' | 'message';
type SupportType = 'error' | 'idea';
type SupportStatus = 'idle' | 'loading' | 'success' | 'error';

export default function DashboardSidebar({
  activeTab,
  setActiveTab,
  onLogout,
  header,
  children,
}: SidebarWrapperProps) {
  const isMobile = useIsMobile();

  // Support dialog state
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportStep, setSupportStep] = useState<SupportStep>('type');
  const [supportType, setSupportType] = useState<SupportType | null>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportStatus, setSupportStatus] = useState<SupportStatus>('idle');

  const resetSupport = () => {
    setSupportStep('type');
    setSupportType(null);
    setSupportMessage('');
    setSupportStatus('idle');
  };

  const handleSupportTypeSelect = (t: SupportType) => {
    setSupportType(t);
    setSupportStep('message');
  };

  const handleSupportSubmit = async () => {
    if (!supportType || !supportMessage.trim()) return;
    setSupportStatus('loading');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          type: supportType,
          message: supportMessage.trim(),
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      setSupportStatus('success');
    } catch {
      setSupportStatus('error');
    }
  };
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const supabaseUser = useAuthStore((state) => state.supabaseUser);
  const { activeBrandId } = useBrandFilter();
  const [showWizard, setShowWizard] = useState(false);

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

  // Read nav items from context (allows nested layouts to override)
  const { navItems } = useSidebarNav();

  const pathname = usePathname();

  // Get active brand details
  const activeBrand = brands?.find((b) => b.id === activeBrandId);
  const displayName = activeBrand
    ? (activeBrand.brand_settings as any)?.name || "Brand"
    : "All Brands";
  const displayPlan = activeBrand ? "Brand View" : "Overview";

  // Navigate to brand route
  const params = useParams();
  const teamId = params?.teamId as string;
  const handleBrandSwitch = (brandId: string | null) => {
    if (brandId === null) {
      // Go to "All Brands" - route to /[teamId]/overview
      router.push(`/${teamId}/overview`);
    } else {
      // Go to specific brand - route to /[teamId]/brand/{brandId}
      const pathSegments = pathname.split("/").filter(Boolean);
      const currentPage = pathSegments[pathSegments.length - 1];
      const isSubPage = [
        "generate",
        "calendar",
        "templates",
        "analytics",
        "settings",
      ].includes(currentPage);
      router.push(
        isSubPage
          ? `/${teamId}/brand/${brandId}/${currentPage}`
          : `/${teamId}/brand/${brandId}`,
      );
    }
  };

  return (
    <>
      <Sidebar collapsible="icon" variant="floating" className="list-none">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <BrandSelector
                brands={brands}
                brandsLoading={brandsLoading}
                activeBrandId={activeBrandId}
                isMobile={isMobile}
                displayName={displayName}
                displayPlan={displayPlan}
                handleBrandSwitch={handleBrandSwitch}
                onCreateBrand={() => setShowWizard(true)}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map((item) => {
                // Resolve href if it's a function (pass current activeBrandId)
                const resolvedHref =
                  typeof item.href === "function"
                    ? item.href(activeBrandId)
                    : item.href;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === resolvedHref}
                      tooltip={item.title}
                    >
                      <Link href={resolvedHref}>
                        {item.icon ? <item.icon /> : null}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
          {/* Usage meter group */}

          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <QuickMessagingDialog/>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          {/* <SidebarGroupLabel>Usage</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="w-full px-3">
                  <UsageWidget />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
           */}
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
                        {user?.name || "User"}{" "}
                        {isAdminUser() && <Badge>Dev</Badge>}
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
                    <DropdownMenuItem
                      onClick={() => {
                        setActiveTab("style");
                        router.push(`/${teamId}/settings`);
                      }}
                    >
                      <Settings />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        router.push(`/${teamId}/settings/billing`);
                      }}
                    >
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
      </Sidebar>

      <SidebarInset>
        {header}
        <div className="flex flex-1 flex-col gap-4 pt-0">{children}</div>
      </SidebarInset>

      <BrandSetupWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
      />
    </>
  );
}

function UsageWidget() {
  const { data: creditsData, isLoading } = useGetCreditsUsage();

  const creditsUsed = creditsData?.credits_used ?? 0;
  const creditsLimit = creditsData?.credits_limit ?? null;

  return (
    <div>
      <UsageMeter
        usage={[
          { name: "Credits", usage: creditsUsed, limit: creditsLimit ?? 0 },
        ]}
        variant="linear"
        size="sm"
        progressColor="usage"
        className="p-0 border-transparent"
      />
    </div>
  );
}
