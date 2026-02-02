import { useBrands } from "@/lib/api/hooks/useBrands";
import Stats10 from "../stats-10";
import { BrandSelector } from "../selectors/BrandSelector";
import { Brand } from "../TemplateCreator/contentTypes";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

type OverviewPageType = {
  brandId: string | null;
};

export const OverviewPageComponent = ({ brandId }: OverviewPageType) => {
  const { data: brands, isLoading, error } = useBrands();
  

  return (
    <div className="flex flex-col p-6 gap-4">
      <h1>Overview</h1>
      <BrandSelector activeBrandId={brandId} brands={brands as Brand[]} />

      {brands?.length == 0 && (
        <Card className="p-4">
          <Badge variant={"destructive"}>
            Looks like you don't have a brand yet!
          </Badge>
          <h2>Create your first brand to get started!</h2>
          <Button onClick={() => {}}>Create brand<Plus/></Button>
        </Card>
      )}
      <Stats10 />
    </div>
  );
};
