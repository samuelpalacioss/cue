import {
  CalendarDate,
  parseDate,
  parseZonedDateTime,
  today,
  getLocalTimeZone,
  ZonedDateTime,
  toCalendarDate,
  toTimeZone,
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
 * Optionally converts time from source timezone to target timezone
 * @param timeStr - Time string in HH:MM format (24h)
 * @param format - '12h' or '24h'
 * @param date - Optional CalendarDate to use for timezone conversion
 * @param targetTimezone - Optional target timezone (e.g., 'America/New_York')
 * @param sourceTimezone - Optional source timezone (default: 'UTC')
 * @returns Formatted time string
 */
export function formatTime(
  timeStr: string,
  format: TimeFormat,
  date?: CalendarDate,
  targetTimezone?: string,
  sourceTimezone: string = "UTC",
): string {
  let convertedTimeStr = timeStr;

  // Convert timezone if date and targetTimezone are provided
  if (date && targetTimezone && targetTimezone !== sourceTimezone) {
    try {
      // Parse the time components
      const [hours, minutes] = timeStr.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        // Create a zoned datetime in the source timezone
        const sourceDateTime = parseZonedDateTime(
          `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00[${sourceTimezone}]`,
        );

        // Convert to target timezone
        const targetDateTime = toTimeZone(sourceDateTime, targetTimezone);

        // Extract time portion in HH:MM format
        convertedTimeStr = `${String(targetDateTime.hour).padStart(2, "0")}:${String(targetDateTime.minute).padStart(2, "0")}`;
      }
    } catch (error) {
      // If conversion fails, use original time
      console.warn("Timezone conversion failed:", error);
    }
  }

  // Format to 12h or 24h
  if (format === "24h") {
    return convertedTimeStr;
  }

  // Convert 24h to 12h format
  const [hours, minutes] = convertedTimeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    return convertedTimeStr; // Return original if parsing fails
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
