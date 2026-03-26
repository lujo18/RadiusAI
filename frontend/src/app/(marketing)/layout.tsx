import React from "react";
import type { Metadata } from "next";
import PublicNavbar from "@/components/PublicNavbar";
import Footerdemo from "@/components/Home/Footer";
import AppBanner from "@/components/AppBanner";

export const metadata: Metadata = {
  title: "Radius | AI TikTok Slideshow & Instagram Carousel Generator",
  description: "Transform your social media growth with Radius. The #1 AI TikTok slideshow automation and Instagram carousel generator for high-signal founders and creators. Automate carousel creation with niche templates and built-in A/B CTA testing.",
  keywords: "tiktok slideshow automation, instagram carousel generator, tiktok carousel maker, AI social media automation, automated A/B CTA testing, instagram content automation, best carousel templates for business, social media growth tools, AI content generator for solo founders",
  openGraph: {
    title: "Radius - #1 AI TikTok Slideshow & Carousel Generator",
    description: "Create engaging TikTok slideshows and Instagram carousels in seconds. Built-in CTA testing and niche templates to maximize your engagement and revenue.",
    url: "https://getradius.ai", // Substitute with real URL
    siteName: "Radius",
    images: [
      {
        url: "https://startup-template-sage.vercel.app/hero-dark.png",
        width: 1200,
        height: 630,
        alt: "Radius Carousel Generator Preview",
      }
    ],
    locale: "en-US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Radius | Automate TikTok Slideshows & Instagram Carousels",
    description: "Generate beautiful, high-converting carousels automatically using AI. Best for TikTok & Instagram growth.",
    images: ["https://startup-template-sage.vercel.app/hero-dark.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://getradius.ai",
  }
};

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
