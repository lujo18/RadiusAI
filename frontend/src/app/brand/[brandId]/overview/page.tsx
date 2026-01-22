"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBrands } from "@/lib/api/hooks/useBrands";
import { useAuthStore } from "@/store";
import { TemplateSelector } from "@/components/Templates/TemplateSelector";

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
    <div className="px-8 py-12 max-w-6xl mx-auto overflow-hidden">
      <h1 className="text-3xl font-bold text-foreground mb-8">Overview</h1>
      <div className="flex flex-wrap gap-4 mb-8">
        <span className="text-foreground/50 font-semibold self-center">All projects</span>
        {isLoading && <span className="text-foreground/50">Loading...</span>}
        {error && <span className="text-red-500">Failed to load brands</span>}
        {brands && brands.length > 0 && brands.map((brand: any) => (
          <button
            key={brand.id}
            className={`rounded-xl px-6 py-2 border border-border text-foreground/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              brand.id && brand.id === brandId ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/40" : "hover:bg-foreground/10 hover:border-border/80"
            }`}
            onClick={() => {
              if (brand.id && brand.id !== 'undefined') {
                router.push(`/brand/${brand.id}/overview`);
              }
            }}
            disabled={!brand.id || brand.id === 'undefined'}
            aria-disabled={!brand.id || brand.id === 'undefined'}
          >
            {brand.brand_settings?.displayName || brand.brand_settings?.name || brand.description || "Untitled"}
          </button>
        ))}
        {brands && brands.length === 0 && <span className="text-foreground/50">No brands found</span>}
      </div>

      <div>
        <TemplateSelector/>
      </div>

      {/* Add more overview content here */}
    </div>
  );
}
