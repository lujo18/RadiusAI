"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useSidebarNav, NavItem } from "@/components/Dashboard/sidebarContext";
import { CreditCard, Settings, Lock, Bell, Image } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { navItems, setNavItems } = useSidebarNav();
  const params = useParams();
  const teamId = params?.teamId as string;

  useEffect(() => {
    const prev = navItems;
    const items: NavItem[] = [
      { title: "Account", key: "account", href: `/${teamId}/settings/account`, icon: Settings },
      { title: "Billing", key: "billing", href: `/${teamId}/settings/billing`, icon: CreditCard },
      { title: "Security", key: "security", href: `/${teamId}/settings/security`, icon: Lock },
      { title: "Notifications", key: "notifications", href: `/${teamId}/settings/notifications`, icon: Bell },
      { title: "Appearance", key: "appearance", href: `/${teamId}/settings/appearance`, icon: Image },
    ];

    setNavItems(items);
    return () => setNavItems(prev);
  }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="p-8">{children}</div>;
}
