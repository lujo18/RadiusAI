"use client";

import type { FC, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Check, LucideClockFading } from "lucide-react";

export type EventStatus = "idle" | "loading" | "completed";
export type EventVariant = "display" | "action";
export type EventColor = "primary" | "secondary" | "accent" | "destructive" | "muted" | "chart2" | "selected";


const eventColorStyles: Record<
  EventColor,
  { solid: string; dotted: string; indicator: string }
> = {
  primary: {
    solid: "bg-primary/50",
    dotted: "border-primary/50 bg-primary/10",
    indicator: "bg-primary",
  },
  secondary: {
    solid: "bg-secondary/50",
    dotted: "border-secondary/80 bg-secondary/20",
    indicator: "bg-secondary-foreground",
  },
  muted: {
    solid: "bg-muted/60",
    dotted: "border-muted-foreground/40 bg-muted/20",
    indicator: "bg-muted-foreground",
  },
  accent: {
    solid: "bg-accent/20",
    dotted: "border-accent/80 bg-accent/10",
    indicator: "bg-accent",
  },
  destructive: {
    solid: "bg-destructive/20",
    dotted: "border-destructive/80 bg-destructive/10",
    indicator: "bg-destructive",
  },
  chart2: {
    solid: "bg-chart-2/50",
    dotted: "border-chart-2/50 bg-chart-2/30",
    indicator: "bg-chart-2",
  },
  selected: {
    solid: "bg-foreground/40",
    dotted: "border-foreground/40",
    indicator: "bg-foreground",
  }
};

export interface CalendarEventCardProps {
  eventColor: EventColor;
  status?: EventStatus;
  label?: string;
  children: ReactNode;
  variant?: EventVariant;
  buttonColor?: "primary" | "danger";
  completedLabel?: string;
  onAction?: () => void;
  isDotted?: boolean;
  opacity?: number;
  className?: string;
}

export const CalendarEventCard: FC<CalendarEventCardProps> = ({
  eventColor,
  status = "idle",
  label,
  children,
  variant = "display",
  buttonColor = "primary",
  completedLabel = "Completed",
  onAction,
  isDotted = false,
  opacity = 1,
  className,
}) => {
  const hasAction = variant === "action" && onAction;
  const finalOpacity = status === "completed" ? 0.5 : opacity;
  const color = eventColorStyles[eventColor];

  const buttonColorClasses = {
    primary: "bg-sky-500 hover:bg-sky-600 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  };

  console.log("c", color)

  return (
    <div
      className={cn(
        "relative flex gap-2 rounded-lg p-3 pr-2 pl-5 transition-colors",
        hasAction ? "items-end" : "items-start",
        isDotted && "border-2 border-dashed",
        isDotted ? color.dotted : color.solid,
        className,
      )}
      style={{
        opacity: finalOpacity,
      }}
    >
      {/* Color indicator bar */}
      <div className="absolute top-0 left-1 flex h-full items-center">
        <div
          className={cn("h-[80%] w-1 flex-shrink-0 rounded-full", color.solid)}
        
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {label && (
          <div
            className={cn(
              "mb-1 text-xs font-medium",
              isDotted
                ? "text-blue-600 dark:text-blue-400"
                : "text-zinc-600 dark:text-zinc-500",
            )}
          >
            {label}
          </div>
        )}
        {children}
      </div>

      {/* Action button */}
      {hasAction && (
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            buttonColorClasses[buttonColor],
          )}
          disabled={status === "completed"}
          onClick={onAction}
        >
          {status === "loading" ? (
            <>
              <LucideClockFading size={16} className="animate-spin" />
              Confirm
            </>
          ) : status === "completed" ? (
            <>
              <Check size={16} />
              {completedLabel}
            </>
          ) : (
            "Confirm"
          )}
        </button>
      )}
    </div>
  );
};

// Event content components for convenience
export interface EventTitleProps {
  children: ReactNode;
  className?: string;
}

export const EventTitle: FC<EventTitleProps> = ({ children, className }) => (
  <h3
    className={cn(
      "font-medium text-zinc-900 dark:text-zinc-100 text-sm",
      className,
    )}
  >
    {children}
  </h3>
);

export interface EventTimeProps {
  startTime: string;
  endTime?: string;
  className?: string;
}

export const EventTime: FC<EventTimeProps> = ({
  startTime,
  endTime,
  className,
}) => (
  <p className={cn("text-sm text-zinc-600 dark:text-zinc-400", className)}>
    {startTime}
    {endTime && ` - ${endTime}`}
  </p>
);

export interface EventLocationProps {
  children: ReactNode;
  className?: string;
}

export const EventLocation: FC<EventLocationProps> = ({
  children,
  className,
}) => (
  <p className={cn("text-xs text-zinc-500 dark:text-zinc-500", className)}>
    {children}
  </p>
);
