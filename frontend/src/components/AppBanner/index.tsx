"use client";

import React, { useState, useEffect } from "react";
import { X, Megaphone, AlertTriangle, Wrench, Zap } from "lucide-react";
import { useBannersForLocation, type BannerLocation } from "@/features/app-banner";
import type { Database } from "@/types/database";

type BannerStatus = Database["public"]["Enums"]["app_banner_status"];

interface AppBannerProps {
  location: BannerLocation;
}

const STORAGE_KEY_PREFIX = "radius_banner_dismissed_";

function getDismissedIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PREFIX + "ids");
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function dismissBanner(id: string) {
  try {
    const current = getDismissedIds();
    current.add(id);
    sessionStorage.setItem(
      STORAGE_KEY_PREFIX + "ids",
      JSON.stringify(Array.from(current)),
    );
  } catch {
    // sessionStorage unavailable — fail silently
  }
}

const typeConfig: Record<
  BannerStatus,
  {
    icon: React.ReactNode;
    containerClass: string;
    textClass: string;
    closeClass: string;
  }
> = {
  deal: {
    icon: <Zap className="size-3.5 shrink-0" aria-hidden />,
    containerClass:
      "bg-primary/15 border-primary/30 text-primary-foreground",
    textClass: "text-primary",
    closeClass: "text-primary/60 hover:text-primary",
  },
  info: {
    icon: <Megaphone className="size-3.5 shrink-0" aria-hidden />,
    containerClass: "bg-blue-500/10 border-blue-500/25",
    textClass: "text-blue-400",
    closeClass: "text-blue-400/60 hover:text-blue-400",
  },
  warning: {
    icon: <AlertTriangle className="size-3.5 shrink-0" aria-hidden />,
    containerClass: "bg-destructive/10 border-destructive/25",
    textClass: "text-destructive",
    closeClass: "text-destructive/60 hover:text-destructive",
  },
  maintenance: {
    icon: <Wrench className="size-3.5 shrink-0" aria-hidden />,
    containerClass: "bg-amber-500/10 border-amber-400/25",
    textClass: "text-amber-400",
    closeClass: "text-amber-400/60 hover:text-amber-400",
  },
};

/**
 * Slim announcement banner rendered at the very top of a layout.
 * Pass `location="(marketing)"` or `location="(app)"` to scope which
 * banners are shown. All active banners are fetched once and cached
 * globally by TanStack Query, so both layouts share the same request.
 */
export default function AppBanner({ location }: AppBannerProps) {
  const { data: banners, isLoading } = useBannersForLocation(location);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Hydrate dismissed IDs from sessionStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setDismissedIds(getDismissedIds());
  }, []);

  if (isLoading || !banners.length) return null;

  // Only show banners that haven't been dismissed this session
  const visible = banners.filter((b) => !dismissedIds.has(b.id));
  if (!visible.length) return null;

  const handleDismiss = (id: string) => {
    dismissBanner(id);
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  return (
    <div role="region" aria-label="Announcements">
      {visible.map((banner) => {
        const type = banner.type ?? "info";
        const cfg = typeConfig[type];

        return (
          <div
            key={banner.id}
            className={`relative flex items-center justify-center gap-2 border-b px-4 py-3 text-sm ${cfg.containerClass}`}
            role="status"
            aria-live="polite"
          >
           
              {/* Icon */}
              <span className={cfg.textClass}>{cfg.icon}</span>
              {/* Message */}
              <span className={`text-xs font-medium leading-none ${cfg.textClass}`}>
                {banner.message}
              </span>
            

            {/* Dismiss */}
            <button
              onClick={() => handleDismiss(banner.id)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${cfg.closeClass}`}
              aria-label="Dismiss banner"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
