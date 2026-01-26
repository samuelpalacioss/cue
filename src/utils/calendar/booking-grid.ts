import { CalendarDate, getLocalTimeZone } from '@internationalized/date';
import { toISODate } from './week-utils';

/**
 * Convert a time slot (HH:MM or HH:MM:SS) to grid row number
 * The grid has 24 rows (60-minute intervals) starting at row 2
 * Row 2 = 12:00 AM, Row 3 = 1:00 AM, ..., Row 25 = 11:00 PM
 *
 * @param timeSlot - Time in HH:MM or HH:MM:SS format (e.g., "14:30" or "14:30:00")
 * @returns Grid row number (2-25) - always an integer
 */
export function timeToGridRow(timeSlot: string): number {
  // Handle both HH:MM and HH:MM:SS formats
  const [hoursStr, minutesStr] = timeSlot.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  // Formula: hours + 2
  // Row 2 is 00:00-00:59, row 3 is 01:00-01:59, etc.
  // Times with minutes (e.g., 14:30) snap to the hour row
  // If minutes >= 30, we could optionally round to next hour, but for now we floor to current hour
  return hours + 2;
}

/**
 * Convert duration in minutes to grid row span
 * Each row represents 60 minutes
 *
 * @param durationMinutes - Duration in minutes (e.g., 30, 60, 90)
 * @returns Number of rows to span - always an integer (minimum 1)
 */
export function durationToGridSpan(durationMinutes: number): number {
  // Round up to nearest hour (minimum 1 row)
  return Math.max(1, Math.ceil(durationMinutes / 60));
}

/**
 * Get the column number (1-7) for a date within a week
 * Monday = 1, Tuesday = 2, ..., Sunday = 7
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param weekStart - The CalendarDate representing Monday of the week
 * @returns Column number (1-7) or null if date is not in this week
 */
export function getColumnForDate(dateStr: string, weekStart: CalendarDate): number | null {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new CalendarDate(year, month, day);

  // Calculate days difference from week start
  const weekStartDate = weekStart.toDate(getLocalTimeZone());
  const targetDate = date.toDate(getLocalTimeZone());

  const diffTime = targetDate.getTime() - weekStartDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // If date is within the week (0-6 days from start), return column (1-7)
  if (diffDays >= 0 && diffDays <= 6) {
    return diffDays + 1;
  }

  return null;
}

/**
 * Format time from HH:MM or HH:MM:SS to 12-hour format (e.g., "2:30 PM")
 * @param timeSlot - Time in HH:MM or HH:MM:SS format
 * @param use24Hour - Whether to use 24-hour format (default: false)
 * @returns Formatted time string
 */
export function formatTime(timeSlot: string, use24Hour = false): string {
  // Handle both HH:MM and HH:MM:SS formats
  const [hoursStr, minutesStr] = timeSlot.split(':');

  if (use24Hour) {
    return `${hoursStr}:${minutesStr}`;
  }

  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Get grid position for a booking with precise height calculation
 * @param timeSlot - Time in HH:MM format
 * @param durationMinutes - Duration in minutes
 * @returns Object with rowStart, rowSpan (integer for grid), and heightRem (precise visual height)
 */
export function getGridPosition(
  timeSlot: string,
  durationMinutes: number
): { rowStart: number; rowSpan: number; heightRem: number } {
  const rowSpan = durationToGridSpan(durationMinutes);

  // Base row height from grid definition: minmax(3.5rem, 1fr) = 3.5rem minimum
  const rowHeightRem = 3.5;

  // Calculate precise height in rem: (duration in hours) * row height
  // E.g., 30 min = 0.5 * 3.5 = 1.75rem, 45 min = 0.75 * 3.5 = 2.625rem
  const heightRem = (durationMinutes / 60) * rowHeightRem;

  return {
    rowStart: timeToGridRow(timeSlot),
    rowSpan,
    heightRem,
  };
}
