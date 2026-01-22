import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTimeSlotsForDate } from '@/src/utils/availability';

// Schema for route params
const paramsSchema = z.object({
  username: z.string().min(1),
  urlSlug: z.string().min(1),
});

// Schema for query parameters
const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().optional().default('UTC'),
  eventOptionId: z.string().regex(/^\d+$/).transform(Number).optional(),
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

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string | undefined> = {
      date: searchParams.get('date') || undefined,
      timezone: searchParams.get('timezone') || undefined,
    };

    const eventOptionIdParam = searchParams.get('eventOptionId');
    if (eventOptionIdParam) {
      queryParams.eventOptionId = eventOptionIdParam;
    }

    const queryResult = querySchema.safeParse(queryParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.message },
        { status: 400 }
      );
    }

    const { date, timezone, eventOptionId } = queryResult.data;

    // Get time slots for the date
    const slots = await getTimeSlotsForDate(
      username,
      urlSlug,
      date,
      eventOptionId,
      timezone
    );

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
