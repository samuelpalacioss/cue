"use client";

import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Calendar,
  CalendarGrid,
  CalendarGridHeader,
  CalendarGridBody,
  CalendarCell,
  CalendarHeaderCell,
  Heading,
  Button,
  I18nProvider,
} from "react-aria-components";

// **OPTIMIZATION (Rule 6.3): Hoist static data to module level**
// This dayMap object was being recreated on every render for every day header cell
// By hoisting it, we create it once and reuse it across all renders
const DAY_MAP: Record<string, string> = {
  // Spanish full names
  lunes: "Lun",
  martes: "Mar",
  miércoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sábado: "Sáb",
  domingo: "Dom",
  // Spanish abbreviations (most likely what React Aria passes)
  lun: "Lun",
  mar: "Mar",
  mié: "Mié",
  jue: "Jue",
  vie: "Vie",
  sáb: "Sáb",
  dom: "Dom",
  // Single letter (some locales)
  l: "Lun",
  m: "Mar",
  x: "Mié", // 'x' is sometimes used for Wednesday in Spanish
  j: "Jue",
  v: "Vie",
  s: "Sáb",
  d: "Dom",
  // English names (fallback if locale isn't working)
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mié",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sáb",
  sunday: "Dom",
  mon: "Lun",
  tue: "Mar",
  wed: "Mié",
  thu: "Jue",
  fri: "Vie",
  sat: "Sáb",
  sun: "Dom",
};

// Based on the availability for a time slot, display some dots
function getDotsCount(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  return 3;
}

// Extracts the day label
function getDayLabel(day: string): string {
  const dayLower = day.toLowerCase().trim();

  // Try direct mapping first
  let displayLabel = DAY_MAP[dayLower];

  // If no direct match, try finding by substring
  if (!displayLabel) {
    for (const [key, value] of Object.entries(DAY_MAP)) {
      if (dayLower.startsWith(key) || key.startsWith(dayLower)) {
        displayLabel = value;
        break;
      }
    }
  }

  // Final fallback: use first 3 chars uppercase
  if (!displayLabel) {
    displayLabel = day.toUpperCase().slice(0, 3);
  }

  return displayLabel;
}

// Helper functions for date validation
function isMoreThan10DaysAgo(date: CalendarDate): boolean {
  const localToday = today(getLocalTimeZone());
  const tenDaysAgo = localToday.subtract({ days: 10 });
  return date.compare(tenDaysAgo) < 0;
}

function isDateInPast(date: CalendarDate): boolean {
  const localToday = today(getLocalTimeZone());
  return date.compare(localToday) < 0;
}

interface CalendarPanelProps {
  selectedDate: CalendarDate;
  focusedDate: CalendarDate;
  onDateChange: (date: CalendarDate) => void;
  availableDates?: Set<string>;
  availabilityCount?: Map<string, number>;
  showAvailabilityDots?: boolean;
  locale?: string;
  onVisibleMonthChange?: (year: number, month: number) => void;
}

export default function CalendarPanel({
  selectedDate,
  focusedDate,
  onDateChange,
  availableDates = new Set(),
  availabilityCount = new Map(),
  showAvailabilityDots = true,
  locale = "es-ES",
  onVisibleMonthChange,
}: CalendarPanelProps) {
  return (
    <div className="bg-cue-off-white p-5 md:border-r md:border-gray-200 md:bg-cue-off-white md:p-6">
      <I18nProvider locale={locale}>
        <Calendar
          value={selectedDate}
          focusedValue={focusedDate}
          onChange={onDateChange}
          className="w-full"
          aria-label="Select a date"
          minValue={today(getLocalTimeZone()).subtract({ days: 10 })}
        >
          {({ state }) => {
            const visibleRangeStart = state.visibleRange.start;
            const visibleDate = visibleRangeStart.toDate(getLocalTimeZone());
            const visibleMonth = visibleRangeStart.month;
            const visibleYear = visibleRangeStart.year;

            // Format month and year separately from the visible date (not selected date)
            // This ensures the heading updates when navigating months
            const monthName = visibleDate
              .toLocaleDateString(locale, {
                month: "long",
              })
              .toLowerCase();
            const year = visibleDate.toLocaleDateString(locale, {
              year: "numeric",
            });

            // Calculate previous and next months for navigation handlers
            const handlePreviousMonth = () => {
              const newMonth = visibleMonth === 1 ? 12 : visibleMonth - 1;
              const newYear = visibleMonth === 1 ? visibleYear - 1 : visibleYear;
              onVisibleMonthChange?.(newYear, newMonth);
            };

            const handleNextMonth = () => {
              const newMonth = visibleMonth === 12 ? 1 : visibleMonth + 1;
              const newYear = visibleMonth === 12 ? visibleYear + 1 : visibleYear;
              onVisibleMonthChange?.(newYear, newMonth);
            };

            return (
              <>
                <header className="-mx-5 mb-4 flex items-center justify-between border-b border-t border-gray-200 px-5 py-4 md:mx-0 md:border-0 md:px-0 md:py-0">
                  <Heading className="text-lg font-bold text-cue-deep-green">
                    <span className="capitalize">{monthName}</span> {year}
                  </Heading>
                  <div className="flex gap-2">
                    <Button
                      slot="previous"
                      onPress={handlePreviousMonth}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-cue-deep-green transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cue-deep-green"
                    >
                      <ChevronLeft aria-hidden className="size-5.5" />
                    </Button>
                    <Button
                      slot="next"
                      onPress={handleNextMonth}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-cue-deep-green transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cue-deep-green"
                    >
                      <ChevronRight aria-hidden className="size-5.5" />
                    </Button>
                  </div>
                </header>

                <div className="h-[430px]">
                  <CalendarGrid className="w-full border-collapse [border-spacing:0] table-fixed">
                    <CalendarGridHeader>
                      {(day: string) => {
                        const displayLabel = getDayLabel(day);

                        return (
                          <CalendarHeaderCell className="pb-5 text-center text-sm font-semibold text-cue-deep-green">
                            {displayLabel}
                          </CalendarHeaderCell>
                        );
                      }}
                    </CalendarGridHeader>
                    <CalendarGridBody>
                      {(date) => {
                        const dateStr = date.toString();
                        const isMoreThan10DaysPast = isMoreThan10DaysAgo(date);
                        const isPast = isDateInPast(date);
                        const isAvailable = availableDates.has(dateStr);
                        const slotCount = availabilityCount.get(dateStr) || 0;

                        const dotsCount = getDotsCount(slotCount);

                        // Hide dates that don't belong to the visible month
                        const isOutsideVisibleMonth =
                          date.month !== visibleMonth || date.year !== visibleYear;

                        return (
                          <CalendarCell
                            date={date}
                            className={({ isSelected, isDisabled }) => {
                              // Hide dates that are more than 10 days in the past or outside visible month
                              if (isMoreThan10DaysPast || isOutsideVisibleMonth) {
                                return "hidden";
                              }

                              // Fill cell to remove gaps; aspect-square keeps cells square
                              const baseClasses =
                                "relative w-full aspect-square min-h-13 cursor-pointer border border-gray-200 text-center text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cue-deep-green";

                              if (isDisabled || isPast) {
                                return `${baseClasses} cursor-not-allowed text-gray-300 bg-cue-off-white`;
                              }

                              if (isSelected) {
                                return `${baseClasses} border-cue-deep-green bg-cue-deep-green text-white font-semibold`;
                              }

                              // Greyed out for available, non-past days
                              if (isAvailable) {
                                return `${baseClasses} bg-gray-50 text-gray-900 hover:bg-gray-100`;
                              }

                              return `${baseClasses} text-gray-400 hover:bg-gray-50 bg-cue-off-white`;
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
                                        className="h-1 w-1 rounded-full bg-cue-deep-green"
                                      ></span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </CalendarCell>
                        );
                      }}
                    </CalendarGridBody>
                  </CalendarGrid>
                </div>
              </>
            );
          }}
        </Calendar>
      </I18nProvider>
    </div>
  );
}
