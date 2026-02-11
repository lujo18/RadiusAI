// Minimal chart utilities for AreaChart
export const AvailableChartColors = [
  "slate",
  "gray",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "fuchsia",
  "pink",
  "rose",
] as const

export type AvailableChartColorsKeys = typeof AvailableChartColors[number]

export function constructCategoryColors(
  categories: string[],
  colors: ReadonlyArray<AvailableChartColorsKeys> = AvailableChartColors,
) {
  const map = new Map<string, AvailableChartColorsKeys>()
  categories.forEach((cat, i) => {
    map.set(cat, colors[i % colors.length])
  })
  return map
}

export function getColorClassName(
  color: AvailableChartColorsKeys | undefined,
  variant: "bg" | "text" | "stroke" | "fill" = "text",
) {
  const key = color ?? "blue"
  switch (variant) {
    case "bg":
      return `bg-${key}-500`
    case "stroke":
      return `stroke-${key}-500`
    case "fill":
      return `fill-${key}-500`
    case "text":
    default:
      return `text-${key}-600`
  }
}

export function getYAxisDomain(
  autoMinValue: boolean | undefined,
  minValue: number | undefined,
  maxValue: number | undefined,
) {
  if (autoMinValue) return ["auto", "auto"] as any
  return [minValue ?? "auto", maxValue ?? "auto"] as any
}

export function hasOnlyOneValueForKey(data: any[], dataKey: string) {
  if (!Array.isArray(data)) return false
  let count = 0
  for (const row of data) {
    const v = row?.[dataKey]
    if (v !== null && v !== undefined && v !== "") count += 1
    if (count > 1) return false
  }
  return count === 1
}

export default {}
