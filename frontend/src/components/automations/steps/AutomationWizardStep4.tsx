import React, { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { convertToLocalTime } from '@/lib/time';
import { X, Plus } from 'lucide-react';
import type { AutomationWizardData } from '../AutomationWizard';

interface Step4Props {
  data: AutomationWizardData;
  onChange: (data: AutomationWizardData) => void;
}

const WEEKDAYS = [
  { id: 'monday', label: 'Monday', short: 'Mon' },
  { id: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { id: 'thursday', label: 'Thursday', short: 'Thu' },
  { id: 'friday', label: 'Friday', short: 'Fri' },
  { id: 'saturday', label: 'Saturday', short: 'Sat' },
  { id: 'sunday', label: 'Sunday', short: 'Sun' },
];

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

const PRESET_SCHEDULES: Record<
  string,
  Record<string, string[]>
> = {
  'Weekday Morning': {
    monday: ['09:00'],
    tuesday: ['09:00'],
    wednesday: ['09:00'],
    thursday: ['09:00'],
    friday: ['09:00'],
    saturday: [],
    sunday: [],
  },
  'Weekday Afternoon': {
    monday: ['14:00'],
    tuesday: ['14:00'],
    wednesday: ['14:00'],
    thursday: ['14:00'],
    friday: ['14:00'],
    saturday: [],
    sunday: [],
  },
  'Daily Once': {
    monday: ['09:00'],
    tuesday: ['09:00'],
    wednesday: ['09:00'],
    thursday: ['09:00'],
    friday: ['09:00'],
    saturday: ['09:00'],
    sunday: ['09:00'],
  },
  'Twice Daily': {
    monday: ['09:00', '18:00'],
    tuesday: ['09:00', '18:00'],
    wednesday: ['09:00', '18:00'],
    thursday: ['09:00', '18:00'],
    friday: ['09:00', '18:00'],
    saturday: ['09:00', '18:00'],
    sunday: ['09:00', '18:00'],
  },
};

export function AutomationWizardStep4({ data, onChange }: Step4Props) {
  const addTimeToDay = (dayId: string, time: string) => {
    const current = data.schedule[dayId as keyof typeof data.schedule] || [];
    if (!current.includes(time)) {
      const updated = [...current, time].sort();
      onChange({
        ...data,
        schedule: {
          ...data.schedule,
          [dayId]: updated,
        },
      });
    }
  };

  const removeTimeFromDay = (dayId: string, time: string) => {
    const current = data.schedule[dayId as keyof typeof data.schedule] || [];
    const updated = current.filter((t) => t !== time);
    onChange({
      ...data,
      schedule: {
        ...data.schedule,
        [dayId]: updated,
      },
    });
  };

  const applyPreset = (presetName: string) => {
    const preset = PRESET_SCHEDULES[presetName];
    if (preset) {
      onChange({
        ...data,
        schedule: preset,
      });
    }
  };

  const postsPerWeek = useMemo(() => {
    let total = 0;
    for (const day of WEEKDAYS) {
      const times = data.schedule[day.id as keyof typeof data.schedule] || [];
      total += times.length;
    }
    return total;
  }, [data.schedule]);

  const hasAnySchedule = postsPerWeek > 0;

  return (
    <div className="space-y-6">
      {/* Preset Schedules */}
      <div className="space-y-3">
        <Label className="font-medium">Quick Presets</Label>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(PRESET_SCHEDULES).map((presetName) => (
            <button
              key={presetName}
              onClick={() => applyPreset(presetName)}
              className="px-3 py-2 text-sm rounded border border-border hover:bg-primary/10 hover:border-primary/50 transition-all text-left font-medium"
            >
              {presetName}
            </button>
          ))}
        </div>
      </div>

      {/* Per-Weekday Schedule */}
      <div className="space-y-3">
        <Label className="font-medium">Custom Schedule by Day</Label>
        <div className="space-y-3">
          {WEEKDAYS.map((day) => {
            const times = data.schedule[day.id as keyof typeof data.schedule] || [];
            return (
              <div
                key={day.id}
                className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{day.label}</h4>
                  <div className="text-xs text-foreground/60">
                    {times.length > 0 ? `${times.length} time${times.length !== 1 ? 's' : ''}` : 'No times'}
                  </div>
                </div>

                {/* Selected times for this day */}
                {times.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {times.map((time) => (
                      <div
                        key={time}
                        className="flex items-center gap-2 px-2 py-1 rounded bg-primary/10 border border-primary/30"
                      >
                        <span className="text-sm font-medium">
                          {convertToLocalTime(time)}
                        </span>
                        <button
                          onClick={() => removeTimeFromDay(day.id, time)}
                          className="p-0.5 hover:bg-primary/20 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Time picker for this day */}
                <div className="grid grid-cols-6 gap-1 max-h-[150px] overflow-y-auto p-2 rounded bg-foreground/5">
                  {TIME_SLOTS.map((time) => {
                    const isSelected = times.includes(time);
                    return (
                      <button
                        key={time}
                        onClick={() => addTimeToDay(day.id, time)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-primary text-background'
                            : 'bg-background border border-border hover:border-primary hover:bg-primary/5'
                        }`}
                      >
                        {convertToLocalTime(time)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {hasAnySchedule && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-3">
          <div className="font-medium text-sm">Schedule Summary</div>
          <div className="space-y-2 text-sm text-foreground/80">
            {WEEKDAYS.filter(
              (day) =>
                (data.schedule[day.id as keyof typeof data.schedule] || []).length > 0
            ).map((day) => {
              const times = data.schedule[day.id as keyof typeof data.schedule] || [];
              return (
                <div key={day.id} className="flex gap-2">
                  <span className="font-semibold w-20">{day.label}:</span>
                  <span>{times.map((t) => convertToLocalTime(t)).join(', ')}</span>
                </div>
              );
            })}
            <div className="pt-2 border-t border-primary/20 font-medium">
              Total posts per week: <span className="text-primary">{postsPerWeek}</span>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-lg bg-foreground/5 border border-border p-4">
        <h4 className="font-medium text-sm mb-2">📅 How it Works</h4>
        <p className="text-sm text-foreground/70">
          Set specific times for each day of the week. Your automation will post at those times,
          cycling through your selected templates. You can have different posting schedules for
          each day to optimize for when your audience is most active.
        </p>
      </div>
    </div>
  );
}
