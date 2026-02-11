"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBrands } from '@/features/brand/hooks';
import { useAuthStore } from "@/store";
import { TemplateSelector } from "@/components/Templates/TemplateSelector";
import { OverviewPageComponent } from "@/components/pages/OverviewPageComponent";

export default function BrandOverviewPage({ params }: { params: Promise<{ brandId: string }> }) {
  const router = useRouter();
  const { brandId } = React.use(params);
  const user = useAuthStore((state) => state.user);
  const { data: brands, isLoading, error } = useBrands();
  
  // Redirect to /overview if:
  // A. brandId doesn't exist in Supabase (not in user's brands list after loading)
  // B. User doesn't own the brand (brand.user_id !== user.id)
  React.useEffect(() => {
    if (isLoading) return; // Wait for brands to load
    if (!Array.isArray(brands)) return; // No brands or not an array
    if (brands.length === 0) return; // No brands yet - could still be loading or user has no brands
    
    const found = brands.find((b: any) => b.id === brandId);
    // Only redirect if brand explicitly doesn't exist AND we have successfully loaded brands
    if (!found) {
      router.replace('/overview');
    }
  }, [brands, isLoading, brandId, router]);

  return (
    <OverviewPageComponent brandId={brandId}/>
  );
}
