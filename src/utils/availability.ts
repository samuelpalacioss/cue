import type { EventData, TimeSlot } from "@/src/types/schema";
import {
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

  const availabilityCount: Record<string, number> = {};

  // Iterate through each day in the month
  for (let day = 1; day <= lastDay.getUTCDate(); day++) {
    const currentDate = new Date(Date.UTC(year, month - 1, day));
    const dateStr = currentDate.toISOString().split("T")[0];

    // Skip past dates
    if (dateStr < todayStr) continue;

    // Find schedules for this specific date (handles both specific date and recurring schedules)
    const daySchedules = await findAvailabilitySchedulesForDate(
      event.id,
      dateStr,
      event.userId,
      event.organizationId,
    );

    if (daySchedules.length === 0) continue;

    // Generate slots for this day from all applicable schedules
    let totalSlots = 0;
    const allSlots: Array<{ start: string; end: string }> = [];

    for (const schedule of daySchedules) {
      const slots = generateTimeSlots(schedule.startTime, schedule.endTime, durationMinutes);
      allSlots.push(...slots);
      totalSlots += slots.length;
    }

    // Count bookings for this date
    const dayBookings = bookings.filter((booking) => booking.date === dateStr);

    // Calculate available slots
    // For each slot, check if it's booked
    let bookedSlots = 0;
    for (const slot of allSlots) {
      const slotBookings = dayBookings.filter((booking) => booking.timeSlot === slot.start);
      // If capacity > 1, we can have multiple bookings per slot
      if (slotBookings.length >= selectedOption.capacity) {
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

  // Mark slots as available/unavailable
  const timeSlots: TimeSlot[] = allSlots.map((slot) => {
    const slotBookings = bookings.filter((booking) => booking.timeSlot === slot.start);
    const available = slotBookings.length < selectedOption.capacity;

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
