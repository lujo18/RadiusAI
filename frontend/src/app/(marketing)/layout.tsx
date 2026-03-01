import React from "react";
import type { Metadata } from "next";
import PublicNavbar from "@/components/PublicNavbar";
import Footerdemo from "@/components/Home/Footer";
import AppBanner from "@/components/AppBanner";

export const metadata: Metadata = {
  title: "Radius | TikTok Slideshow & Instagram Carousel Automation Generator",
  description: "Automate your social media growth. Radius is the best AI TikTok slideshow automation, Instagram carousel generator, and A/B CTA testing tool for modern creators.",
  keywords: "tiktok slideshow automation, instagram carousel generator, tiktok carousel maker, best carousel templates, AI social media generator, automated A/B CTA testing, tiktok slides maker, instagram content automation, niche templates for creators",
  openGraph: {
    title: "Radius - #1 AI TikTok Slideshow & Carousel Generator",
    description: "Create engaging TikTok slideshows and Instagram carousels in seconds. Built-in CTA testing and niche templates to maximize your engagement.",
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
