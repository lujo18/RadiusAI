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
} from "recharts";
import { cn } from "@/lib/utils";
import { format, isDate } from "date-fns";
import { useMemo } from "react";
import { useAnalytics } from "../hooks";
import type {
  AnalyticOptions,
  AnalyticTimeframes,
  AnalyticSections,
} from "../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const getPrimaryColor = (): string => {
  if (typeof window === "undefined") return "#3b82f6";
  try {
    // Create temp element and apply primary color
    const el = document.createElement("span");
    el.className = "bg-primary";
    el.style.display = "none";
    document.body.appendChild(el);

    const rgb = getComputedStyle(el).backgroundColor;
    document.body.removeChild(el);

    console.log("RGB from computed style:", rgb);
    return rgb || "#3b82f6";
  } catch (error) {
    console.error("Error getting primary color:", error);
    return "#3b82f6";
  }
};

export type CardProps = {
  title: string;
  cKey: AnalyticOptions;
  type: "currency" | "unit";
  timeframe: AnalyticTimeframes;
  section: AnalyticSections;
  isThumbnail?: boolean;
  brandId?: string | null;
  postId?: string | null;
};

const formatters = {
  unit: (value: number) => value?.toLocaleString() ?? "0",
  currency: (value: number) => `$${value?.toLocaleString() ?? "0"}`,
};

const formattingMap = {
  currency: formatters.currency,
  unit: formatters.unit,
};

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
    postId,
  );

  const primaryColor = useMemo(() => getPrimaryColor(), []);

  const chartConfig: ChartConfig = {
    desktop: {
      label: "Desktop",
      color: "var(--chart-1)",
    },
  };

  const data = analyticsHistory?.map((record) => ({
    [cKey]: record[cKey],
    date: record.collected_at,
  }));

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Showing total {title.toLowerCase()} for the last {timeframe}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            There is no data for {title.toLowerCase()}
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <defs>
                <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity={1} />
                  <stop
                    offset="50%"
                    stopColor={primaryColor}
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="100%"
                    stopColor={primaryColor}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) =>
                  value
                    ? timeframe == "24h"
                      ? format(new Date(value), "hh:mm a")
                      : format(new Date(value), "MMM dd ''yy")
                    : value
                }
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
                labelFormatter={(label) =>
                  label
                    ? timeframe == "24h"
                      ? format(new Date(label), "hh:mm a")
                      : format(new Date(label), "MMM dd ''yy")
                    : label
                }
              />
              <Area
                dataKey={cKey}
                type="monotone"
                fill="url(#fillGradient)"
                fillOpacity={0.4}
                stroke="var(--color-desktop)"
                dot={{
                  r: 3, // radius
                  strokeWidth: 2,
                  stroke: "var(--primary)",
                }}
                activeDot={{
                  r: 5,
                  fill: "var(--primary)",
                }}
              />
            </AreaChart>
          </ChartContainer>
        )}
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
  );
}
