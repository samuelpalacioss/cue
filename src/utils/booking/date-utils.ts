import {
    CalendarDate,
    parseDate,
    parseZonedDateTime,
    today,
    getLocalTimeZone,
    ZonedDateTime,
    toCalendarDate,
} from '@internationalized/date';

export type TimeFormat = '12h' | '24h';

/**
 * Format a CalendarDate for display using Intl.DateTimeFormat
 * @param date - CalendarDate object
 * @param locale - Locale string (default: 'es-ES')
 * @returns Formatted date string (e.g., "dom 18")
 */
export function formatCalendarDate(
    date: CalendarDate,
    locale: string = 'es-ES'
): string {
    return date.toDate(getLocalTimeZone()).toLocaleDateString(locale, {
        weekday: 'short',
        day: 'numeric',
    });
}

// TODO: Format time function that given the TimeSlot, locale, timezone and time format returns the formatted time