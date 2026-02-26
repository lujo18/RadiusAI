'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useOnboardingChecklist } from '../hooks';
import type { OnboardingStepKey } from '../types';

export function OnboardingChecklist() {
  const { steps, completedCount, totalCount, allComplete, isLoading, dismiss, isDismissed } =
    useOnboardingChecklist();

  const [hidden, setHidden] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // Key of the accordion row that is open; auto-opens first incomplete step
  const [openKey, setOpenKey] = useState<OnboardingStepKey | null>(null);

  // Resolve dismiss + auto-open on client only
  useEffect(() => {
    if (isDismissed()) {
      setHidden(true);
      return;
    }
    const first = steps.find((s) => !s.completed);
    if (first) setOpenKey(first.key);
  }, [steps.map((s) => s.completed).join(',')]);

  const handleDismiss = () => {
    dismiss();
    setHidden(true);
  };

  const toggleRow = (key: OnboardingStepKey) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  if (hidden || isLoading) return null;

  const progressPct = Math.round((completedCount / totalCount) * 100);
  const nextStep = steps.find((s) => !s.completed);

  return (
    /* Fixed floating panel — bottom-right corner */
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 w-[320px] rounded-xl border border-border bg-card shadow-xl',
        'transition-all duration-200',
      )}
      role="complementary"
      aria-label="Setup guide"
    >
      {/* ── HEADER (always visible) ─────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <span className="font-semibold text-sm text-foreground">Setup guide</span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label={expanded ? 'Minimise' : 'Expand'}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label="Close setup guide"
            onClick={handleDismiss}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── PROGRESS BAR (always visible) ───────────────────── */}
      <div className="px-4 pb-2">
        <Progress value={progressPct} className="h-1" />
      </div>

      {/* ── COLLAPSED SUMMARY ───────────────────────────────── */}
      {!expanded && (
        <button
          className="w-full text-left px-4 pb-3 flex items-center gap-1.5 group"
          onClick={() => setExpanded(true)}
          aria-label="Expand setup guide"
        >
          {nextStep ? (
            <span className="text-xs text-muted-foreground">
              Next:{' '}
              <span className="text-primary group-hover:underline font-medium">
                {nextStep.title}
              </span>
            </span>
          ) : (
            <span className="text-xs text-primary font-medium">All steps complete 🎉</span>
          )}
        </button>
      )}

      {/* ── EXPANDED ACCORDION ──────────────────────────────── */}
      {expanded && (
        <ol className="px-2 pb-3 flex flex-col">
          {steps.map((step) => {
            const isOpen = openKey === step.key;

            return (
              <li key={step.key} className="border-b border-border/50 last:border-0">
                {/* Row header — always shown */}
                <button
                  className={cn(
                    'w-full flex items-center gap-3 px-2 py-3 text-left transition-colors rounded-lg',
                    'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                  onClick={() => toggleRow(step.key)}
                  aria-expanded={isOpen}
                >
                  <span className="shrink-0 mt-px">
                    {step.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>

                  <span
                    className={cn(
                      'flex-1 text-sm font-medium leading-tight',
                      step.completed
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground',
                    )}
                  >
                    {step.title}
                    {step.optional && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        (optional)
                      </span>
                    )}
                  </span>

                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Row body — shown when expanded */}
                {isOpen && (
                  <div className="px-9 pb-3 flex flex-col gap-2.5">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                    {!step.completed && (
                      <Button asChild variant="default" size="sm" className="w-fit h-7 text-xs px-3">
                        <Link href={step.href}>{step.ctaLabel}</Link>
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

