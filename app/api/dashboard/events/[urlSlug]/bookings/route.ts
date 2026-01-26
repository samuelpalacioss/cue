import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  findEventByUsernameAndSlug,
  findBookingsWithPersonsForDateRange,
  findDefaultEventOptionId,
} from "@/src/db/dal";
import type { BookingWithPerson } from "@/src/types/schema";

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string(),
  username: z.string(), // TODO: Replace with session.user.username
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ urlSlug: string }> },
) {
  try {
    // Parse URL search params
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      timezone: searchParams.get("timezone"),
      username: searchParams.get("username"), // TODO: Replace with session.user.username
    };

    // Validate params
    const validationResult = querySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validationResult.error.format() },
        { status: 400 },
      );
    }

    const { startDate, endDate, timezone, username } = validationResult.data;
    const { urlSlug } = await params;

    // Fetch event data
    const event = await findEventByUsernameAndSlug(username, urlSlug);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get default event option ID
    const defaultOptionId = await findDefaultEventOptionId(event.id);
    if (!defaultOptionId) {
      return NextResponse.json(
        { error: "No default event option configured for this event" },
        { status: 404 },
      );
    }

    // Fetch bookings with person data for the date range
    const bookingsWithPersons = await findBookingsWithPersonsForDateRange(
      defaultOptionId,
      startDate,
      endDate,
    );

    // Transform to BookingWithPerson format and group by date
    const bookingsByDate: Record<string, BookingWithPerson[]> = {};

    for (const booking of bookingsWithPersons) {
      const bookingData: BookingWithPerson = {
        id: booking.id,
        eventOptionId: booking.eventOptionId,
        date: booking.date,
        timeSlot: booking.timeSlot,
        status: booking.status,
        person: booking.person
          ? {
              firstName: booking.person.firstName,
              lastName: booking.person.lastName,
            }
          : null,
      };

      if (!bookingsByDate[booking.date]) {
        bookingsByDate[booking.date] = [];
      }
      bookingsByDate[booking.date].push(bookingData);
    }

    return NextResponse.json({ bookingsByDate });
  } catch (error) {
    console.error("Error fetching bookings for event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
