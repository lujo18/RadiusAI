"use client";

import { useRouter, useParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database } from "@/types/database";
import { Button } from "../ui/button";

type Brand = Database["public"]["Tables"]["brand"]["Row"];

interface BrandSelectorProps {
  brands: Brand[];
  activeBrandId: string | null;
}

export function BrandSelector({ brands, activeBrandId }: BrandSelectorProps) {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const handleBrandChange = (value: string) => {
    if (value === "all") {
      router.push(`/${teamId}/overview`);
    } else {
      router.push(`/${teamId}/brand/${value}/overview`);
    }
  };

  return (
    <div 
      className="flex gap-2 w-full"
    >
      <Button
        variant={activeBrandId === null ? "default" : "outline"}
        size="sm"
        onClick={() => handleBrandChange("all")}
        className="flex items-center gap-2"
      >
        All Brands
      </Button>

      {brands?.map((brand) => {
        const settings = typeof brand.brand_settings === 'string' 
          ? JSON.parse(brand.brand_settings) 
          : brand.brand_settings;
        const brandName = settings?.name || brand.id;
        
        return (
          <Button
            key={brand.id}
            variant={activeBrandId === brand.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleBrandChange(brand.id)}
            className="flex items-center gap-2"
          >
            {brandName}
          </Button>
        );
      })}
    </div>
  );
}
