import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTimeSlotsForDate, getTimeSlotsForDateRange } from '@/src/utils/availability';

// Schema for route params
const paramsSchema = z.object({
  username: z.string().min(1),
  urlSlug: z.string().min(1),
});

// Schema for single date query
const singleDateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().optional().default('UTC'),
  eventOptionId: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Schema for date range query
const dateRangeQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().optional().default('UTC'),
  eventOptionId: z.string().regex(/^\d+$/).transform(Number).optional(),
}).refine((data) => data.startDate <= data.endDate, {
  message: 'startDate must be before or equal to endDate',
});

// Get time slots for a date
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; urlSlug: string }> }
) {
  try {
    // Await params in Next.js 15+
    const resolvedParams = await params;

    // Validate route parameters
    const paramsResult = paramsSchema.safeParse(resolvedParams);

    if (!paramsResult.success) {
      return NextResponse.json(
        { error: 'Invalid route parameters', details: paramsResult.error.message },
        { status: 400 }
      );
    }

    const { username, urlSlug } = paramsResult.data;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const hasDate = searchParams.has('date');
    const hasStartDate = searchParams.has('startDate');
    const hasEndDate = searchParams.has('endDate');

    // Validate that either date OR range is provided, not both
    if (hasDate && (hasStartDate || hasEndDate)) {
      return NextResponse.json(
        { error: 'Cannot specify both date and date range (startDate/endDate)' },
        { status: 400 }
      );
    }

    if (!hasDate && (!hasStartDate || !hasEndDate)) {
      return NextResponse.json(
        { error: 'Must specify either date or both startDate and endDate' },
        { status: 400 }
      );
    }

    // Build query params object
    const queryParams: Record<string, string | undefined> = {
      timezone: searchParams.get('timezone') || undefined,
    };

    const eventOptionIdParam = searchParams.get('eventOptionId');
    if (eventOptionIdParam) {
      queryParams.eventOptionId = eventOptionIdParam;
    }

    // Branch based on query type
    if (hasDate) {
      // Single date query (existing behavior)
      const singleDateResult = singleDateQuerySchema.safeParse({
        ...queryParams,
        date: searchParams.get('date') || undefined,
      });

      if (!singleDateResult.success) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: singleDateResult.error.message },
          { status: 400 }
        );
      }

      const { date, timezone, eventOptionId } = singleDateResult.data;

      // Get time slots for the date
      const slots = await getTimeSlotsForDate(
        username,
        urlSlug,
        date,
        eventOptionId,
        timezone
      );

      return NextResponse.json({ slots });
    } else {
      // Date range query (new behavior)
      const dateRangeResult = dateRangeQuerySchema.safeParse({
        ...queryParams,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
      });

      if (!dateRangeResult.success) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: dateRangeResult.error.message },
          { status: 400 }
        );
      }

      const { startDate, endDate, timezone, eventOptionId } = dateRangeResult.data;

      // Get time slots for the date range
      const slotsByDate = await getTimeSlotsForDateRange(
        username,
        urlSlug,
        startDate,
        endDate,
        eventOptionId,
        timezone
      );

      return NextResponse.json({ slotsByDate });
    }
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
