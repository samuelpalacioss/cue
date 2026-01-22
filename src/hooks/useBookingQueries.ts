import { useQuery } from "@tanstack/react-query";
import type { TimeSlot } from "@/src/types/schema";

// API response types
interface AvailabilityResponse {
  availableDates: string[];
  availabilityCount: Record<string, number>;
}

interface SlotsResponse {
  slots: TimeSlot[];
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
    eventOptionId: string
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
  slots: (
    username: string,
    urlSlug: string,
    date: string,
    timezone: string,
    eventOptionId: string
  ) => [...bookingKeys.all, "slots", username, urlSlug, date, timezone, eventOptionId] as const,
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
        timezone
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

// Hook for fetching time slots for a specific date
export function useTimeSlots({
  username,
  urlSlug,
  date,
  timezone,
  eventOptionId,
  enabled = true,
}: {
  username: string;
  urlSlug: string;
  date: string | undefined;
  timezone: string;
  eventOptionId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: date
      ? bookingKeys.slots(username, urlSlug, date, timezone, eventOptionId)
      : ["slots-disabled"],
    queryFn: async () => {
      if (!date) {
        return [];
      }

      const url = `/api/events/${username}/${urlSlug}/slots?date=${date}&timezone=${encodeURIComponent(
        timezone
      )}&eventOptionId=${eventOptionId}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch slots: ${response.status}`);
      }

      const data: SlotsResponse = await response.json();

      // await new Promise(resolve => setTimeout(resolve, 4000)); // Delay to see skeleton

      return data.slots;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - slots can change as people book
    enabled: enabled && !!date,
  });
}
