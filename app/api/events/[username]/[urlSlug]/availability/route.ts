import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAvailableDatesForMonth } from '@/src/utils/availability';

// Schema for route params
const paramsSchema = z.object({
  username: z.string().min(1),
  urlSlug: z.string().min(1),
});

// Schema for query parameters
const querySchema = z.object({
  year: z.string().regex(/^\d{4}$/).transform(Number),
  month: z.string().regex(/^(1[0-2]|[1-9])$/).transform(Number),
  timezone: z.string().optional().default('UTC'),
  eventOptionId: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Get available dates for a month
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
      year: searchParams.get('year') || undefined,
      month: searchParams.get('month') || undefined,
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

    const { year, month, timezone, eventOptionId } = queryResult.data;

    // Get available dates for the month
    const result = await getAvailableDatesForMonth(
      username,
      urlSlug,
      year,
      month,
      eventOptionId,
      timezone
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
