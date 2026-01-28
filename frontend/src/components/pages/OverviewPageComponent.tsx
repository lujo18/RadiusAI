import { useBrands } from "@/lib/api/hooks/useBrands";
import Stats10 from "../stats-10";
import { BrandSelector } from "../selectors/BrandSelector";
import { Brand } from "../TemplateCreator/contentTypes";

type OverviewPageType = {
  brandId: string | null
}

export const OverviewPageComponent = ({brandId}: OverviewPageType) => {
  const { data: brands, isLoading, error } = useBrands();

  return (
    <div className="flex flex-col p-6 gap-4">
      <h1>Overview</h1>
      <BrandSelector activeBrandId={brandId} brands={brands as Brand[]}/>

      <Stats10/>
    </div>
  )
};
