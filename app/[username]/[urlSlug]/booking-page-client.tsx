"use client";

import { useEffect, useState, Suspense } from "react";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";
import BookingCard from "@/components/booking/booking-card";
import { useSearchQueryParams } from "@/src/hooks/useSearchQueryParams";
import { useAvailability, useTimeSlots, bookingKeys } from "@/src/hooks/useBookingQueries";
import type { EventData, TimeSlot } from "@/src/types/schema";
import { useQueryClient } from "@tanstack/react-query";
import { TimeFormat } from "@/src/utils/booking/date-utils";
import { DEFAULT_TIME_FORMAT } from "@/src/utils/constants";

const TIME_FORMAT_STORAGE_KEY = "booking-time-format";

interface BookingPageClientProps {
  eventData: EventData;
  username: string;
  urlSlug: string;
}

function BookingPageClientInner({ eventData, username, urlSlug }: BookingPageClientProps) {
  const { params, setParam, setParams, replaceParams } = useSearchQueryParams();
  const queryClient = useQueryClient();

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

  // Default timezone to local timezone
  const timezone = (() => {
    try {
      return getLocalTimeZone();
    } catch {
      return "UTC";
    }
  })();

  // Initialize month param in URL if not present (on fresh load)
  // Uses replace so back button doesn't go to clean URL
  useEffect(() => {
    if (!params.month) {
      const now = today(getLocalTimeZone());
      const monthStr = `${now.year}-${String(now.month).padStart(2, "0")}`;
      replaceParams({
        month: monthStr,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Fetch time slots using TanStack Query
  const { data: timeSlots = [], isLoading: isLoadingSlots } = useTimeSlots({
    username,
    urlSlug,
    date: params.date,
    timezone,
    eventOptionId: String(selectedEventOptionId),
  });

  // Extract availability data with defaults
  const availableDates = availabilityData?.availableDates ?? new Set<string>();
  const availabilityCount = availabilityData?.availabilityCount ?? new Map<string, number>();

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

  // Prefetch time slots for all available dates in the current month
  useEffect(() => {
    if (availableDates.size > 0 && !isLoadingAvailability) {
      availableDates.forEach((date) => {
        queryClient.prefetchQuery({
          queryKey: bookingKeys.slots(
            username,
            urlSlug,
            date,
            timezone,
            String(selectedEventOptionId)
          ),
          queryFn: async () => {
            const url = `/api/events/${username}/${urlSlug}/slots?date=${date}&timezone=${encodeURIComponent(
              timezone
            )}&eventOptionId=${selectedEventOptionId}`;
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Failed to fetch slots: ${response.status}`);
            }
            const data = await response.json();
            return data.slots;
          },
          staleTime: 2 * 60 * 1000, // 2 minutes
        });
      });
    }
  }, [
    availableDates,
    isLoadingAvailability,
    username,
    urlSlug,
    timezone,
    selectedEventOptionId,
    queryClient,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Event handlers
  function handleDateChange(date: CalendarDate) {
    const dateStr = `${date.year}-${String(date.month).padStart(2, "0")}-${String(
      date.day
    ).padStart(2, "0")}`;
    // Clear slot selection when date changes
    setParams({ date: dateStr, slot: undefined });
  }

  function handleTimezoneChange(_tz: string) {
    // Timezone changes would require state management
    // For now, we use the detected timezone
  }

  function handleMonthChange(year: number, month: number) {
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
      availableDates={availableDates}
      availabilityCount={availabilityCount}
      timeSlots={timeSlots}
      selectedSlotTime={selectedSlotTime}
      isLoadingAvailability={isLoadingAvailability}
      isLoadingSlots={isLoadingSlots}
      onDateChange={handleDateChange}
      onTimezoneChange={handleTimezoneChange}
      onMonthChange={handleMonthChange}
      onSlotSelect={handleSlotSelect}
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
