import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarDate } from "@internationalized/date";
import type { EventData, BookingWithPerson } from "@/src/types/schema";
import { getWeekDates, isToday, formatWeekRange, toISODate } from "@/src/utils/calendar/week-utils";
import { getColumnForDate, getGridPosition } from "@/src/utils/calendar/booking-grid";
import TimeZoneSelector from "./time-zone-selector";
import WeekBookingItem from "./week-booking-item";

interface WeekViewCalendarProps {
  eventData: EventData;
  bookings: Record<string, BookingWithPerson[]>;
  weekStart: CalendarDate;
  timezone: string;
  isLoading?: boolean;
  onWeekChange: (direction: "prev" | "next" | "today") => void;
  onTimezoneChange: (tz: string) => void;
}

export default function WeekViewCalendar({
  eventData,
  bookings,
  weekStart,
  timezone,
  isLoading = false,
  onWeekChange,
  onTimezoneChange,
}: WeekViewCalendarProps) {
  // Get all 7 dates for the week
  const weekDates = getWeekDates(weekStart);

  // Day abbreviations for mobile
  const dayAbbreviations = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

  // Day names for desktop
  const dayNames = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-none items-center justify-between border-b border-white/15 bg-gray-800/50 px-6 py-4">
        <h1 className="text-base font-semibold text-white">
          <time dateTime={toISODate(weekStart)}>{formatWeekRange(weekStart)}</time>
        </h1>
        <div className="flex items-center gap-4">
          <div className="relative flex items-center rounded-md bg-white/10 outline -outline-offset-1 outline-white/5 md:items-stretch">
            <button
              type="button"
              onClick={() => onWeekChange("prev")}
              className="flex h-9 w-12 items-center justify-center rounded-l-md pr-1 text-gray-400 hover:text-white focus:relative md:w-9 md:pr-0 md:hover:bg-white/10"
            >
              <span className="sr-only">Semana anterior</span>
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => onWeekChange("today")}
              className="hidden px-3.5 text-sm font-semibold text-white hover:bg-white/10 focus:relative md:block"
            >
              Hoy
            </button>
            <span className="relative -mx-px h-5 w-px bg-white/10 md:hidden" />
            <button
              type="button"
              onClick={() => onWeekChange("next")}
              className="flex h-9 w-12 items-center justify-center rounded-r-md pl-1 text-gray-400 hover:text-white focus:relative md:w-9 md:pl-0 md:hover:bg-white/10"
            >
              <span className="sr-only">Semana siguiente</span>
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>

          {/* Selector de zona horaria */}
          <div className="hidden md:block">
            <TimeZoneSelector value={timezone} onChange={onTimezoneChange} />
          </div>
        </div>
      </header>

      <div className="isolate flex flex-auto flex-col overflow-auto bg-gray-900">
        <div
          style={{ width: "165%" }}
          className="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full"
        >
          <div className="sticky top-0 z-30 flex-none bg-gray-900 ring-1 ring-white/20 sm:pr-8">
            {/* Mobile day headers */}
            <div className="grid grid-cols-7 text-sm/6 text-gray-400 sm:hidden">
              {weekDates.map((date, i) => {
                const isTodayDate = isToday(date);
                return (
                  <button key={i} type="button" className="flex flex-col items-center pt-2 pb-3">
                    {dayAbbreviations[i]}{" "}
                    <span
                      className={`mt-1 flex size-8 items-center justify-center font-semibold ${
                        isTodayDate ? "rounded-full bg-indigo-500 text-white" : "text-white"
                      }`}
                    >
                      {date.day}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Desktop day headers */}
            <div className="-mr-px hidden grid-cols-7 divide-x divide-white/10 border-r border-white/10 text-sm/6 text-gray-400 sm:grid">
              <div className="col-end-1 w-14" />
              {weekDates.map((date, i) => {
                const isTodayDate = isToday(date);
                return (
                  <div key={i} className="flex items-center justify-center py-3">
                    {isTodayDate ? (
                      <span className="flex items-baseline">
                        {dayNames[i]}{" "}
                        <span className="ml-1.5 flex size-8 items-center justify-center rounded-full bg-indigo-500 font-semibold text-white">
                          {date.day}
                        </span>
                      </span>
                    ) : (
                      <span>
                        {dayNames[i]}{" "}
                        <span className="items-center justify-center font-semibold text-white">
                          {date.day}
                        </span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-auto">
            <div className="sticky left-0 z-10 w-14 flex-none bg-gray-900 ring-1 ring-white/5" />
            <div className="grid flex-auto grid-cols-1 grid-rows-1">
              {/* Horizontal lines */}
              <div
                style={{ gridTemplateRows: "repeat(24, minmax(3.5rem, 1fr))" }}
                className="col-start-1 col-end-2 row-start-1 grid divide-y divide-white/5"
              >
                <div className="row-end-1 h-7" />
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    12AM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    1AM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    2AM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    3AM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    4AM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    5AM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    6AM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    7AM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    8AM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    9AM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    10AM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    11AM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    12PM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    1PM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    2PM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    3PM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    4PM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    5PM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    6PM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    7PM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    8PM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    9PM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    10PM
                  </div>
                </div>
                <div>
                  <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-500">
                    11PM
                  </div>
                </div>
              </div>

              {/* Vertical lines */}
              <div className="col-start-1 col-end-2 row-start-1 hidden grid-rows-1 divide-x divide-white/5 sm:grid sm:grid-cols-7">
                <div className="col-start-1 row-span-full" />
                <div className="col-start-2 row-span-full" />
                <div className="col-start-3 row-span-full" />
                <div className="col-start-4 row-span-full" />
                <div className="col-start-5 row-span-full" />
                <div className="col-start-6 row-span-full" />
                <div className="col-start-7 row-span-full" />
                <div className="col-start-8 row-span-full w-8" />
              </div>

              {/* Events/Bookings */}
              <ol
                style={{ gridTemplateRows: "1.75rem repeat(24, minmax(0, 1fr)) auto" }}
                className="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-7 sm:pr-8"
              >
                {isLoading ? (
                  <li className="col-span-full text-center text-gray-400 mt-4">
                    Cargando reservas...
                  </li>
                ) : Object.keys(bookings).length === 0 ? (
                  <li className="col-span-full text-center text-gray-400 mt-4">
                    No hay reservas esta semana
                  </li>
                ) : (
                  Object.entries(bookings).flatMap(([date, dateBookings]) =>
                    dateBookings.map((booking) => {
                      const colStart = getColumnForDate(date, weekStart);

                      // Skip if date is not in this week
                      if (colStart === null) return null;

                      // Get duration from event options
                      const duration =
                        eventData.eventOptions.find((o) => o.id === booking.eventOptionId)
                          ?.durationMinutes || 30;

                      const { rowStart, rowSpan, heightRem } = getGridPosition(
                        booking.timeSlot,
                        duration
                      );

                      return (
                        <WeekBookingItem
                          key={booking.id}
                          booking={booking}
                          date={date}
                          rowStart={rowStart}
                          rowSpan={rowSpan}
                          heightRem={heightRem}
                          colStart={colStart}
                        />
                      );
                    }),
                  )
                )}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
