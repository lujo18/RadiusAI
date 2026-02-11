import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useCreateAutomation,
  useUpdateAutomation,
} from "@/features/automation/hooks";
import type { Database } from "@/types/database";
import { AutomationWizardStep1 } from "./steps/AutomationWizardStep1";
import { AutomationWizardStep2 } from "./steps/AutomationWizardStep2";
import { AutomationWizardStep3CTA } from "./steps/AutomationWizardStep3CTA";
import { AutomationWizardStep3 } from "./steps/AutomationWizardStep3";
import { AutomationWizardStep4 } from "./steps/AutomationWizardStep4";
import { AutomationWizardStep5 } from "./steps/AutomationWizardStep5";
import { compareToWeekday, getNextRunTimestamp, getTimeUntil } from "@/lib/time";

type AutomationInsert = Database["public"]["Tables"]["automations"]["Insert"];

export interface AutomationWizardData {
  // Step 1: Visual Info
  name: string;
  description: string;

  // Step 2: Templates
  templateIds: string[];

  // Step 3: CTAs
  ctaIds: string[];

  // Step 4: Accounts (Platforms)
  platforms: Array<"instagram" | "tiktok" | "facebook" | "linkedin">;

  // Step 5: Schedule - per-weekday times
  schedule: {
    [key: string]: string[]; // { "Monday": ["09:00", "14:00"], "Tuesday": ["09:00"], ... }
  };
  nextRunAt: string;
  brandId: string;
}

interface AutomationWizardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  onSuccess?: () => void;
  initialData?: AutomationWizardData & { id?: string };
}

const STEPS = [
  "Visual Info",
  "Templates",
  "CTAs",
  "Accounts",
  "Schedule",
  "Confirm",
];
const TOTAL_STEPS = STEPS.length;

export function AutomationWizard({
  isOpen,
  onOpenChange,
  brandId,
  onSuccess,
  initialData,
}: AutomationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const isEditMode = !!initialData?.id;

  const [wizardData, setWizardData] = useState<AutomationWizardData>(
    initialData
      ? {
          name: initialData.name,
          description: initialData.description,
          brandId: initialData.brandId || brandId,
          templateIds: initialData.templateIds,
          ctaIds: initialData.ctaIds,
          platforms: initialData.platforms,
          schedule: initialData.schedule,
          nextRunAt: initialData.nextRunAt,
        }
      : {
          name: "",
          description: "",
          brandId: brandId,
          templateIds: [],
          ctaIds: [],
          platforms: [],
          schedule: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          },
          nextRunAt: new Date().toISOString(),
        },
  );

  const { mutate: createAutomation, isPending: isCreatePending } =
    useCreateAutomation();
  const { mutate: updateAutomation, isPending: isUpdatePending } =
    useUpdateAutomation();

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getNextRunTime = () => {
    for (const day of Object.keys(wizardData.schedule)) {
      const times = wizardData.schedule[day as keyof typeof wizardData.schedule] || [];
      if (times.length > 0 && compareToWeekday(day) != "after") {
        for (const time of times) {
          if (!getTimeUntil(time).isPast) {
            return getNextRunTimestamp(day, time);
          }
        }
      }
    }
  };

  const handleSubmit = () => {
    const nextRunAt = getNextRunTime();

    const payload = {
      name: wizardData.name,
      description: wizardData.description,
      template_ids: wizardData.templateIds,
      cta_ids: wizardData.ctaIds,
      platforms: wizardData.platforms,
      schedule: wizardData.schedule,
      next_run_at: nextRunAt?.toISOString() || new Date().toISOString(),
    } as any;

    if (isEditMode && initialData?.id) {
      // Update existing automation
      updateAutomation(
        {
          id: initialData.id,
          updates: payload,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            setCurrentStep(0);
            if (onSuccess) onSuccess();
          },
        },
      );
    } else {
      // Create new automation
      createAutomation(
        {
          brandId,
          payload: {
            ...payload,
            cursor_template_index: 0,
            cursor_cta_index: 0,
            is_active: true,
            error_count: 0,
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            setCurrentStep(0);
            if (onSuccess) onSuccess();
          },
        },
      );
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 0: // Visual Info
        return wizardData.name.trim().length > 0;
      case 1: // Templates
        return wizardData.templateIds.length > 0;
      case 2: // CTAs
        return true;
      case 3: // Platforms
        return wizardData.platforms.length > 0;
      case 4: // Schedule
        // Check if at least one day has at least one time
        const hasSchedule = Object.values(wizardData.schedule).some(
          (times) => Array.isArray(times) && times.length > 0,
        );
        return hasSchedule;
      case 5: // Confirm
        return true;
      default:
        return false;
    }
  };

  const canNext = isStepValid();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="lg:max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Automation" : "Create New Automation"}
          </DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {TOTAL_STEPS}: {STEPS[currentStep]}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-foreground/60">
            {STEPS.map((step, idx) => (
              <span
                key={step}
                className={
                  idx === currentStep ? "font-semibold text-foreground" : ""
                }
              >
                {step}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] py-6">
          {currentStep === 0 && (
            <AutomationWizardStep1 data={wizardData} onChange={setWizardData} />
          )}
          {currentStep === 1 && (
            <AutomationWizardStep2
              data={wizardData}
              onChange={setWizardData}
              brandId={brandId}
            />
          )}
          {currentStep === 2 && (
            <AutomationWizardStep3CTA
              data={wizardData}
              onChange={setWizardData}
              brandId={brandId}
            />
          )}
          {currentStep === 3 && (
            <AutomationWizardStep3 data={wizardData} onChange={setWizardData} />
          )}
          {currentStep === 4 && (
            <AutomationWizardStep4 data={wizardData} onChange={setWizardData} />
          )}
          {currentStep === 5 && <AutomationWizardStep5 data={wizardData} />}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>

            {currentStep === TOTAL_STEPS - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isCreatePending || isUpdatePending}
                className="bg-primary"
              >
                {isCreatePending || isUpdatePending
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Automation"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canNext}
                className="bg-primary"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
