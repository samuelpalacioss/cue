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
  // One query with all joins
  const result = await db
    .select({
      event: events,
      user: users,
      client: clients,
      organization: organizations,
    })
    .from(events)
    .leftJoin(users, or(
      eq(events.userId, users.id),
      and(
        sql`${events.organizationId} IS NOT NULL`,
        eq(events.organizationId, users.organizationId),
        eq(users.username, username)
      )
    ))
    .leftJoin(clients, eq(users.clientId, clients.id))
    .leftJoin(organizations, eq(events.organizationId, organizations.id))
    .where(
      and(
        eq(events.urlSlug, slug),
        or(
          and(
            sql`${events.userId} IS NOT NULL`,
            eq(users.username, username)
          ),
          and(
            sql`${events.organizationId} IS NOT NULL`,
            eq(users.username, username)
          )
        )
      )
    )
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

/**
 * Find availability schedules for a specific date
 * Priority order:
 * 1. Event-specific schedule for the specific date
 * 2. Global schedule for the specific date (user or organization)
 * 3. Event-specific recurring schedule for the day of week
 * 4. Global recurring schedule for the day of week (user or organization)
 */
export async function findAvailabilitySchedulesForDate(
  eventId: string,
  date: string,
  userId?: number | null,
  organizationId?: number | null
): Promise<AvailabilitySchedule[]> {
  // Calculate day of week from date
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dateObj = new Date(date + 'T00:00:00Z');
  const dayOfWeek = days[dateObj.getUTCDay()];

  // Build conditions for specific date schedules
  const specificDateConditions = [];
  specificDateConditions.push(
    and(
      eq(availabilitySchedules.eventId, eventId),
      eq(availabilitySchedules.specificDate, date)
    )
  );

  // Build conditions for user-specific schedules
  if (userId) {
    specificDateConditions.push(
      and(
        eq(availabilitySchedules.userId, userId),
        sql`${availabilitySchedules.eventId} IS NULL`,
        eq(availabilitySchedules.specificDate, date)
      )
    );
  }

  // Build conditions for organization-specific schedules
  if (organizationId) {
    specificDateConditions.push(
      and(
        eq(availabilitySchedules.organizationId, organizationId),
        sql`${availabilitySchedules.eventId} IS NULL`,
        eq(availabilitySchedules.specificDate, date)
      )
    );
  }

  // Build conditions for recurring schedules
  const recurringConditions = [];
  recurringConditions.push(
    and(
      eq(availabilitySchedules.eventId, eventId),
      sql`${availabilitySchedules.dayOfWeek} = ${dayOfWeek}`,
      sql`${availabilitySchedules.specificDate} IS NULL`
    )
  );

  if (userId) {
    recurringConditions.push(
      and(
        eq(availabilitySchedules.userId, userId),
        sql`${availabilitySchedules.eventId} IS NULL`,
        sql`${availabilitySchedules.dayOfWeek} = ${dayOfWeek}`,
        sql`${availabilitySchedules.specificDate} IS NULL`
      )
    );
  }

  if (organizationId) {
    recurringConditions.push(
      and(
        eq(availabilitySchedules.organizationId, organizationId),
        sql`${availabilitySchedules.eventId} IS NULL`,
        sql`${availabilitySchedules.dayOfWeek} = ${dayOfWeek}`,
        sql`${availabilitySchedules.specificDate} IS NULL`
      )
    );
  }

  //  Using 2 queries but being more explicit about the priority (specific date schedules first)
  const specificDateSchedules = await db
    .select()
    .from(availabilitySchedules)
    .where(and(eq(availabilitySchedules.isActive, true), or(...specificDateConditions)));

  if (specificDateSchedules.length > 0) {
    return specificDateSchedules;
  }

  const recurringSchedules = await db
    .select()
    .from(availabilitySchedules)
    .where(and(eq(availabilitySchedules.isActive, true), or(...recurringConditions)));

  return recurringSchedules;
}
