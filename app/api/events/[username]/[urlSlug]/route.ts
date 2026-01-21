import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEventData } from '@/src/utils/availability';

// Schema for route params
const paramsSchema = z.object({
  username: z.string().min(1),
  urlSlug: z.string().min(1),
});

// Get event data
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
        { error: 'Invalid parameters', details: paramsResult.error.message },
        { status: 400 }
      );
    }

    const { username, urlSlug } = paramsResult.data;

    // Fetch event data using business logic function
    const event = await getEventData(username, urlSlug);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error fetching event data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
