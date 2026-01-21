import { and, eq, gte, lte, or, sql } from 'drizzle-orm';
import db from '@/src/db';
import {
  availabilitySchedules,
  bookings,
  clients,
  durations,
  eventOptions,
  events,
  organizations,
  users,
  type AvailabilitySchedule,
  type Booking,
  type Client,
  type Duration,
  type Event,
  type EventOption,
  type Organization,
  type User,
} from '@/src/db/schema';

/**
 * Find user by username
 */
export async function findUserByUsername(username: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return result[0];
}

/**
 * Find event by username and URL slug
 * Returns event with joined user/client/organization data
 */
export async function findEventByUsernameAndSlug(
  username: string,
  slug: string
): Promise<
  | (Event & {
      user: (User & { client: Client }) | null;
      organization: Organization | null;
    })
  | undefined
> {
  // First find user by username
  const user = await findUserByUsername(username);
  if (!user) {
    return undefined;
  }

  // Then find event where (userId = user.id OR organizationId = user.organizationId) AND urlSlug = slug
  const whereConditions = [];

  // Add userId condition
  whereConditions.push(eq(events.userId, user.id));

  // Add organizationId condition if user belongs to an organization
  if (user.organizationId) {
    whereConditions.push(eq(events.organizationId, user.organizationId));
  }

  // Query event with joins
  const result = await db
    .select({
      event: events,
      user: users,
      client: clients,
      organization: organizations,
    })
    .from(events)
    .leftJoin(users, eq(events.userId, users.id))
    .leftJoin(clients, eq(users.clientId, clients.id))
    .leftJoin(organizations, eq(events.organizationId, organizations.id))
    .where(and(eq(events.urlSlug, slug), or(...whereConditions)))
    .limit(1);

  if (!result[0]) {
    return undefined;
  }

  const { event, user: eventUser, client, organization } = result[0];

  return {
    ...event,
    user: eventUser && client ? { ...eventUser, client } : null,
    organization,
  };
}

/**
 * Find event options for an event with duration information
 */
export async function findEventOptions(
  eventId: string
): Promise<Array<EventOption & { duration: Duration | null }>> {
  const result = await db
    .select({
      eventOption: eventOptions,
      duration: durations,
    })
    .from(eventOptions)
    .leftJoin(durations, eq(eventOptions.durationId, durations.id))
    .where(eq(eventOptions.eventId, eventId));

  return result.map(({ eventOption, duration }) => ({
    ...eventOption,
    duration,
  }));
}

/**
 * Find availability schedules for an event
 * Includes both event-specific and global schedules
 */
export async function findAvailabilitySchedules(
  eventId: string,
  userId?: number | null,
  organizationId?: number | null
): Promise<AvailabilitySchedule[]> {
  const conditions = [];

  // Event-specific schedules
  conditions.push(eq(availabilitySchedules.eventId, eventId));

  // Global schedules for user
  if (userId) {
    conditions.push(
      and(
        eq(availabilitySchedules.userId, userId),
        sql`${availabilitySchedules.eventId} IS NULL`
      )
    );
  }

  // Global schedules for organization
  if (organizationId) {
    conditions.push(
      and(
        eq(availabilitySchedules.organizationId, organizationId),
        sql`${availabilitySchedules.eventId} IS NULL`
      )
    );
  }

  const result = await db
    .select()
    .from(availabilitySchedules)
    .where(and(eq(availabilitySchedules.isActive, true), or(...conditions)));

  return result;
}

/**
 * Find bookings for a specific date and event option
 */
export async function findBookingsForDate(
  eventOptionId: number,
  date: string
): Promise<Booking[]> {
  const result = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.eventOptionId, eventOptionId),
        eq(bookings.date, date),
        // Only count confirmed or pending bookings
        or(eq(bookings.status, 'confirmed'), eq(bookings.status, 'pending'))
      )
    );

  return result;
}

/**
 * Find bookings for a date range and event option
 */
export async function findBookingsForDateRange(
  eventOptionId: number,
  startDate: string,
  endDate: string
): Promise<Booking[]> {
  const result = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.eventOptionId, eventOptionId),
        gte(bookings.date, startDate),
        lte(bookings.date, endDate),
        // Only count confirmed or pending bookings
        or(eq(bookings.status, 'confirmed'), eq(bookings.status, 'pending'))
      )
    );

  return result;
}
