"use client";

import React from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store";
import { useState, useEffect } from "react";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import AppBanner from "@/components/AppBanner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
} from "@/components/animate-ui/components/radix/sidebar";
import PostingModalProvider from "@/components/modals/PostingModalProvider";
import { FiBell, FiSearch } from "react-icons/fi";
import { logOut } from "@/lib/supabase/auth";
import DashboardSidebar from "@/components/Dashboard/Sidebar";
import {
  SidebarNavProvider,
  NavItem,
} from "@/components/Dashboard/sidebarContext";
import {
  LayoutDashboard,
  GalleryVerticalEnd,
  Sparkles,
  Calendar,
  FileText,
  BarChart3,
  Zap,
  Settings,
  DiamondIcon,
  Diamond,
  Bot,
  Cog,
  ToolCase,
  Send,
} from "lucide-react";
import BrandSelector from "@/components/Dashboard/BrandSelector";
import { Highlight } from "@/components/animate-ui/primitives/effects/highlight";
import { useBrands } from "@/features/brand/hooks";
import { useBrandFilter } from "@/hooks/useBrandFilter";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGetCreditsUsage } from "@/features/usage";
import { Badge } from "@/components/ui/badge";
import { AccountDropdown } from "@/components/Dashboard/AccountDropdown";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const { brandId, teamId } = params as { brandId?: string; teamId?: string };
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const supabaseUser = useAuthStore((state) => state.supabaseUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);
  const handleLogout = async () => {
    try {
      // Sign out from Supabase first
      await logOut();
      // Then clear local auth state
      logout();
      // Redirect to login page
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if Supabase signout fails, clear local state
      logout();
      router.push("/");
    }
  };

  const [notifications] = useState(2);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "calendar"
    | "templates"
    | "analytics"
    | "style"
    | "generate"
    | "profiles"
  >("overview");

  // Brands for the brand selector in the header (overview layout)
  const { data: brands, isLoading: brandsLoading } = useBrands();
  const { activeBrandId } = useBrandFilter();
  const isMobile = useIsMobile();

  const { data: creditData } = useGetCreditsUsage();
  const creditsRemaining = creditData?.credits_limit - creditData?.credits_used;

  const activeBrand = brands?.find((b: any) => b.id === activeBrandId);
  const displayName = activeBrand
    ? (activeBrand.brand_settings as any)?.name || "Brand"
    : "All Brands";
  const displayPlan = activeBrand ? "Brand View" : "Overview";

  const handleBrandSwitch = (brandId: string | null) => {
    if (brandId === null) {
      router.push(teamId ? `/${teamId}/overview` : "/overview");
    } else {
      const pathSegments = pathname.split("/").filter(Boolean);
      const currentPage = pathSegments[pathSegments.length - 1];
      const isSubPage = [
        "generate",
        "calendar",
        "templates",
        "analytics",
        "settings",
      ].includes(currentPage);
      const basePath = teamId ? `/${teamId}` : "";
      
      router.push(
        isSubPage
          ? `${basePath}/brand/${brandId}/${currentPage}`
          : `${basePath}/brand/${brandId}`,
      );
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    console.log("[App Layout] Auth check:", {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
    });

    if (!isLoading && !isAuthenticated) {
      console.log("[App Layout] Not authenticated - redirecting to login");
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Check subscription status (show banner instead of redirecting)
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // User is authenticated - let them see dashboard with banner if no subscription
      console.log(
        "[App Layout] User authenticated, plan:",
        user?.plan || "none",
      );

      setSubscriptionChecked(true);
    } else if (!isLoading && !isAuthenticated) {
      // Not authenticated at all - redirect to login
      console.log("[App Layout] Not authenticated - redirecting to login");
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || (isAuthenticated && !subscriptionChecked)) {
    console.log("[App Layout] Showing loading screen");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-foreground">Loading...</Card>
      </div>
    );
  }

  if (!isAuthenticated || !subscriptionChecked) {
    console.log("[App Layout] Not rendering - returning null");
    return null;
  }

  return (
    <div>
      <AppBanner location="(app)" />
      <SidebarProvider>
        {/** Compute default nav for top-level contexts (brand vs overview) */}
        <PostingModalProvider>
          <SidebarNavProvider
            initial={(() => {
              // Provide href as functions so resolved hrefs use the current activeBrandId and teamId
              const basePath = teamId ? `/${teamId}` : "";
              return [
                {
                  title: "Overview",
                  key: "overview",
                  href: (b?: string | null) =>
                    b ? `${basePath}/brand/${b}` : `${basePath}/overview`,
                  icon: LayoutDashboard,
                },
                {
                  title: "Posts",
                  key: "posts",
                  href: (b?: string | null) =>
                    b ? `${basePath}/brand/${b}/posts` : `${basePath}/overview`,
                  icon: GalleryVerticalEnd,
                },
                {
                  title: "Generate",
                  key: "generate",
                  href: (b?: string | null) =>
                    b
                      ? `${basePath}/brand/${b}/generate`
                      : `${basePath}/overview`,
                  icon: Send,
                },
                {
                  title: "Calendar",
                  key: "calendar",
                  href: (b?: string | null) =>
                    b
                      ? `${basePath}/brand/${b}/calendar`
                      : `${basePath}/overview`,
                  icon: Calendar,
                },
                {
                  title: "Templates",
                  key: "templates",
                  href: (b?: string | null) =>
                    b
                      ? `${basePath}/brand/${b}/templates`
                      : `${basePath}/overview`,
                  icon: ToolCase,
                },
                // {
                //   title: "Analytics",
                //   key: "analytics",
                //   href: (b?: string | null) =>
                //     b ? `${basePath}/brand/${b}/analytics` : `${basePath}/overview`,
                //   icon: BarChart3,
                // },
                {
                  title: "Automation",
                  key: "automation",
                  href: (b?: string | null) =>
                    b
                      ? `${basePath}/brand/${b}/automation`
                      : `${basePath}/overview`,
                  icon: Zap,
                },
                {
                  title: "Settings",
                  key: "settings",
                  href: (b?: string | null) =>
                    b
                      ? `${basePath}/brand/${b}/settings`
                      : `${basePath}/overview`,
                  icon: Cog,
                },
              ];
            })()}
          >
            {/* Hide the sidebar for overview pages, show for brand routes */}
            {!pathname.endsWith("/overview") || pathname.includes("/brand") ? (
              <DashboardSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
                header={
                  <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex w-full items-center gap-2 px-4 ">
                      <SidebarTrigger className="-ml-1" />
                      <Separator orientation="vertical" className="mr-2 h-4" />

                      {/* Search and Notifications */}

                      <div className="ml-auto flex gap-4">
                        {creditsRemaining < 20 && (
                          <Badge variant="outline">
                            <span className="text-muted-foreground">
                              Credits low: posting and automations will disable
                            </span>
                          </Badge>
                        )}

                        <Badge
                          className={`flex items-center gap-2 h-7 ${creditsRemaining < 20 && "border-destructive"}`}
                          variant="outline"
                        >
                          <Bot
                            className={
                              creditsRemaining < 20
                                ? `text-destructive`
                                : `text-primary`
                            }
                            size={20}
                          />
                          {creditsRemaining}
                        </Badge>

                        {/* <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <FiBell className="w-5 h-5 text-foreground/80" />
                        {notifications > 0 && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
                        )}
                      </button> */}
                      </div>
                    </div>
                  </header>
                }
              >
                <SubscriptionBanner />
                <SidebarInset>{children}</SidebarInset>
              </DashboardSidebar>
            ) : (
              // Render children full-width when sidebar hidden (overview)

              <div className="min-h-screen w-full">
                <header className="flex h-16 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                  <div className="flex w-full items-center gap-2 px-4">
                    <Highlight enabled hover controlledItems mode="children">
                      <BrandSelector
                        brands={brands}
                        brandsLoading={brandsLoading}
                        activeBrandId={activeBrandId}
                        isMobile={isMobile}
                        displayName={displayName}
                        displayPlan={displayPlan}
                        handleBrandSwitch={handleBrandSwitch}
                        onCreateBrand={() =>
                          router.push(`/${params.teamId}/brand/generate`)
                        }
                      />
                    </Highlight>

                    <Separator orientation="vertical" className="mr-2 h-4" />

                    {/* Search and Notifications */}
                    <div className="ml-auto items-center gap-4">
                      <Highlight enabled hover controlledItems mode="children">
                        <AccountDropdown />
                      </Highlight>
                    </div>
                  </div>
                </header>
                <SubscriptionBanner />
                <main>{children}</main>
              </div>
            )}
          </SidebarNavProvider>
        </PostingModalProvider>
      </SidebarProvider>
    </div>
  );
}
