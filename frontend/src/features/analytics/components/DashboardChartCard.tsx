import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { cn } from "@/lib/utils"
import { format, isDate } from "date-fns"
import { useAnalytics } from "../hooks"
import type { AnalyticOptions, AnalyticTimeframes, AnalyticSections } from "../types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export type CardProps = {
  title: string
  cKey: AnalyticOptions
  type: "currency" | "unit"
  timeframe: AnalyticTimeframes
  section: AnalyticSections
  isThumbnail?: boolean
  brandId?: string | null
  postId?: string | null
}

const formatters = {
  unit: (value: number) => value?.toLocaleString() ?? "0",
  currency: (value: number) => `$${value?.toLocaleString() ?? "0"}`,
}

const formattingMap = {
  currency: formatters.currency,
  unit: formatters.unit,
}

export function ChartCard({
  title,
  cKey,
  type,
  timeframe,
  section,
  isThumbnail,
  brandId,
  postId,
}: CardProps) {
  const { data: analyticsHistory } = useAnalytics(
    timeframe,
    section,
    brandId,
    postId
  )

  const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

  const data = analyticsHistory?.map((record) => {return{[cKey]: record[cKey], date: record.collected_at}});

  if (!data) return

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Showing total {title.toLowerCase()} for the last {timeframe}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value ? timeframe == "24h" ? format(new Date(value), "hh:mm a") : format(new Date(value), "MMM dd ''yy") : value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
              labelFormatter={(label) => label ? timeframe == "24h" ? format(new Date(label), "hh:mm a") : format(new Date(label), "MMM dd ''yy") : label}
            />
            <Area
              dataKey={cKey}
              type="bumpX"
              fill="var(--color-desktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      {/* <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              January - June 2024
            </div>
          </div>
        </div>
      </CardFooter> */}
    </Card>
  )
}
