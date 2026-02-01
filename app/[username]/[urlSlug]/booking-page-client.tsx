"use client";

import { useEffect, useState, Suspense } from "react";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";
import BookingCard from "@/src/components/booking/booking-card";
import { useSearchQueryParams } from "@/src/hooks/useSearchQueryParams";
import { useAvailability, useTimeSlotsRange } from "@/src/hooks/useBookingQueries";
import type { EventData, TimeSlot } from "@/src/types/schema";
import { TimeFormat } from "@/src/utils/booking/date-utils";
import { DEFAULT_TIME_FORMAT } from "@/src/utils/constants";

const TIME_FORMAT_STORAGE_KEY = "booking-time-format";
const TIMEZONE_STORAGE_KEY = "booking-timezone";

interface BookingPageClientProps {
  eventData: EventData;
  username: string;
  urlSlug: string;
}

function BookingPageClientInner({ eventData, username, urlSlug }: BookingPageClientProps) {
  const { params, setParam, setParams, replaceParams } = useSearchQueryParams();

  // Manage time format state with localStorage persistence
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(TIME_FORMAT_STORAGE_KEY);
      if (stored === "12h" || stored === "24h") {
        return stored;
      }
    }
    return DEFAULT_TIME_FORMAT;
  });

  // Update localStorage when timeFormat changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TIME_FORMAT_STORAGE_KEY, timeFormat);
    }
  }, [timeFormat]);

  // Manage timezone state with localStorage persistence
  const [timezone, setTimezone] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
      if (stored) {
        return stored;
      }
    }
    try {
      return getLocalTimeZone();
    } catch {
      return "UTC";
    }
  });

  // Update localStorage when timezone changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
    }
  }, [timezone]);

  // Initialize month and duration params in URL if not present (on fresh load)
  // Uses replace so back button doesn't go to clean URL
  useEffect(() => {
    const paramsToSet: Record<string, string | number> = {};

    if (!params.month) {
      const now = today(getLocalTimeZone());
      paramsToSet.month = `${now.year}-${String(now.month).padStart(2, "0")}`;
    }

    if (!params.duration) {
      const defaultOption = eventData.eventOptions.find(
        (opt) => opt.id === eventData.defaultOptionId,
      );
      if (defaultOption) {
        paramsToSet.duration = defaultOption.durationMinutes;
      }
    }

    if (Object.keys(paramsToSet).length > 0) {
      replaceParams(paramsToSet);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive selected duration from URL params or default
  const selectedDuration = (() => {
    if (params.duration) {
      const option = eventData.eventOptions.find((opt) => opt.durationMinutes === params.duration);
      if (option) return params.duration;
    }
    const defaultOption = eventData.eventOptions.find(
      (opt) => opt.id === eventData.defaultOptionId,
    );
    return defaultOption?.durationMinutes!;
  })();

  // Derive selected event option ID from duration param
  const selectedEventOptionId = (() => {
    if (params.duration) {
      const option = eventData.eventOptions.find((opt) => opt.durationMinutes === params.duration);
      if (option) return option.id;
    }
    return eventData.defaultOptionId;
  })();

  // Derive selected date from URL params
  // The useEffect below will set it to first available date if not present
  const selectedDate = (() => {
    if (params.date) {
      const [year, month, day] = params.date.split("-").map(Number);
      if (year && month && day) {
        return new CalendarDate(year, month, day);
      }
    }
    // Temporary fallback until first available date is set by useEffect
    return today(getLocalTimeZone());
  })();

  // Derive current visible month from URL params
  const currentMonth = (() => {
    if (params.month) {
      const [year, month] = params.month.split("-").map(Number);
      if (year && month) {
        return { year, month };
      }
    }
    return { year: selectedDate.year, month: selectedDate.month };
  })();

  // Create a focused date to control which month the calendar displays
  // This is the "source of truth" for the visible month
  const focusedDate = new CalendarDate(currentMonth.year, currentMonth.month, 15);

  // Fetch availability using TanStack Query
  const { data: availabilityData, isLoading: isLoadingAvailability } = useAvailability({
    username,
    urlSlug,
    year: currentMonth.year,
    month: currentMonth.month,
    timezone,
    eventOptionId: String(selectedEventOptionId),
  });

  // Extract availability data with defaults
  const availableDates = availabilityData?.availableDates ?? new Set<string>();
  const availabilityCount = availabilityData?.availabilityCount ?? new Map<string, number>();

  // Calculate month date range for prefetching
  const monthDateRange = (() => {
    const year = currentMonth.year;
    const month = currentMonth.month;
    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const lastDay = new Date(Date.UTC(year, month, 0));
    return {
      startDate: firstDay.toISOString().split("T")[0],
      endDate: lastDay.toISOString().split("T")[0],
    };
  })();

  // Fetch all slots for the month in a single request
  const {
    data: monthSlots,
    isLoading: isLoadingMonthSlots,
    isFetched: isMonthSlotsFetched,
  } = useTimeSlotsRange({
    username,
    urlSlug,
    startDate: monthDateRange.startDate,
    endDate: monthDateRange.endDate,
    timezone,
    eventOptionId: String(selectedEventOptionId),
    enabled: !isLoadingAvailability && availableDates.size > 0,
  });

  // Derive time slots for selected date from month slots
  const timeSlots = params.date && monthSlots ? (monthSlots[params.date] ?? []) : [];

  // Derive loading states
  const isLoadingSlots = isLoadingAvailability || isLoadingMonthSlots;
  const isSlotsFetched = isMonthSlotsFetched;

  // Set first available date when availability loads and (no date selected OR month changed via navigation)
  useEffect(() => {
    if (availableDates.size > 0 && !isLoadingAvailability) {
      const firstAvailableDate = Array.from(availableDates).sort()[0];
      if (!firstAvailableDate) return;

      // Case 1: No date selected yet (initial load)
      if (!params.date) {
        replaceParams({ date: firstAvailableDate });
        return;
      }

      // Case 2: Date's month doesn't match current month param (navigated to different month)
      if (params.month) {
        const dateMonth = params.date.substring(0, 7); // Extract "2026-01" from "2026-01-25"
        if (dateMonth !== params.month) {
          replaceParams({ date: firstAvailableDate });
        }
      }
    }
  }, [availableDates, params.date, params.month, isLoadingAvailability]); // eslint-disable-line react-hooks/exhaustive-deps

  // Event handlers
  function handleDateChange(date: CalendarDate) {
    const dateStr = `${date.year}-${String(date.month).padStart(2, "0")}-${String(
      date.day,
    ).padStart(2, "0")}`;
    // Clear slot selection when date changes
    setParams({ date: dateStr, slot: undefined });
  }

  function handleTimezoneChange(tz: string) {
    setTimezone(tz);
  }

  function handleMonthChange(year: number, month: number) {
    // Prevent navigating to months before the current month
    const now = today(getLocalTimeZone());
    if (year < now.year || (year === now.year && month < now.month)) {
      return;
    }

    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    // console.log('handleMonthChange called:', { year, month, monthStr });
    setParam("month", monthStr);
  }

  function handleSlotSelect(slot: TimeSlot | undefined) {
    if (!slot || !params.date) {
      setParam("slot", undefined);
      return;
    }
    // Store as ISO timestamp combining date and time
    const isoTimestamp = `${params.date}T${slot.startTime}:00`;
    setParam("slot", isoTimestamp);
  }

  function handleDurationChange(durationMinutes: number) {
    // Clear slot selection when duration changes since slots depend on duration
    setParams({ duration: durationMinutes, slot: undefined });
  }

  // Extract selected slot time from URL (HH:MM format for comparison)
  const selectedSlotTime = (() => {
    if (!params.slot) return undefined;
    // slot is stored as ISO timestamp like "2026-01-28T13:45:00"
    // Extract the HH:MM portion
    const match = params.slot.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : undefined;
  })();

  return (
    <BookingCard
      event={eventData}
      selectedDate={selectedDate}
      focusedDate={focusedDate}
      timezone={timezone}
      selectedDuration={selectedDuration}
      availableDates={availableDates}
      availabilityCount={availabilityCount}
      timeSlots={timeSlots}
      selectedSlotTime={selectedSlotTime}
      isLoadingAvailability={isLoadingAvailability}
      isLoadingSlots={isLoadingSlots}
      isSlotsFetched={isSlotsFetched}
      onDateChange={handleDateChange}
      onTimezoneChange={handleTimezoneChange}
      onMonthChange={handleMonthChange}
      onSlotSelect={handleSlotSelect}
      onDurationChange={handleDurationChange}
      timeFormat={timeFormat}
      setTimeFormat={setTimeFormat}
    />
  );
}

// Wrap with Suspense for useSearchParams
export default function BookingPageClient(props: BookingPageClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <BookingPageClientInner {...props} />
    </Suspense>
  );
}
