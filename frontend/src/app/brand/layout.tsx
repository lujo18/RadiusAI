"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { useState, useEffect } from "react";
import SubscriptionBanner from "@/components/SubscriptionBanner";
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
  Sidebar
} from "@/components/animate-ui/components/radix/sidebar";
import { FiBell, FiSearch } from "react-icons/fi";
import { logOut } from "@/lib/supabase/auth";
import DashboardSidebar from '@/components/Dashboard/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const supabaseUser = useAuthStore((state) => state.supabaseUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);
  const [notifications] = useState(2);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'templates' | 'analytics' | 'style' | 'generate' | 'profiles'>('overview');

  // Redirect if not authenticated
  useEffect(() => {
    console.log("[Dashboard] Auth check:", {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
    });

    if (!isLoading && !isAuthenticated) {
      console.log("[Dashboard] Not authenticated - redirecting to login");
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Check subscription status (show banner instead of redirecting)
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // User is authenticated - let them see dashboard with banner if no subscription
      console.log("[Dashboard] User authenticated, plan:", user?.plan || "none");
      setSubscriptionChecked(true);
    } else if (!isLoading && !isAuthenticated) {
      // Not authenticated at all - redirect to login
      console.log("[Dashboard] Not authenticated - redirecting to login");
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || (isAuthenticated && !subscriptionChecked)) {
    console.log("[Dashboard] Showing loading screen");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-foreground">Loading...</Card>
      </div>
    );
  }

  if (!isAuthenticated || !subscriptionChecked) {
    console.log("[Dashboard] Not rendering - returning null");
    return null;
  }

  return (
    <SidebarProvider>
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={logout}
        header={
          <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              

              {/* Search and Notifications */}
              <div className="ml-auto flex items-center gap-4">
                <div className="relative hidden md:block">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-64 h-9 pl-9 pr-3 bg-background border rounded-lg text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <FiBell className="w-5 h-5 text-foreground/80" />
                  {notifications > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
                  )}
                </button>
              </div>
            </div>
          </header>
        }
      >
        <SubscriptionBanner />
        {children}
      </DashboardSidebar>
    </SidebarProvider>
  );
}
