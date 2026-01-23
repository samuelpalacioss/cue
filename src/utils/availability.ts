import type { EventData, TimeSlot } from "@/src/types/schema";
import {
  findAvailabilitySchedules,
  findAvailabilitySchedulesForDate,
  findBookingsForDate,
  findBookingsForDateRange,
  findEventByUsernameAndSlug,
  findEventOptions,
} from "@/src/db/dal";

/**
 * Get today's date in UTC as a string (YYYY-MM-DD format)
 */
function getTodayDateString(): string {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today.toISOString().split("T")[0];
}

/**
 * Generate time slots array from schedule
 * @param startTime - Start time in HH:MM format (e.g., '09:00')
 * @param endTime - End time in HH:MM format (e.g., '17:00')
 * @param durationMinutes - Duration of each slot in minutes
 * @returns Array of time slot objects with start and end times
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];

  // Parse start and end times (HH:MM format)
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  // Convert to minutes from midnight
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const slotStartHour = Math.floor(currentMinutes / 60);
    const slotStartMin = currentMinutes % 60;
    const slotEndMinutes = currentMinutes + durationMinutes;
    const slotEndHour = Math.floor(slotEndMinutes / 60);
    const slotEndMin = slotEndMinutes % 60;

    slots.push({
      start: `${String(slotStartHour).padStart(2, "0")}:${String(slotStartMin).padStart(2, "0")}`,
      end: `${String(slotEndHour).padStart(2, "0")}:${String(slotEndMin).padStart(2, "0")}`,
    });

    currentMinutes += durationMinutes;
  }

  return slots;
}

/**
 * Fetch and transform event data to EventData type
 */
export async function getEventData(username: string, slug: string): Promise<EventData | null> {
  const event = await findEventByUsernameAndSlug(username, slug);
  if (!event) return null;

  // Get all event options
  const options = await findEventOptions(event.id);
  if (options.length === 0) {
    throw new Error("Event has no options configured");
  }

  // Transform options to EventOption format
  const eventOptions = options.map((opt) => ({
    id: opt.id,
    durationMinutes: opt.duration?.durationMinutes ?? 30,
    capacity: opt.capacity,
  }));

  // Find default option
  const defaultOption = options.find((opt) => opt.isDefault);
  if (!defaultOption) {
    throw new Error("Event has no default option configured");
  }
  const defaultOptionId = defaultOption.id;

  // Build owners array
  const owners: Array<{ name: string; avatarUrl?: string; role?: string }> = [];

  if (event.user && event.user.client) {
    owners.push({
      name: `${event.user.client.firstName} ${event.user.client.lastName}`,
      role: event.user.role === "admin" ? "Administrator" : "User",
    });
  }

  if (event.organization) {
    owners.push({
      name: event.organization.name,
      role: "Organization",
    });
  }

  return {
    id: event.id,
    slug: event.urlSlug,
    title: event.title,
    defaultOptionId,
    meetingType: "google_meet", // Hardcoded for MVP
    requiresConfirmation: false, // Hardcoded for MVP
    owners,
    eventOptions,
  };
}

/**
 * Get available dates for a month with slot counts
 */
export async function getAvailableDatesForMonth(
  username: string,
  slug: string,
  year: number,
  month: number,
  eventOptionId?: number,
  timezone: string = "UTC",
): Promise<{
  availableDates: string[];
  availabilityCount: Record<string, number>;
}> {
  const event = await findEventByUsernameAndSlug(username, slug);
  if (!event) {
    return { availableDates: [], availabilityCount: {} };
  }

  // Get event options
  const options = await findEventOptions(event.id);
  if (options.length === 0) {
    return { availableDates: [], availabilityCount: {} };
  }

  // Find the selected option or use default
  let selectedOption = options.find((opt) => opt.id === eventOptionId);
  if (!selectedOption) {
    selectedOption = options.find((opt) => opt.isDefault) ?? options[0];
  }

  const durationMinutes = selectedOption.duration?.durationMinutes ?? 30;

  // Calculate first and last day of month
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));

  // Get today's date for filtering past dates
  const todayStr = getTodayDateString();

  // Get all bookings for the month
  const startDateStr = firstDay.toISOString().split("T")[0];
  const endDateStr = lastDay.toISOString().split("T")[0];
  const bookings = await findBookingsForDateRange(selectedOption.id, startDateStr, endDateStr);

  // Optimization #5: Fetch ALL schedules for this event once (instead of per-day in loop)
  // Reduces 56-62 queries to 1 query
  const allSchedules = await findAvailabilitySchedules(
    event.id,
    event.userId,
    event.organizationId,
  );

  // Helper function to filter schedules for a specific date
  // Replicates the logic from findAvailabilitySchedulesForDate but in-memory
  function getSchedulesForDate(date: string, schedules: typeof allSchedules): typeof allSchedules {
    const dateObj = new Date(date + "T00:00:00Z");
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayOfWeek = days[dateObj.getUTCDay()];

    // Priority 1: Specific date schedules
    const specificDateSchedules = schedules.filter((s) => s.specificDate === date);
    if (specificDateSchedules.length > 0) return specificDateSchedules;

    // Priority 2: Recurring schedules for this day of week
    return schedules.filter((s) => s.dayOfWeek === dayOfWeek && s.specificDate === null);
  }

  // Optimization #7: Group bookings by date AND time slot in a single pass
  // This is more efficient than the original guide's Optimization #1 + #2
  const bookingsByDateAndSlot = new Map<string, Map<string, number>>();
  for (const booking of bookings) {
    // Get or create the date-level map
    if (!bookingsByDateAndSlot.has(booking.date)) {
      bookingsByDateAndSlot.set(booking.date, new Map());
    }
    const slotMap = bookingsByDateAndSlot.get(booking.date)!;

    // Increment the count for this specific slot
    slotMap.set(booking.timeSlot, (slotMap.get(booking.timeSlot) || 0) + 1);
  }

  const availabilityCount: Record<string, number> = {};

  // Optimization #3: Cache for slot generation - prevents regenerating identical time slots
  const scheduleCache = new Map<string, Array<{ start: string; end: string }>>();

  function getSlotsForSchedules(
    schedules: typeof allSchedules,
    durationMinutes: number,
  ): Array<{ start: string; end: string }> {
    // Create cache key from schedule times
    const key =
      schedules
        .map((s) => `${s.startTime}-${s.endTime}`)
        .sort()
        .join("|") + `|${durationMinutes}`;

    if (!scheduleCache.has(key)) {
      const slots: Array<{ start: string; end: string }> = [];
      for (const schedule of schedules) {
        slots.push(...generateTimeSlots(schedule.startTime, schedule.endTime, durationMinutes));
      }
      scheduleCache.set(key, slots);
    }

    return scheduleCache.get(key)!;
  }

  // Iterate through each day in the month
  for (let day = 1; day <= lastDay.getUTCDate(); day++) {
    const currentDate = new Date(Date.UTC(year, month - 1, day));
    const dateStr = currentDate.toISOString().split("T")[0];

    // Skip past dates
    if (dateStr < todayStr) continue;

    // Find schedules for this specific date (handles both specific date and recurring schedules)
    const daySchedules = getSchedulesForDate(dateStr, allSchedules);

    if (daySchedules.length === 0) continue;

    // Generate slots for this day from all applicable schedules (uses cache from Optimization #3)
    const allSlots = getSlotsForSchedules(daySchedules, durationMinutes);

    // Optimization #6: Deduplicate slots by start time (same logic as getTimeSlotsForDate:285)
    // Fixes bug where overlapping schedules cause incorrect slot counts
    const uniqueSlotsMap = new Map<string, { start: string; end: string }>();
    for (const slot of allSlots) {
      uniqueSlotsMap.set(slot.start, slot);
    }
    const uniqueSlots = Array.from(uniqueSlotsMap.values());
    const totalSlots = uniqueSlots.length;

    // Get the slot-level booking counts for this date (O(1) lookup)
    const bookingsPerSlot = bookingsByDateAndSlot.get(dateStr) || new Map();

    // Count fully booked slots (O(unique slots))
    let bookedSlots = 0;
    for (const slot of uniqueSlots) {
      const bookingCount = bookingsPerSlot.get(slot.start) || 0;
      if (bookingCount >= selectedOption.capacity) {
        bookedSlots++;
      }
    }

    const availableSlots = totalSlots - bookedSlots;

    if (availableSlots > 0) {
      availabilityCount[dateStr] = availableSlots;
    }
  }

  const availableDates = Object.keys(availabilityCount).sort();

  return {
    availableDates,
    availabilityCount,
  };
}

/**
 * Get time slots for a date range (max 31 days)
 * Returns slots grouped by date for efficient batch fetching
 */
export async function getTimeSlotsForDateRange(
  username: string,
  slug: string,
  startDate: string,
  endDate: string,
  eventOptionId?: number,
  timezone: string = "UTC",
): Promise<Record<string, TimeSlot[]>> {
  // Validate date range
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date format");
  }

  if (start > end) {
    throw new Error("Start date must be before or equal to end date");
  }

  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 31) {
    throw new Error("Date range cannot exceed 31 days");
  }

  // Get today's date for filtering past dates
  const todayStr = getTodayDateString();

  const event = await findEventByUsernameAndSlug(username, slug);
  if (!event) return {};

  // Get event options
  const options = await findEventOptions(event.id);
  if (options.length === 0) return {};

  // Find the selected option or use default
  let selectedOption = options.find((opt) => opt.id === eventOptionId);
  if (!selectedOption) {
    selectedOption = options.find((opt) => opt.isDefault) ?? options[0];
  }

  const durationMinutes = selectedOption.duration?.durationMinutes ?? 30;

  // Fetch all bookings for the date range (single query)
  const bookings = await findBookingsForDateRange(selectedOption.id, startDate, endDate);

  // Fetch all availability schedules for this event once (single query)
  const allSchedules = await findAvailabilitySchedules(
    event.id,
    event.userId,
    event.organizationId,
  );

  // Get source timezone from first schedule (all schedules for the event should have the same timezone)
  const sourceTimezone = allSchedules[0]?.timezone || "UTC";

  // Helper function to filter schedules for a specific date (same as getAvailableDatesForMonth)
  // E.g: Only on Feb 21, 2026, the schedule is specific to that date, so we return the specific date schedules,
  // otherwise we return the recurring schedules for the day of week.
  function getSchedulesForDate(date: string, schedules: typeof allSchedules): typeof allSchedules {
    const dateObj = new Date(date + "T00:00:00Z");
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayOfWeek = days[dateObj.getUTCDay()];

    // Priority 1: Specific date schedules
    const specificDateSchedules = schedules.filter((s) => s.specificDate === date);
    if (specificDateSchedules.length > 0) return specificDateSchedules;

    // Priority 2: Recurring schedules for this day of week
    return schedules.filter((s) => s.dayOfWeek === dayOfWeek && s.specificDate === null);
  }

  // Group bookings by date AND time slot (same optimization as getAvailableDatesForMonth)
  // Create a nested Map: date -> time slot -> booking count
  const bookingsByDateAndSlot = new Map<string, Map<string, number>>();
  for (const booking of bookings) {
    if (!bookingsByDateAndSlot.has(booking.date)) {
      bookingsByDateAndSlot.set(booking.date, new Map());
    }
    const slotMap = bookingsByDateAndSlot.get(booking.date)!;
    slotMap.set(booking.timeSlot, (slotMap.get(booking.timeSlot) || 0) + 1);
  }

  // Cache for slot generation (same optimization as getAvailableDatesForMonth)
  const scheduleCache = new Map<string, Array<{ start: string; end: string }>>();

  // Generate time slots for a list of schedules
  function getSlotsForSchedules(
    schedules: typeof allSchedules,
    durationMinutes: number,
  ): Array<{ start: string; end: string }> {
    const key =
      schedules
        .map((s) => `${s.startTime}-${s.endTime}`)
        .sort()
        .join("|") + `|${durationMinutes}`;

    if (!scheduleCache.has(key)) {
      const slots: Array<{ start: string; end: string }> = [];
      for (const schedule of schedules) {
        slots.push(...generateTimeSlots(schedule.startTime, schedule.endTime, durationMinutes));
      }
      scheduleCache.set(key, slots);
    }

    return scheduleCache.get(key)!;
  }

  // Build result map by iterating through each date in range
  const result: Record<string, TimeSlot[]> = {};

  let currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0]; // Gets current date in YYYY-MM-DD format

    // Skip past dates
    if (dateStr >= todayStr) {
      // 1. Find schedules for this specific date (handles both specific date and recurring schedules)
      const daySchedules = getSchedulesForDate(dateStr, allSchedules);

      if (daySchedules.length > 0) {
        // 2. Generate slots for this day (uses cache)
        const allSlots = getSlotsForSchedules(daySchedules, durationMinutes);

        // 3. Deduplicate slots by start time (same logic as getAvailableDatesForMonth)
        const uniqueSlotsMap = new Map<string, { start: string; end: string }>();
        for (const slot of allSlots) {
          uniqueSlotsMap.set(slot.start, slot);
        }
        const uniqueSlots = Array.from(uniqueSlotsMap.values());

        // 4. Get booking counts for this date
        const bookingsPerSlot = bookingsByDateAndSlot.get(dateStr) || new Map();

        // 5. Build TimeSlot array with availability info
        const timeSlots: TimeSlot[] = uniqueSlots.map((slot) => {
          const bookingCount = bookingsPerSlot.get(slot.start) || 0;
          const available = bookingCount < selectedOption.capacity;

          return {
            startTime: slot.start,
            endTime: slot.end,
            available, // Indicates if the capacity of the slot has not been reached (true) or reached (false)
            sourceTimezone,
          };
        });

        // 6. Sort by start time
        result[dateStr] = timeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      }
    }

    // 7. Move to next day, until we reach the end date
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  // Return the result map: date -> time slots
  return result;
}

/**
 * Get time slots for a specific date
 */
export async function getTimeSlotsForDate(
  username: string,
  slug: string,
  date: string,
  eventOptionId?: number,
  timezone: string = "UTC",
): Promise<TimeSlot[]> {
  // Don't return time slots for past dates
  const todayStr = getTodayDateString();
  if (date < todayStr) return [];

  const event = await findEventByUsernameAndSlug(username, slug);
  if (!event) return [];

  // Get event options
  const options = await findEventOptions(event.id);
  if (options.length === 0) return [];

  // Find the selected option or use default
  let selectedOption = options.find((opt) => opt.id === eventOptionId);
  if (!selectedOption) {
    selectedOption = options.find((opt) => opt.isDefault) ?? options[0];
  }

  const durationMinutes = selectedOption.duration?.durationMinutes ?? 30;

  // Get availability schedules for this specific date (handles both specific date and recurring schedules)
  const daySchedules = await findAvailabilitySchedulesForDate(
    event.id,
    date,
    event.userId,
    event.organizationId,
  );

  if (daySchedules.length === 0) return [];

  // Get the source timezone from the first schedule (all schedules for a user/org should have the same timezone)
  const sourceTimezone = daySchedules[0].timezone || "UTC";

  // Generate time slots
  const allSlots: Array<{ start: string; end: string }> = [];
  for (const schedule of daySchedules) {
    const slots = generateTimeSlots(schedule.startTime, schedule.endTime, durationMinutes);
    allSlots.push(...slots);
  }

  // Get bookings for this date
  const bookings = await findBookingsForDate(selectedOption.id, date);

  // Optimization #4: Group bookings by time slot (O(bookings))
  const bookingsPerSlot = new Map<string, number>();
  for (const booking of bookings) {
    bookingsPerSlot.set(booking.timeSlot, (bookingsPerSlot.get(booking.timeSlot) || 0) + 1);
  }

  // Mark slots as available/unavailable
  const timeSlots: TimeSlot[] = allSlots.map((slot) => {
    const bookingCount = bookingsPerSlot.get(slot.start) || 0;
    const available = bookingCount < selectedOption.capacity;

    return {
      startTime: slot.start,
      endTime: slot.end,
      available,
      sourceTimezone,
    };
  });

  // Remove duplicate slots and sort by start time
  const uniqueSlots = Array.from(new Map(timeSlots.map((slot) => [slot.startTime, slot])).values());

  return uniqueSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
}
