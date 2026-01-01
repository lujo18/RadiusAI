import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/components/QueryProvider";

const inter = Inter({ subsets: ["latin"] });
const main = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: '--font-main'
})

export const metadata: Metadata = {
  title: "Radius - AI-Powered Carousel Automation",
  description: "Generate, schedule, and optimize Instagram & TikTok carousels on autopilot",
};

export default function RootLayout({
  children,
}: Readonly<{
import React from "react";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/components/QueryProvider";

const inter = Inter({ subsets: ["latin"] });
const main = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: '--font-main'
})

export const metadata: Metadata = {
  title: "Radius - AI-Powered Carousel Automation",
  description: "Generate, schedule, and optimize Instagram & TikTok carousels on autopilot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/favicon.png" type="image/png" />
      </head>
      <body className={`${inter.className} ${main.variable}`}> {/* App name is Radius everywhere */}
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
