'use client';

import { useEffect, useState, Suspense } from 'react';
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
import BookingCard from '@/components/booking/booking-card';
import { useSearchQueryParams } from '@/src/hooks/useSearchQueryParams';
import type { EventData, TimeSlot } from '@/src/types/schema';

interface BookingPageClientProps {
  eventData: EventData;
  username: string;
  urlSlug: string;
}

// API response types
interface AvailabilityResponse {
  availableDates: string[];
  availabilityCount: Record<string, number>;
}

interface SlotsResponse {
  slots: TimeSlot[];
}

function BookingPageClientInner({
  eventData,
  username,
  urlSlug,
}: BookingPageClientProps) {
  const { params, setParam, setParams } = useSearchQueryParams();

  // Local state for fetched data
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [availabilityCount, setAvailabilityCount] = useState<Map<string, number>>(
    new Map()
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Default timezone to local timezone
  const [timezone, setTimezone] = useState<string>(() => {
    try {
      return getLocalTimeZone();
    } catch {
      return 'UTC';
    }
  });

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

  // Fetch availability when month, timezone, or event option changes
  useEffect(() => {
    const { year, month } = currentMonth;

    async function fetchAvailability() {
      try {
        const url = `/api/events/${username}/${urlSlug}/availability?year=${year}&month=${month}&timezone=${encodeURIComponent(timezone)}&eventOptionId=${selectedEventOptionId}`;

        const response = await fetch(url);
        if (!response.ok) {
          console.error('Failed to fetch availability:', response.status);
          setAvailableDates(new Set());
          setAvailabilityCount(new Map());
          return;
        }

        const data: AvailabilityResponse = await response.json();
        setAvailableDates(new Set(data.availableDates));
        setAvailabilityCount(new Map(Object.entries(data.availabilityCount)));
      } catch (error) {
        console.error('Error fetching availability:', error);
        setAvailableDates(new Set());
        setAvailabilityCount(new Map());
      }
    }

    fetchAvailability();
  }, [currentMonth.year, currentMonth.month, timezone, selectedEventOptionId, username, urlSlug]);

  // Fetch time slots when date, timezone, or event option changes
  useEffect(() => {
    if (!params.date) {
      setTimeSlots([]);
      return;
    }

    async function fetchTimeSlots() {
      try {
        const url = `/api/events/${username}/${urlSlug}/slots?date=${params.date}&timezone=${encodeURIComponent(timezone)}&eventOptionId=${selectedEventOptionId}`;

        const response = await fetch(url);
        if (!response.ok) {
          console.error('Failed to fetch slots:', response.status);
          setTimeSlots([]);
          return;
        }

        const data: SlotsResponse = await response.json();
        setTimeSlots(data.slots);
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setTimeSlots([]);
      }
    }

    fetchTimeSlots();
  }, [params.date, timezone, selectedEventOptionId, username, urlSlug]);

  // Event handlers
  function handleDateChange(date: CalendarDate) {
    const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    // Clear slot selection when date changes
    setParams({ date: dateStr, slot: undefined });
  }

  function handleTimezoneChange(tz: string) {
    setTimezone(tz);
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
      timezone={timezone}
      availableDates={availableDates}
      availabilityCount={availabilityCount}
      timeSlots={timeSlots}
      selectedSlotTime={selectedSlotTime}
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
