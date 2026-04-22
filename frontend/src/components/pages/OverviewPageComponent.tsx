import { useBrands } from "@/features/brand/hooks";
import Stats10 from "../stats-10";
import { BrandSelector } from "../selectors/BrandSelector";
import { Brand } from "../TemplateCreator/contentTypes";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Plus } from "lucide-react";
import { DashboardAnalytics } from "@/features/analytics/components/blocks/DashboardAnalytics";
import BrandSetupWizard from "../Profiles/BrandSetupWizard";
import { useState } from "react";
import { usePostsWithAnalytics } from "@/features/posts";
import { PostPreview } from "@/features/posts/components/PostPreview";

type OverviewPageType = {
  brandId: string | null;
};

export const OverviewPageComponent = ({ brandId }: OverviewPageType) => {
  const { data: brands, isLoading, error } = useBrands();
  const [showWizard, setShowWizard] = useState(false);
  const safeBrandId = brandId ?? "";

  const { data: posts } = usePostsWithAnalytics(safeBrandId);

  const recentPosts = Array.from(posts ?? []).slice(0, 9);

  if (isLoading) {
    return (
      <div className="flex flex-col p-6 gap-4">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col p-6 gap-4">
        <h1>Overview</h1>
        <BrandSelector activeBrandId={brandId} brands={brands as Brand[]} />

        {brands?.length == 0 && (
          <Card className="p-4 max-w-xl m-auto flex gap-4">
            <h2>Welcome! Let's get started</h2>
            <p>Create your first brand to get started</p>
            <Button onClick={() => {setShowWizard(true)}}>
              Create brand
              <Plus />
            </Button>
          </Card>
        )}
        {/* <Stats10 /> */}

        <div className="flex w-full flex-nowrap gap-3 overflow-x-auto pb-2">
          {recentPosts.map((post) => (
            <div key={post.id} className="w-[160px] shrink-0 sm:w-[250px] md:w-[190px]">
              <PostPreview post={post} />
            </div>
          ))}
        </div>

        <DashboardAnalytics brandId={brandId} />
      </div>

      <BrandSetupWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
      />
    </>
  );
};
