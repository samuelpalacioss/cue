"use client"

import { useRef } from "react"
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date"
import { Calendar, CalendarGrid, CalendarGridHeader, CalendarGridBody, CalendarCell, CalendarHeaderCell, Heading, Button, I18nProvider } from "react-aria-components"

// **OPTIMIZATION (Rule 6.3): Hoist static data to module level**
// This dayMap object was being recreated on every render for every day header cell
// By hoisting it, we create it once and reuse it across all renders
const DAY_MAP: Record<string, string> = {
    // Spanish full names
    'lunes': 'LUN',
    'martes': 'MAR',
    'miércoles': 'MIÉ',
    'jueves': 'JUE',
    'viernes': 'VIE',
    'sábado': 'SÁB',
    'domingo': 'DOM',
    // Spanish abbreviations (most likely what React Aria passes)
    'lun': 'LUN',
    'mar': 'MAR',
    'mié': 'MIÉ',
    'jue': 'JUE',
    'vie': 'VIE',
    'sáb': 'SÁB',
    'dom': 'DOM',
    // Single letter (some locales)
    'l': 'LUN',
    'm': 'MAR',
    'x': 'MIÉ', // 'x' is sometimes used for Wednesday in Spanish
    'j': 'JUE',
    'v': 'VIE',
    's': 'SÁB',
    'd': 'DOM',
    // English names (fallback if locale isn't working)
    'monday': 'LUN',
    'tuesday': 'MAR',
    'wednesday': 'MIÉ',
    'thursday': 'JUE',
    'friday': 'VIE',
    'saturday': 'SÁB',
    'sunday': 'DOM',
    'mon': 'LUN',
    'tue': 'MAR',
    'wed': 'MIÉ',
    'thu': 'JUE',
    'fri': 'VIE',
    'sat': 'SÁB',
    'sun': 'DOM',
}

// Based on the availability for a time slot, display some dots
function getDotsCount(count: number): number {
    if (count === 0) return 0
    if (count <= 2) return 1
    if (count <= 5) return 2
    return 3
}


// Extracts the day label 
function getDayLabel(day: string): string {
    const dayLower = day.toLowerCase().trim()

    // Try direct mapping first
    let displayLabel = DAY_MAP[dayLower]

    // If no direct match, try finding by substring
    if (!displayLabel) {
        for (const [key, value] of Object.entries(DAY_MAP)) {
            if (dayLower.startsWith(key) || key.startsWith(dayLower)) {
                displayLabel = value
                break
            }
        }
    }

    // Final fallback: use first 3 chars uppercase
    if (!displayLabel) {
        displayLabel = day.toUpperCase().slice(0, 3)
    }

    return displayLabel
}

// Helper functions for date validation
function isMoreThan10DaysAgo(date: CalendarDate): boolean {
    const localToday = today(getLocalTimeZone())
    const tenDaysAgo = localToday.subtract({ days: 10 })
    return date.compare(tenDaysAgo) < 0
}

function isDateInPast(date: CalendarDate): boolean {
    const localToday = today(getLocalTimeZone())
    return date.compare(localToday) < 0
}

interface CalendarPanelProps {
    selectedDate: CalendarDate
    onDateChange: (date: CalendarDate) => void
    availableDates?: Set<string>
    availabilityCount?: Map<string, number>
    showAvailabilityDots?: boolean
    locale?: string
    onVisibleMonthChange?: (year: number, month: number) => void
}

export default function CalendarPanel({
    selectedDate,
    onDateChange,
    availableDates = new Set(),
    availabilityCount = new Map(),
    showAvailabilityDots = true,
    locale = 'es-ES',
    onVisibleMonthChange
}: CalendarPanelProps) {
    // Track the previous focused month to detect actual month changes
    const prevFocusedMonthRef = useRef<{ year: number; month: number } | null>(null)
    // Skip the initial focus event that fires on mount
    const isInitialFocusRef = useRef(true)

    // Handle focus changes from React Aria Calendar (fires when user navigates months)
    function handleFocusChange(focusedDate: CalendarDate) {
        const newMonth = { year: focusedDate.year, month: focusedDate.month }
        const prev = prevFocusedMonthRef.current

        // Skip the initial focus event - don't update URL on mount
        if (isInitialFocusRef.current) {
            isInitialFocusRef.current = false
            prevFocusedMonthRef.current = newMonth
            return
        }

        // Only notify parent if the month actually changed
        if (!prev || prev.year !== newMonth.year || prev.month !== newMonth.month) {
            prevFocusedMonthRef.current = newMonth
            onVisibleMonthChange?.(newMonth.year, newMonth.month)
        }
    }

    return (
        <div className="bg-transparent p-5 md:border-r md:border-zinc-800 md:bg-zinc-900 md:p-6">
            <I18nProvider locale={locale}>
                <Calendar
                    value={selectedDate}
                    onChange={onDateChange}
                    onFocusChange={handleFocusChange}
                    className="w-full"
                    aria-label="Select a date"
                    minValue={today(getLocalTimeZone()).subtract({ days: 10 })}
                >
                    {({ state }) => {
                        const visibleRangeStart = state.visibleRange.start
                        const visibleDate = visibleRangeStart.toDate(getLocalTimeZone())
                        const visibleMonth = visibleRangeStart.month
                        const visibleYear = visibleRangeStart.year

                        // Format month and year separately from the visible date (not selected date)
                        // This ensures the heading updates when navigating months
                        const monthName = visibleDate.toLocaleDateString(locale, {
                            month: 'long',
                        })
                        const year = visibleDate.toLocaleDateString(locale, {
                            year: 'numeric',
                        })

                        return (
                            <>
                                <header className="-mx-5 mb-4 flex items-center justify-between border-b border-t border-zinc-800 px-5 py-4 md:mx-0 md:border-0 md:px-0 md:py-0">
                                    <Button
                                        slot="previous"
                                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                    >
                                        ‹
                                    </Button>
                                    <Heading className="text-lg text-white">
                                        <span className="font-bold">{monthName}</span>{' '}
                                        <span className="font-medium text-zinc-400">{year}</span>
                                    </Heading>
                                    <Button
                                        slot="next"
                                        className="flex h-10 w-10  cursor-pointer  items-center justify-center rounded-md text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                    >
                                        ›
                                    </Button>
                                </header>

                                <div className="h-[384px]">
                                    <CalendarGrid className="w-full border-separate border-spacing-0.5 md:border-spacing-1">
                                        <CalendarGridHeader>
                                            {(day: string) => {
                                                const displayLabel = getDayLabel(day)

                                                return (
                                                    <CalendarHeaderCell className="pb-2 text-center text-sm font-medium uppercase text-zinc-400">
                                                        {displayLabel}
                                                    </CalendarHeaderCell>
                                                )
                                            }}
                                        </CalendarGridHeader>
                                        <CalendarGridBody>
                                            {(date) => {
                                                const dateStr = date.toString()
                                                const isMoreThan10DaysPast = isMoreThan10DaysAgo(date)
                                                const isPast = isDateInPast(date)
                                                const isAvailable = availableDates.has(dateStr)
                                                const slotCount = availabilityCount.get(dateStr) || 0

                                                const dotsCount = getDotsCount(slotCount)

                                                // Hide dates that don't belong to the visible month
                                                const isOutsideVisibleMonth = date.month !== visibleMonth || date.year !== visibleYear

                                                return (
                                                    <CalendarCell
                                                        date={date}
                                                        className={({ isSelected, isDisabled }) => {
                                                            // Hide dates that are more than 10 days in the past or outside visible month
                                                            if (isMoreThan10DaysPast || isOutsideVisibleMonth) {
                                                                return 'hidden'
                                                            }

                                                            const baseClasses =
                                                                'relative h-13 w-13 md:h-14 md:w-14 cursor-pointer rounded-lg text-center text-xs md:text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

                                                            if (isDisabled || isPast) {
                                                                return `${baseClasses} cursor-not-allowed text-zinc-600`
                                                            }

                                                            if (isSelected) {
                                                                return `${baseClasses} bg-white text-zinc-900`
                                                            }

                                                            // Greyed out rounded background for available, non-past days
                                                            if (isAvailable) {
                                                                return `${baseClasses} bg-zinc-800 text-white hover:bg-zinc-700`
                                                            }

                                                            return `${baseClasses} text-zinc-400 hover:bg-zinc-800`
                                                        }}
                                                    >
                                                        {({ formattedDate, isSelected }) => (
                                                            <div className="flex h-full flex-col items-center justify-center">
                                                                <span>{formattedDate}</span>

                                                                {showAvailabilityDots && !isSelected && dotsCount > 0 ? (
                                                                    <div className="mt-1 flex gap-0.5">
                                                                        {Array.from({ length: dotsCount }).map((_, i) => (
                                                                            <span
                                                                                key={i}
                                                                                className="h-1 w-1 rounded-full bg-emerald-500"
                                                                            ></span>
                                                                        ))}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        )}
                                                    </CalendarCell>
                                                )
                                            }}
                                        </CalendarGridBody>
                                    </CalendarGrid>
                                </div>
                            </>
                        )
                    }}
                </Calendar>
            </I18nProvider>
        </div>
    )
}