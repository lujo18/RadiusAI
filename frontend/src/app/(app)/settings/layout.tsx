"use client";

import React, { useEffect } from "react";
import { useSidebarNav, NavItem } from "@/components/Dashboard/sidebarContext";
import { CreditCard, Settings, Lock, Bell, Image } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { navItems, setNavItems } = useSidebarNav();

  useEffect(() => {
    const prev = navItems;
    const items: NavItem[] = [
      { title: "Account", key: "account", href: "/settings/account", icon: Settings },
      { title: "Billing", key: "billing", href: "/settings/billing", icon: CreditCard },
      { title: "Security", key: "security", href: "/settings/security", icon: Lock },
      { title: "Notifications", key: "notifications", href: "/settings/notifications", icon: Bell },
      { title: "Appearance", key: "appearance", href: "/settings/appearance", icon: Image },
    ];

    setNavItems(items);
    return () => setNavItems(prev);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
