"use client";

import React, { createContext, useContext, useState } from "react";
import type { Icon as LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  key: string;
  href: string | ((brandId?: string | null) => string);
  icon?: any; // lucide icon component
};

type SidebarNavContextType = {
  navItems: NavItem[];
  setNavItems: (items: NavItem[] | ((prev: NavItem[]) => NavItem[])) => void;
};

const SidebarNavContext = createContext<SidebarNavContextType | undefined>(undefined);

export function SidebarNavProvider({ children, initial }: { children: React.ReactNode; initial?: NavItem[] }) {
  const [navItems, setNavItems] = useState<NavItem[]>(initial || []);
  return (
    <SidebarNavContext.Provider value={{ navItems, setNavItems }}>
      {children}
    </SidebarNavContext.Provider>
  );
}

export function useSidebarNav() {
  const ctx = useContext(SidebarNavContext);
  if (!ctx) throw new Error("useSidebarNav must be used within SidebarNavProvider");
  return ctx;
}

export default SidebarNavProvider;
