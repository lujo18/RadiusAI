/**
 * Time formatting utilities for converting 24-hour database times
 * to user-friendly local time displays
 */

/**
 * Convert 24-hour time string (HH:mm) to 12-hour format (h:mmAM/PM)
 *
 * @param time24h - Time in 24-hour format, e.g., "14:00", "09:30"
 * @returns Formatted time string, e.g., "2:00PM", "9:30AM"
 *
 * @example
 * formatTo12Hour("14:00") // "2:00PM"
 * formatTo12Hour("09:30") // "9:30AM"
 * formatTo12Hour("00:00") // "12:00AM"
 * formatTo12Hour("12:00") // "12:00PM"
 */
export function formatTo12Hour(time24h: string): string {
  const [hours, minutes] = time24h.split(":").map(Number);

  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight, 13-23 to 1-11

  return `${hours12}:${minutes.toString().padStart(2, "0")}${period}`;
}

/**
 * Convert 24-hour time to user's local time and format for display
 * Handles timezone conversion accounting for daylight saving time
 *
 * @param time24h - Time in 24-hour format, e.g., "14:00"
 * @param referenceDate - Optional date for timezone calculation (defaults to today)
 * @returns Formatted time in user's local timezone, e.g., "2:00PM"
 *
 * @example
 * const localTime = convertToLocalTime("14:00");
 * console.log(localTime); // "2:00PM" (or adjusted for user's timezone)
 */
export function convertToLocalTime(
  time24h: string,
  referenceDate: Date = new Date(),
): string {
  try {
    const [hours, minutes] = time24h.split(":").map(Number);

    // Create a date object with the given time
    const date = new Date(referenceDate);
    date.setHours(hours, minutes, 0, 0);

    // Format using user's local timezone
    const formatted = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return formatted;
  } catch (error) {
    console.error("Error converting time:", error);
    return time24h; // Fallback to original if parsing fails
  }
}

/**
 * Format a time string for display with optional timezone info
 *
 * @param time24h - Time in 24-hour format
 * @param includeTimezone - Whether to include timezone abbreviation
 * @returns Formatted time, e.g., "2:00PM EST" or "2:00PM"
 *
 * @example
 * formatTimeForDisplay("14:00", true) // "2:00PM EST"
 * formatTimeForDisplay("14:00", false) // "2:00PM"
 */
export function formatTimeForDisplay(
  time24h: string,
  includeTimezone: boolean = false,
): string {
  const localTime = convertToLocalTime(time24h);

  if (!includeTimezone) {
    return localTime;
  }

  // Get timezone abbreviation
  const timezone = new Date()
    .toLocaleTimeString("en-US", {
      timeZoneName: "short",
    })
    .split(" ")
    .pop();

  return `${localTime} ${timezone}`;
}

/**
 * Parse a 24-hour time string and return hours and minutes separately
 *
 * @param time24h - Time in 24-hour format, e.g., "14:30"
 * @returns Object with hours and minutes properties
 *
 * @example
 * const { hours, minutes } = parseTime24h("14:30");
 * console.log(hours); // 14
 * console.log(minutes); // 30
 */
export function parseTime24h(time24h: string): {
  hours: number;
  minutes: number;
} {
  const [hours, minutes] = time24h.split(":").map(Number);
  return { hours, minutes };
}

/**
 * Format multiple time slots for display
 * Useful for showing a list of scheduled times
 *
 * @param times - Array of 24-hour time strings
 * @param separator - Character(s) to separate times, default is ", "
 * @returns Comma-separated formatted times
 *
 * @example
 * formatTimeList(["09:00", "14:00", "18:00"]) // "9:00AM, 2:00PM, 6:00PM"
 */
export function formatTimeList(
  times: string[],
  separator: string = ", ",
): string {
  return times.map((t) => convertToLocalTime(t)).join(separator);
}

/**
 * Get time until next occurrence of a specific time
 * Useful for showing "Next run in X minutes"
 *
 * @param time24h - Target time in 24-hour format
 * @returns Object with hours, minutes, and totalMinutes remaining
 *
 * @example
 * const remaining = getTimeUntil("14:00");
 * if (remaining.totalMinutes > 0) {
 *   console.log(`Next run in ${remaining.hours}h ${remaining.minutes}m`);
 * }
 */
export function getTimeUntil(time24h: string): {
  hours: number;
  minutes: number;
  totalMinutes: number;
  isPast: boolean;
} {
  const [targetHours, targetMinutes] = time24h.split(":").map(Number);
  const now = new Date();

  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    targetHours,
    targetMinutes,
    0,
    0,
  );
  // // If time has already passed today, calculate for tomorrow
  // if (target <= now) {
  //   target.setDate(target.getDate() + 1);
  // }

  console.log("Now", now, "Target", target);

  const diffMs = target.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  console.log(target.getTime() - now.getTime(), diffMinutes, hours, minutes);

  return {
    hours,
    minutes,
    totalMinutes: diffMinutes,
    isPast: diffMinutes < 0,
  };
}

/**
 * Check if current time is within a time range
 * Useful for determining if an automation should be active
 *
 * @param startTime - Start time in 24-hour format
 * @param endTime - End time in 24-hour format
 * @param referenceDate - Optional date for calculation
 * @returns Boolean indicating if current time is within range
 *
 * @example
 * if (isTimeInRange("09:00", "17:00")) {
 *   console.log("Business hours");
 * }
 */
export function isTimeInRange(
  startTime: string,
  endTime: string,
  referenceDate: Date = new Date(),
): boolean {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const current = referenceDate;
  const currentMinutes = current.getHours() * 60 + current.getMinutes();
  const startMinutesTotal = startHours * 60 + startMinutes;
  const endMinutesTotal = endHours * 60 + endMinutes;

  return (
    currentMinutes >= startMinutesTotal && currentMinutes <= endMinutesTotal
  );
}

/**
 * Format a time for use in database queries and storage
 * Normalizes time to 24-hour format
 *
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59), default 0
 * @returns Formatted 24-hour time string, e.g., "14:00"
 *
 * @example
 * formatTo24Hour(14, 0) // "14:00"
 * formatTo24Hour(9, 30) // "09:30"
 */
export function formatTo24Hour(hours: number, minutes: number = 0): string {
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Compare current date to a weekday to determine if today is before or after that day
 *
 * @param weekday - Weekday name in lowercase, e.g., "monday", "friday"
 * @returns "before" if today is before the weekday, "after" if today is after, "today" if it's that weekday
 *
 * @example
 * compareToWeekday("friday") // "before" (if today is Monday)
 * compareToWeekday("monday") // "after" (if today is Friday)
 * compareToWeekday("wednesday") // "today" (if today is Wednesday)
 */
export function compareToWeekday(
  weekday: string,
): "before" | "after" | "today" {
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const targetDayIndex = dayNames.indexOf(weekday.toLowerCase());
  if (targetDayIndex === -1) {
    throw new Error(`Invalid weekday: ${weekday}`);
  }

  const today = new Date().getDay();

  if (today === targetDayIndex) {
    return "today";
  }

  return today < targetDayIndex ? "before" : "after";
}

export const getNextRunTimestamp = (day: string, time: string): Date => {
  const [hours, minutes] = time.split(":").map(Number);
  const dayIndex = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ].indexOf(day.toLowerCase());

  const now = new Date();
  const currentDay = now.getDay();
  let daysUntil = (dayIndex - currentDay) % 7;

  if (
    daysUntil === 0 &&
    (now.getHours() > hours ||
      (now.getHours() === hours && now.getMinutes() >= minutes))
  ) {
    daysUntil = 7;
  }

  const nextRun = new Date(now);
  nextRun.setDate(nextRun.getDate() + daysUntil);
  nextRun.setHours(hours, minutes, 0, 0);

  return nextRun;
};
