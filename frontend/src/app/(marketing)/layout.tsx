import React from "react";
import PublicNavbar from "@/components/PublicNavbar";
import Footerdemo from "@/components/Home/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNavbar />
      <main>{children}</main>
      <Footerdemo />
    </>
  );
}
