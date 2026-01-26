'use client';

import { useState, useEffect, Suspense } from 'react';
import { CalendarDate, getLocalTimeZone } from '@internationalized/date';
import type { EventData } from '@/src/types/schema';
import { useEventBookings } from '@/src/hooks/useBookingQueries';
import {
  getCurrentWeek,
  getPreviousWeek,
  getNextWeek,
  toISODate,
  getWeekEnd,
} from '@/src/utils/calendar/week-utils';
import WeekViewCalendar from '@/src/components/booking/week_view_calendar';

interface DashboardCalendarClientProps {
  eventData: EventData;
  username: string;
  urlSlug: string;
}

export default function DashboardCalendarClient({
  eventData,
  username,
  urlSlug,
}: DashboardCalendarClientProps) {
  // Initialize current week start (Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState<CalendarDate>(() =>
    getCurrentWeek('monday')
  );

  // Initialize timezone from localStorage or default to local timezone
  const [timezone, setTimezone] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboard-timezone') || getLocalTimeZone();
    }
    return getLocalTimeZone();
  });

  // Persist timezone to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-timezone', timezone);
    }
  }, [timezone]);

  // Calculate derived values
  const weekEnd = getWeekEnd(currentWeekStart);
  const startDate = toISODate(currentWeekStart);
  const endDate = toISODate(weekEnd);

  // Fetch bookings for current week
  const { data: bookings = {}, isLoading } = useEventBookings({
    urlSlug,
    startDate,
    endDate,
    timezone,
    username, // TODO: Replace with session.user.username
  });

  // Handle week navigation
  const handleWeekChange = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'prev') {
      setCurrentWeekStart(getPreviousWeek(currentWeekStart));
    } else if (direction === 'next') {
      setCurrentWeekStart(getNextWeek(currentWeekStart));
    } else {
      setCurrentWeekStart(getCurrentWeek('monday'));
    }
  };

  // Handle timezone change
  const handleTimezoneChange = (tz: string) => {
    setTimezone(tz);
  };

  return (
    <Suspense fallback={<div>Loading calendar...</div>}>
      <WeekViewCalendar
        eventData={eventData}
        bookings={bookings}
        weekStart={currentWeekStart}
        timezone={timezone}
        isLoading={isLoading}
        onWeekChange={handleWeekChange}
        onTimezoneChange={handleTimezoneChange}
      />
    </Suspense>
  );
}
