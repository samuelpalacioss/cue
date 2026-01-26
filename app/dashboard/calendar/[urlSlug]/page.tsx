import { notFound } from 'next/navigation';
import { getEventData } from '@/src/utils/availability';
import DashboardCalendarClient from './dashboard-calendar-client';

type PageProps = {
  params: Promise<{
    urlSlug: string;
  }>;
  searchParams: Promise<{
    username?: string; // TODO: Replace with session.user.username
  }>;
};

export default async function DashboardCalendarPage({ params, searchParams }: PageProps) {
  // Extract urlSlug from route params
  const { urlSlug } = await params;

  // Extract username from search params
  // TODO: Replace with session.user.username from authentication
  const { username } = await searchParams;

  if (!username) {
    // TODO: Once auth is implemented, this should redirect to login
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">Username is required. Add ?username=yourname to the URL</p>
      </div>
    );
  }

  // Fetch initial event data server-side
  const eventData = await getEventData(username, urlSlug);

  // Return 404 if event not found
  if (!eventData) {
    notFound();
  }

  return (
    <DashboardCalendarClient
      eventData={eventData}
      username={username}
      urlSlug={urlSlug}
    />
  );
}
