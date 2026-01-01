
import { usePathname, useRouter } from "next/navigation";
import {
  FiCalendar,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiTrendingUp,
  FiLayers,
  FiUser,
  FiBell,
  FiSearch,
} from "react-icons/fi";
import Image from "next/image";
import { useAuthStore } from "@/store";
import { logOut } from "@/lib/supabase/auth";
import { useState, useEffect } from "react";
import SubscriptionBanner from "@/components/SubscriptionBanner";

"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  FiCalendar,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiTrendingUp,
  FiLayers,
  FiUser,
  FiBell,
  FiSearch,
} from "react-icons/fi";
import Image from "next/image";
import { useAuthStore } from "@/store";
import { logOut } from "@/lib/supabase/auth";
import { useState, useEffect } from "react";
import SubscriptionBanner from "@/components/SubscriptionBanner";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const supabaseUser = useAuthStore((state) => state.supabaseUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [notifications] = useState(2);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);

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
    console.log("[Dashboard] Subscription check:", {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      userPlan: user?.plan,
    });

    if (!isLoading && isAuthenticated && user) {
      // User is authenticated - let them see dashboard with banner if no subscription
      console.log("[Dashboard] User authenticated, plan:", user.plan || "none");
      setSubscriptionChecked(true);
    } else if (!isLoading && !isAuthenticated) {
      // Not authenticated at all - redirect to login
      console.log("[Dashboard] Not authenticated - redirecting to login");
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleLogout = async () => {
    try {
      await logOut();
      logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      logout();
      router.push("/login");
    }
  };

  // Show loading state while checking auth and subscription
  console.log("[Dashboard] Render check:", {
    isLoading,
    isAuthenticated,
    subscriptionChecked,
    willShowLoading: isLoading || (isAuthenticated && !subscriptionChecked),
    willRenderNull: !isAuthenticated || !subscriptionChecked,
  });

  if (isLoading || (isAuthenticated && !subscriptionChecked)) {
    console.log("[Dashboard] Showing loading screen");
    return (
      <div className="min-h-screen bg-dark-600 flex items-center justify-center">

        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated or no subscription
  if (!isAuthenticated || !subscriptionChecked) {
    console.log("[Dashboard] Not rendering - returning null");
    return null;
  }

  const navItems = [
    { path: "/dashboard", icon: <FiBarChart2 />, label: "Dashboard" },
    { path: "/dashboard/generate", icon: <FiBarChart2 />, label: "Generate" },
    { path: "/dashboard/calendar", icon: <FiCalendar />, label: "Calendar" },
    { path: "/dashboard/templates", icon: <FiLayers />, label: "Templates" },
    { path: "/dashboard/profiles", icon: <FiUser />, label: "Profiles" },
    {
      path: "/dashboard/analytics",
      icon: <FiTrendingUp />,
      label: "Analytics",
    },
    { path: "/dashboard/settings", icon: <FiSettings />, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-dark-600 text-white">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 glass-card border-b border-white/5 z-50 px-6">
        <div className="flex items-center justify-between h-full max-w-screen-2xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/icon-primary.png"
              alt="Radius Logo"
              width={32}
              height={32}
            />
            <span className="text-xl font-display font-medium text-white">Radius</span>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns, templates..."
                className="w-full bg-dark-200 border border-white/10 rounded-button pl-11 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-white/5 rounded-button transition-colors">
              <FiBell className="text-xl text-gray-400" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-white">
                  {supabaseUser?.user_metadata?.full_name ||
                    supabaseUser?.user_metadata?.name ||
                    user?.email?.split("@")[0] ||
                    "User"}
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {user?.plan || "Free"} Plan
                </div>
              </div>
              {supabaseUser?.user_metadata?.avatar_url ||
              supabaseUser?.user_metadata?.picture ? (
                <img
                  src={
                    supabaseUser.user_metadata.avatar_url ||
                    supabaseUser.user_metadata.picture
                  }
                  alt={
                    supabaseUser?.user_metadata?.full_name ||
                    supabaseUser?.user_metadata?.name ||
                    "User"
                  }
                  className="w-10 h-10 rounded-full border-2 border-primary-500 object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 glass-card border-r border-white/5 p-4 overflow-y-auto">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={
                    isActive
                      ? "sidebar-item-active w-full"
                      : "sidebar-item w-full"
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
            <button
              onClick={handleLogout}
              className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <FiLogOut className="text-lg" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8 min-h-[calc(100vh-4rem)]">
          <div className="max-w-screen-2xl mx-auto">
            {/* Show subscription banner if no active subscription */}
            <SubscriptionBanner />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
