import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';

type WeekStartDay = 'monday' | 'sunday';

/**
 * Get the start of the week for a given date
 * @param date - The date to find the week start for
 * @param startDay - Whether the week starts on Monday or Sunday (default: monday)
 * @returns CalendarDate representing the first day of the week
 */
export function getWeekStart(
  date: CalendarDate,
  startDay: WeekStartDay = 'monday'
): CalendarDate {
  const dayOfWeek = date.toDate(getLocalTimeZone()).getDay(); // 0 = Sunday, 6 = Saturday

  if (startDay === 'monday') {
    // Monday = 1, Sunday = 0
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return date.subtract({ days: daysToSubtract });
  } else {
    // Sunday start
    return date.subtract({ days: dayOfWeek });
  }
}

/**
 * Get the end of the week (6 days after start)
 * @param weekStart - The start of the week
 * @returns CalendarDate representing the last day of the week
 */
export function getWeekEnd(weekStart: CalendarDate): CalendarDate {
  return weekStart.add({ days: 6 });
}

/**
 * Get the current week's start date
 * @param startDay - Whether the week starts on Monday or Sunday (default: monday)
 * @returns CalendarDate representing the start of the current week
 */
export function getCurrentWeek(startDay: WeekStartDay = 'monday'): CalendarDate {
  const todayDate = today(getLocalTimeZone());
  return getWeekStart(todayDate, startDay);
}

/**
 * Get the previous week's start date
 * @param weekStart - The current week's start date
 * @returns CalendarDate representing the start of the previous week
 */
export function getPreviousWeek(weekStart: CalendarDate): CalendarDate {
  return weekStart.subtract({ days: 7 });
}

/**
 * Get the next week's start date
 * @param weekStart - The current week's start date
 * @returns CalendarDate representing the start of the next week
 */
export function getNextWeek(weekStart: CalendarDate): CalendarDate {
  return weekStart.add({ days: 7 });
}

/**
 * Get an array of 7 dates representing all days in the week
 * @param weekStart - The start of the week (should be a Monday if using Monday start)
 * @returns Array of 7 CalendarDate objects
 */
export function getWeekDates(weekStart: CalendarDate): CalendarDate[] {
  return Array.from({ length: 7 }, (_, i) => weekStart.add({ days: i }));
}

/**
 * Check if a date is today
 * @param date - The date to check
 * @returns True if the date is today
 */
export function isToday(date: CalendarDate): boolean {
  const todayDate = today(getLocalTimeZone());
  return (
    date.year === todayDate.year &&
    date.month === todayDate.month &&
    date.day === todayDate.day
  );
}

/**
 * Format a week range for display (e.g., "Jan 27 - Feb 2, 2026")
 * @param weekStart - The start of the week
 * @returns Formatted string representing the week range
 */
export function formatWeekRange(weekStart: CalendarDate): string {
  const weekEnd = getWeekEnd(weekStart);

  const startMonth = weekStart.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
    month: 'short',
  });
  const endMonth = weekEnd.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
    month: 'short',
  });

  const startDay = weekStart.day;
  const endDay = weekEnd.day;
  const year = weekEnd.year;

  if (weekStart.month === weekEnd.month) {
    // Same month: "Jan 27 - Feb 2, 2026"
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  } else {
    // Different months: "Jan 27 - Feb 2, 2026"
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}

/**
 * Convert CalendarDate to ISO date string (YYYY-MM-DD)
 * @param date - The CalendarDate to convert
 * @returns ISO formatted date string
 */
export function toISODate(date: CalendarDate): string {
  const year = date.year.toString().padStart(4, '0');
  const month = date.month.toString().padStart(2, '0');
  const day = date.day.toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
