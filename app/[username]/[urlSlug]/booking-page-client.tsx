'use client';

import { useEffect, Suspense } from 'react';
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
import BookingCard from '@/components/booking/booking-card';
import { useSearchQueryParams } from '@/src/hooks/useSearchQueryParams';
import { useAvailability, useTimeSlots } from '@/src/hooks/useBookingQueries';
import type { EventData, TimeSlot } from '@/src/types/schema';

interface BookingPageClientProps {
  eventData: EventData;
  username: string;
  urlSlug: string;
}

function BookingPageClientInner({
  eventData,
  username,
  urlSlug,
}: BookingPageClientProps) {
  const { params, setParam, setParams, replaceParams } = useSearchQueryParams();

  // Default timezone to local timezone
  const timezone = (() => {
    try {
      return getLocalTimeZone();
    } catch {
      return 'UTC';
    }
  })();

  // Initialize month param in URL if not present (on fresh load)
  // Uses replace so back button doesn't go to clean URL
  useEffect(() => {
    if (!params.month) {
      const now = today(getLocalTimeZone());
      const monthStr = `${now.year}-${String(now.month).padStart(2, '0')}`;
      replaceParams({ month: monthStr });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive selected event option ID from duration param
  const selectedEventOptionId = (() => {
    if (params.duration) {
      const option = eventData.eventOptions.find(
        (opt) => opt.durationMinutes === params.duration
      );
      if (option) return option.id;
    }
    return eventData.defaultOptionId;
  })();

  // Derive selected date from URL params
  const selectedDate = (() => {
    if (params.date) {
      const [year, month, day] = params.date.split('-').map(Number);
      if (year && month && day) {
        return new CalendarDate(year, month, day);
      }
    }
    return today(getLocalTimeZone());
  })();

  // Derive current visible month from URL params
  const currentMonth = (() => {
    if (params.month) {
      const [year, month] = params.month.split('-').map(Number);
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
  const {
    data: availabilityData,
    isLoading: isLoadingAvailability,
  } = useAvailability({
    username,
    urlSlug,
    year: currentMonth.year,
    month: currentMonth.month,
    timezone,
    eventOptionId: String(selectedEventOptionId),
  });

  // Fetch time slots using TanStack Query
  const {
    data: timeSlots = [],
    isLoading: isLoadingSlots,
  } = useTimeSlots({
    username,
    urlSlug,
    date: params.date,
    timezone,
    eventOptionId: String(selectedEventOptionId),
  });

  // Extract availability data with defaults
  const availableDates = availabilityData?.availableDates ?? new Set<string>();
  const availabilityCount = availabilityData?.availabilityCount ?? new Map<string, number>();

  // Event handlers
  function handleDateChange(date: CalendarDate) {
    const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    // Clear slot selection when date changes
    setParams({ date: dateStr, slot: undefined });
  }

  function handleTimezoneChange(_tz: string) {
    // Timezone changes would require state management
    // For now, we use the detected timezone
  }

  function handleMonthChange(year: number, month: number) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    // console.log('handleMonthChange called:', { year, month, monthStr });
    setParam('month', monthStr);
  }

  function handleSlotSelect(slot: TimeSlot | undefined) {
    if (!slot || !params.date) {
      setParam('slot', undefined);
      return;
    }
    // Store as ISO timestamp combining date and time
    const isoTimestamp = `${params.date}T${slot.startTime}:00`;
    setParam('slot', isoTimestamp);
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
