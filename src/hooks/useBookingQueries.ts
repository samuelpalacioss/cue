import { useQuery } from "@tanstack/react-query";
import type { TimeSlot, SlotsRangeResponse, BookingWithPerson } from "@/src/types/schema";

// API response types
interface AvailabilityResponse {
  availableDates: string[];
  availabilityCount: Record<string, number>;
}

interface DashboardBookingsResponse {
  bookingsByDate: Record<string, BookingWithPerson[]>;
}

// Query keys factory for better organization and type safety
export const bookingKeys = {
  all: ["booking"] as const,
  availability: (
    username: string,
    urlSlug: string,
    year: number,
    month: number,
    timezone: string,
    eventOptionId: string,
  ) =>
    [
      ...bookingKeys.all,
      "availability",
      username,
      urlSlug,
      year,
      month,
      timezone,
      eventOptionId,
    ] as const,
  slotsRange: (
    username: string,
    urlSlug: string,
    startDate: string,
    endDate: string,
    timezone: string,
    eventOptionId: string,
  ) =>
    [
      ...bookingKeys.all,
      "slotsRange",
      username,
      urlSlug,
      startDate,
      endDate,
      timezone,
      eventOptionId,
    ] as const,
  dashboardBookings: (
    urlSlug: string,
    startDate: string,
    endDate: string,
    timezone: string,
    username: string,
  ) => [...bookingKeys.all, "dashboard", urlSlug, startDate, endDate, timezone, username] as const,
};

// Hook for fetching available dates for a month
export function useAvailability({
  username,
  urlSlug,
  year,
  month,
  timezone,
  eventOptionId,
  enabled = true,
}: {
  username: string;
  urlSlug: string;
  year: number;
  month: number;
  timezone: string;
  eventOptionId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: bookingKeys.availability(username, urlSlug, year, month, timezone, eventOptionId),
    queryFn: async () => {
      const url = `/api/events/${username}/${urlSlug}/availability?year=${year}&month=${month}&timezone=${encodeURIComponent(
        timezone,
      )}&eventOptionId=${eventOptionId}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.status}`);
      }

      const data: AvailabilityResponse = await response.json();

      // await new Promise(resolve => setTimeout(resolve, 4000)); // Delay to see skeleton

      return {
        availableDates: new Set(data.availableDates),
        availabilityCount: new Map(Object.entries(data.availabilityCount)),
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - availability doesn't change too frequently
    enabled,
  });
}

// Hook for fetching time slots for a date range
export function useTimeSlotsRange({
  username,
  urlSlug,
  startDate,
  endDate,
  timezone,
  eventOptionId,
  enabled = true,
}: {
  username: string;
  urlSlug: string;
  startDate: string;
  endDate: string;
  timezone: string;
  eventOptionId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: bookingKeys.slotsRange(
      username,
      urlSlug,
      startDate,
      endDate,
      timezone,
      eventOptionId,
    ),
    queryFn: async () => {
      const url = `/api/events/${username}/${urlSlug}/slots?startDate=${startDate}&endDate=${endDate}&timezone=${encodeURIComponent(
        timezone,
      )}&eventOptionId=${eventOptionId}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch slots range: ${response.status}`);
      }

      const data: SlotsRangeResponse = await response.json();

      return data.slotsByDate;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - same as single-date hook
    enabled,
  });
}

// Hook for fetching dashboard bookings for a week
export function useEventBookings({
  urlSlug,
  startDate,
  endDate,
  timezone,
  username,
  enabled = true,
}: {
  urlSlug: string;
  startDate: string;
  endDate: string;
  timezone: string;
  username: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: bookingKeys.dashboardBookings(urlSlug, startDate, endDate, timezone, username),
    queryFn: async () => {
      const url = `/api/dashboard/events/${urlSlug}/bookings?startDate=${startDate}&endDate=${endDate}&timezone=${encodeURIComponent(
        timezone,
      )}&username=${username}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard bookings: ${response.status}`);
      }

      const data: DashboardBookingsResponse = await response.json();
      return data.bookingsByDate;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  });
}
