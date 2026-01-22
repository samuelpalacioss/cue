import {
  CalendarDate,
  parseDate,
  parseZonedDateTime,
  today,
  getLocalTimeZone,
  ZonedDateTime,
  toCalendarDate,
} from "@internationalized/date";

export type TimeFormat = "12h" | "24h";

/**
 * Format a CalendarDate for display using Intl.DateTimeFormat
 * @param date - CalendarDate object
 * @param locale - Locale string (default: 'es-ES')
 * @returns Formatted date string (e.g., "dom 18")
 */
export function formatCalendarDate(date: CalendarDate, locale: string = "es-ES"): string {
  return date.toDate(getLocalTimeZone()).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
  });
}

/**
 * Format time string (HH:MM) to 12h or 24h format
 * @param timeStr - Time string in HH:MM format (24h)
 * @param format - '12h' or '24h'
 * @returns Formatted time string
 */
export function formatTime(timeStr: string, format: TimeFormat): string {
  if (format === "24h") {
    return timeStr;
  }

  // Convert 24h to 12h format
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    return timeStr; // Return original if parsing fails
  }

  const period = hours >= 12 ? "pm" : "am";
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return `${hours12}:${String(minutes).padStart(2, "0")}${period}`;
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}
