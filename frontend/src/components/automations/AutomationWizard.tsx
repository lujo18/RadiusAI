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
import { AutomationWizardStep5TikTokDisclosure } from "./steps/AutomationWizardStep5TikTokDisclosure";
import { AutomationWizardStep6 } from "./steps/AutomationWizardStep6";
import {
  compareToWeekday,
  getNextRunTimestamp,
  getTimeUntil,
} from "@/lib/time";
import type { TikTokDisclosureSettings } from "@/components/modals/TikTokDisclosureOptions";

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

  // Posting behaviour
  postAutomatically: boolean;
  postAsDraft: boolean;

  // Step 5: TikTok Disclosure Options
  tiktokDisclosure: TikTokDisclosureSettings;

  // Step 6: Schedule - per-weekday times
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
  "TikTok Options",
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
          postAutomatically: initialData.postAutomatically ?? false,
          postAsDraft: initialData.postAsDraft ?? false,
          tiktokDisclosure: initialData.tiktokDisclosure || {
            is_ai_generated: false,
            brand_content_toggle: false,
            brand_organic_toggle: false,
            disable_duet: false,
            disable_stitch: false,
            disable_comment: false,
            privacy_level: "PUBLIC",
          },
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
          postAutomatically: false,
          postAsDraft: false,
          tiktokDisclosure: {
            is_ai_generated: false,
            brand_content_toggle: false,
            brand_organic_toggle: false,
            disable_duet: false,
            disable_stitch: false,
            disable_comment: false,
            privacy_level: "PUBLIC",
          },
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
    console.log("enter");
    const weekdays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    for (const weekday of weekdays) {
      if (Object.keys(wizardData.schedule).includes(weekday)) {
        console.log("day1", weekday);
        const times =
          wizardData.schedule[weekday as keyof typeof wizardData.schedule] || [];
        console.log("day2", weekday);
        if (times.length > 0 && compareToWeekday(weekday) != "after") {
          for (const time of times) {
            if (!getTimeUntil(time).isPast) {
              console.log("date", weekday, "time", time);
              return getNextRunTimestamp(weekday, time);
            }
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
      post_automatically: wizardData.postAutomatically,
      post_as_draft: wizardData.postAsDraft,
      schedule: wizardData.schedule,
      next_run_at: nextRunAt?.toISOString() || new Date().toISOString(),
      // TikTok disclosure settings
      is_ai_generated: wizardData.tiktokDisclosure.is_ai_generated,
      brand_content_toggle: wizardData.tiktokDisclosure.brand_content_toggle,
      brand_organic_toggle: wizardData.tiktokDisclosure.brand_organic_toggle,
      disable_duet: wizardData.tiktokDisclosure.disable_duet,
      disable_stitch: wizardData.tiktokDisclosure.disable_stitch,
      disable_comment: wizardData.tiktokDisclosure.disable_comment,
      privacy_level: wizardData.tiktokDisclosure.privacy_level,
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
      case 4: // TikTok Disclosure
        return true;
      case 5: // Schedule
        // Check if at least one day has at least one time
        const hasSchedule = Object.values(wizardData.schedule).some(
          (times) => Array.isArray(times) && times.length > 0,
        );
        return hasSchedule;
      case 6: // Confirm
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
          {currentStep === 5 && (
            <AutomationWizardStep5TikTokDisclosure data={wizardData} onChange={setWizardData} />
          )}
          {currentStep === 6 && <AutomationWizardStep6 data={wizardData} onChange={setWizardData} />}
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
