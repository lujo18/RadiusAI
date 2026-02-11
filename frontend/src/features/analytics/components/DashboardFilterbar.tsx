"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Label } from "@/components/ui/label"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Settings } from "lucide-react"
import React from "react"
import { ChartCard } from "./DashboardChartCard"
import { cn } from "@/lib/utils"
import type { AnalyticTimeframes, AnalyticSections } from "../types"

const TIMEFRAME_OPTIONS: { value: AnalyticTimeframes; label: string }[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "180d", label: "Last 6 months" },
  { value: "365d", label: "Last year" },
  { value: "all", label: "All time" },
]

const SECTION_OPTIONS: { value: AnalyticSections; label: string }[] = [
  { value: "first", label: "First" },
  { value: "recent", label: "Recent" },
]

// Keep for reference if manual date ranges are re-enabled
/*
export type PeriodValue = "previous-period" | "last-year" | "no-comparison"

type Period = {
  value: PeriodValue
  label: string
}

const periods: Period[] = [
  {
    value: "previous-period",
    label: "Previous period",
  },
  {
    value: "last-year",
    label: "Last year",
  },
  {
    value: "no-comparison",
    label: "No comparison",
  },
]

export const getPeriod = (
  dateRange: DateRange | undefined,
  value: PeriodValue,
): DateRange | undefined => {
  if (!dateRange) return undefined
  const from = dateRange.from
  const to = dateRange.to
  switch (value) {
    case "previous-period":
      let previousPeriodFrom
      let previousPeriodTo
      if (from && to) {
        const datesInterval = interval(from, to)
        const numberOfDaysBetween = eachDayOfInterval(datesInterval).length
        previousPeriodTo = subDays(from, 1)
        previousPeriodFrom = subDays(previousPeriodTo, numberOfDaysBetween)
      }
      return { from: previousPeriodFrom, to: previousPeriodTo }
    case "last-year":
      let lastYearFrom
      let lastYearTo
      if (from) {
        lastYearFrom = subYears(from, 1)
      }
      if (to) {
        lastYearTo = subYears(to, 1)
      }
      return { from: lastYearFrom, to: lastYearTo }
    case "no-comparison":
      return undefined
  }
}
*/

type FilterbarProps = {
  selectedTimeframe: AnalyticTimeframes
  onTimeframeChange: (timeframe: AnalyticTimeframes) => void
  selectedSection: AnalyticSections
  onSectionChange: (section: AnalyticSections) => void
  categories: any[]
  setSelectedCategories: any
  selectedCategories: any
  brandId: string
}



export function Filterbar({
  selectedTimeframe,
  onTimeframeChange,
  selectedSection,
  onSectionChange,
  categories,
  setSelectedCategories,
  selectedCategories,
  brandId,
}: FilterbarProps) {
  const [tempSelectedCategories, setTempSelectedCategories] =
    React.useState(selectedCategories)

  const handleCategoryChange = (category: string) => {
    setTempSelectedCategories((prev: any) =>
      prev.includes(category)
        ? prev.filter((item: any) => item !== category)
        : [...prev, category],
    )
  }

  const handleApply = () => {
    setSelectedCategories(tempSelectedCategories)
  }

  return (
    <div className="flex w-full justify-between flex-col gap-4 sm:flex-row sm:items-center">
      {/* Timeframe Selector */}
      <div className="flex gap-3">
        <div className="flex flex-col gap-2">
          <Label className="muted">Time Period</Label>
          <Select value={selectedTimeframe} onValueChange={onTimeframeChange}>
            <SelectTrigger className="w-full sm:w-fit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Section Selector */}
        <div className="flex flex-col gap-2">
          <Label className="muted">Section</Label>
          <Select value={selectedSection} onValueChange={onSectionChange}>
            <SelectTrigger className="w-full sm:w-fit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SECTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Manual Date Range (commented out for future use) */}
      {/* <div className="flex w-full sm:flex sm:items-center sm:gap-2">
        <Button
          variant="outline"
          className="w-full sm:w-fit"
          onClick={() => {
            // Simple date picker toggle - can be enhanced with a popover
            onDatesChange({
              from: subDays(new Date(), 7),
              to: new Date(),
            })
          }}
        >
          {selectedDates?.from ? format(selectedDates.from, "MMM dd") : "Start date"}
          {" - "}
          {selectedDates?.to ? format(selectedDates.to, "MMM dd") : "End date"}
        </Button>
        <span className="hidden text-sm font-medium text-gray-500 sm:inline">
          compared to
        </span>
        <Select
          value={selectedPeriod}
          onValueChange={(value) => {
            onPeriodChange(value as PeriodValue)
          }}
        >
          <SelectTrigger className="mt-2 w-full sm:mt-0 sm:w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div> */}

      {/* Chart Customization Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="secondary"
            className="hidden gap-2 px-2 py-1 sm:flex"
          >
            <Settings
              className="-ml-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>Edit</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="lg:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Customise overview charts</DialogTitle>
            <DialogDescription className="sr-only">
              Add or remove the charts for the overview panel.
            </DialogDescription>
          </DialogHeader>
          <div
            className={cn(
              "mt-8 grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-scroll sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
            )}
          >
            {categories.map((category) => {
              return (
                <Label
                  htmlFor={category.title}
                  key={category.title}
                  className="relative cursor-pointer rounded-md border border-gray-200 p-4 shadow-sm dark:border-gray-800"
                >
                  <Checkbox
                    id={category.title}
                    className="absolute right-8 top-8"
                    checked={tempSelectedCategories.includes(category.title)}
                    onCheckedChange={() => handleCategoryChange(category.title)}
                  />
                  <div className="pointer-events-none">
                    <ChartCard
                      title={category.title}
                      cKey={category.key}
                      type={category.type}
                      timeframe={selectedTimeframe}
                      section={selectedSection}
                      isThumbnail={true}
                      brandId={brandId}
                      
                    />
                  </div>
                </Label>
              )
            })}
          </div>
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button
                className="mt-2 w-full sm:mt-0 sm:w-fit"
                variant="secondary"
              >
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button className="w-full sm:w-fit" onClick={handleApply}>
                Apply
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
