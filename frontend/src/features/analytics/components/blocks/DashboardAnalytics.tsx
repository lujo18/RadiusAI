import { ChartCard } from "../DashboardChartCard"
import { Filterbar } from "../DashboardFilterbar"
import React from "react"
import { analyticChartCategories, type AnalyticTimeframes, type AnalyticSections } from "../../types"
import { cn } from "@/lib/utils"
import { useAnalytics } from "../../hooks"

export const DashboardAnalytics = ({brandId, postId} : {brandId?: string | null, postId?: string | null}) => {
  const [selectedTimeframe, setSelectedTimeframe] = React.useState<AnalyticTimeframes>("7d")
  const [selectedSection, setSelectedSection] = React.useState<AnalyticSections>("recent")

  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    analyticChartCategories.map((category) => category.key),
  )

  const {data, isLoading, error} = useAnalytics(selectedTimeframe, selectedSection, brandId);

  console.log("DATA", data)
  return (
      <section aria-labelledby="usage-overview">

        <div className="sticky top-0 z-20 flex items-center justify-betwee pb-4 pt-4 sm:pt-6 lg:top-0 lg:mx-0 lg:px-0 lg:pt-8 bg-background">
          <Filterbar
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            selectedSection={selectedSection}
            onSectionChange={setSelectedSection}
            categories={analyticChartCategories}
            setSelectedCategories={setSelectedCategories}
            selectedCategories={selectedCategories}
            brandId={brandId!}
          />
        </div>

        {/* <div>
          <p>{ JSON.stringify(data) || "NO DATA"}</p>
        </div> */}
        <dl
          className={cn(
            "mt-5 grid grid-cols-1 gap-14 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
          )}
        >
          {analyticChartCategories
            .filter((category) => selectedCategories.includes(category.key))
            .map((category) => {
              return (
                <ChartCard
                  key={category.key}
                  title={category.title}
                  cKey={category.key}
                  type={category.type}
                  timeframe={selectedTimeframe}
                  section={selectedSection}
                  postId={postId}
                  brandId={brandId}
                />
              )
            })}
        </dl>
      </section>
  )
}