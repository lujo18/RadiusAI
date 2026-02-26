import React from "react";
import PublicNavbar from "@/components/PublicNavbar";
import Footerdemo from "@/components/Home/Footer";
import AppBanner from "@/components/AppBanner";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
    
      <AppBanner location="(marketing)" />
      <PublicNavbar />
      <main>{children}</main>
      <Footerdemo />
    </div>
  );
}
