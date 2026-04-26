import { useId, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Eye } from "lucide-react";

import { cn } from "@/lib/utils";
import formatCompactNumber from "@/lib/number";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { useAnalytics } from "../hooks";
import type {
  AnalyticOptions,
  AnalyticSections,
  AnalyticTimeframes,
} from "../types";
import { Badge } from "@/components/ui/badge";

type MiniChartProps = {
  title: string;
  cKey: AnalyticOptions;
  type: "currency" | "unit";
  timeframe: AnalyticTimeframes;
  section: AnalyticSections;
  className?: string;
  brandId?: string | null;
  postId?: string | null;
};

const formatters = {
  unit: (value: number) => formatCompactNumber(value),
  currency: (value: number) => `$${value.toLocaleString()}`,
};

const formatXAxisLabel = (
  value: string | number | Date,
  timeframe: AnalyticTimeframes,
): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  if (timeframe === "24h") {
    return format(date, "hh:mm a");
  }

  if (timeframe === "7d") {
    return format(date, "EEE");
  }

  return format(date, "MMM");
};

export function MiniChart({
  title,
  cKey,
  type,
  timeframe,
  section,
  className,
  brandId,
  postId,
}: MiniChartProps) {
  const { data: analyticsHistory } = useAnalytics(
    timeframe,
    section,
    brandId,
    postId,
  );
  const gradientId = useId().replace(/:/g, "");

  const data = useMemo(() => {
    return (analyticsHistory ?? [])
      .map((record) => ({
        date: record.collected_at,
        value: Number(record[cKey] ?? 0),
      }))
      .filter((record) => Boolean(record.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [analyticsHistory, cKey]);

  const latestValue = data[data.length - 1]?.value ?? 0;

  const totalValue = data.reduce<number>((sum, point) => sum + point.value, 0);

  const previousValue = data[0]?.value ?? 0;
  const rawChange = latestValue - previousValue;
  const percentChange =
    previousValue > 0
      ? (rawChange / previousValue) * 100
      : latestValue > 0
        ? 100
        : 0;
  const isPositiveTrend = rawChange >= 0;

  const chartConfig: ChartConfig = {
    metric: {
      label: title,
      color: "var(--primary)",
    },
  };

  return (
    
      <div className="pt-2">
        {data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            No data available for {title.toLowerCase()}.
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-gradient-to-b from-muted/10 to-background px-2 pt-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border/60 bg-muted/40 text-muted-foreground">
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-lg leading-tight text-foreground/90">
                      {title}
                    </h1>
                    <h2 className="font-sans border-0 text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                      {formatters[type](totalValue)}
                    </h2>
                  </div>
                </div>
                <Badge
                  variant={
                    isPositiveTrend
                      ? "default"
                      : "outline"
                  }
                  
                  aria-label={`Trend ${isPositiveTrend ? "up" : "down"} ${Math.abs(percentChange).toFixed(1)} percent`}
                >
                  {isPositiveTrend ? (
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                  )}
                  {Math.abs(percentChange).toFixed(1) || 0.0}%
                </Badge>
              </div>
            <ChartContainer
              config={chartConfig}
              className="w-full"
            >
              
              <AreaChart
                data={data}
                margin={{
                  top: 8,
                  right: 8,
                  left: 4,
                  bottom: 6,
                }}
              >
                <defs>
                  <linearGradient
                    id={`mini-gradient-${gradientId}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-metric)"
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="65%"
                      stopColor="var(--color-metric)"
                      stopOpacity={0.12}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-metric)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="hsl(var(--foreground))"
                  strokeOpacity={0.35}
                  strokeDasharray="4 4"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  tickMargin={10}
                  tickFormatter={(value) => formatters[type](Number(value))}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  minTickGap={20}
                  tickFormatter={(value) => formatXAxisLabel(value, timeframe)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                  labelFormatter={(label) => formatXAxisLabel(label, timeframe)}
                  formatter={(value) => [formatters[type](Number(value)), title]}
                />
                <Area
                  dataKey="value"
                  type="monotone"
                  stroke="var(--color-metric)"
                  strokeWidth={3}
                  fill={`url(#mini-gradient-${gradientId})`}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--primary)",
                  }}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}
      </div>
  
  );
}

export default MiniChart;
