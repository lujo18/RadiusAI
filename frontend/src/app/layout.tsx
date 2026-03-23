import './tw-animate.css';
import '@/app/globals.css';
import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { ThemeProvider } from "@/components/provider/theme-provider";
import { PublicTeamProvider } from "@/hooks/usePublicTeam";
import { PublicTeamInitializer } from "@/components/PublicTeamInitializer";


const inter = Inter({ subsets: ["latin"] });
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/favicon.png" type="image/png" />
      </head>
      <body className={`${inter.className} font-sans antialiased`}> {/**${main.variable} */}
       
        {/* App name is Radius everywhere */}
        <QueryProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <PublicTeamProvider>
                <PublicTeamInitializer />
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  {children}
                </ThemeProvider>
              </PublicTeamProvider>
            </Suspense>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
