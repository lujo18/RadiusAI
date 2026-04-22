import "./tw-animate.css";
import "@/app/globals.css";
import React from "react";
import type { Metadata } from "next";
import { Fraunces, Instrument_Serif, Inter, Plus_Jakarta_Sans, Syne } from "next/font/google";

import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { ThemeProvider } from "@/components/provider/theme-provider";
import { PostHogProvider } from "@/lib/posthog/provider";

const serif = Instrument_Serif({
  subsets: ["latin"], variable: "--font-serif",
  weight: "400"
});
const syne = Syne({ subsets: ["latin"], variable: "--font-sans" });
// const main = Plus_Jakarta_Sans({
//   subsets: ["latin"],
//   variable: "--font-main",
// });

export const metadata: Metadata = {
  title: "Radius - Automate",
  description:
    "Generate, schedule, and optimize Instagram & TikTok carousels on autopilot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${serif.variable} ${syne.variable}`}>
      <head>
        <link rel="icon" href="/images/favicon.png" type="image/png" />
      </head>
      <body className={`antialiased`}>
        {" "}
        {/**${main.variable} */}
        {/* App name is Radius everywhere */}
        <PostHogProvider>
          <QueryProvider>
            <AuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </AuthProvider>
          </QueryProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
