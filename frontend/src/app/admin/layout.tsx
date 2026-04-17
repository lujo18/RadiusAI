"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  Zap,
  Star,
  Home,
  Package,
  FileText,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/api/hooks/useAuth";
import { useUserProfile } from "@/features/user/hooks";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    title: "Pricing Plans",
    href: "/admin/pricing",
    icon: DollarSign,
  },
  {
    title: "System Templates",
    href: "/admin/templates",
    icon: Zap,
  },
  {
    title: "Preset Packs",
    href: "/admin/preset-packs",
    icon: Package,
  },
  {
    title: "Testimonials",
    href: "/admin/testimonials",
    icon: Star,
  },
  {
    title: "Blog",
    href: "/admin/blog",
    icon: FileText,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/");
      return;
    }

    if (!authLoading && isAuthenticated && !profileLoading && !profile?.is_admin) {
      router.replace("/overview");
    }
  }, [authLoading, isAuthenticated, profileLoading, profile, router]);

  if (authLoading || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner className="size-8" />
          <p className="mt-2 text-sm text-foreground/60">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profile?.is_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-foreground/70">Admin access required.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-64 bg-card/50 border-r border-border backdrop-blur-md">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Admin</h1>
          <p className="text-sm text-foreground/60">Dashboard</p>
        </div>

        <Separator className="bg-border/50" />

        <nav className="p-4 space-y-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary text-background shadow-lg shadow-primary/20"
                    : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
