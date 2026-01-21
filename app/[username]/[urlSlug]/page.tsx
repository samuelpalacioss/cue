import { notFound } from 'next/navigation';
import { getEventData } from '@/src/utils/availability';

type PageProps = {
  params: Promise<{
    username: string;
    urlSlug: string;
  }>;
  searchParams: Promise<{
    duration?: string;
    layout?: string;
    month?: string;
    date?: string;
    slot?: string;
  }>;
};

export default async function BookingPage({ params }: PageProps) {
  // Extract username and urlSlug from route params
  const { username, urlSlug } = await params;

  // Fetch initial event data server-side
  const eventData = await getEventData(username, urlSlug);

  // Return 404 if event not found
  if (!eventData) {
    notFound();
  }

  // TODO: Pass to client component wrapper in Phase 4
  // For now, display basic event information
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{eventData.title}</h1>
        <div className="space-y-2">
          <p className="text-gray-600">Event ID: {eventData.id}</p>
          <p className="text-gray-600">Slug: {eventData.slug}</p>
          <p className="text-gray-600">
            Owners: {eventData.owners.map((o) => o.name).join(', ')}
          </p>
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Available Options:</h2>
            <ul className="list-disc list-inside">
              {eventData.eventOptions.map((option) => (
                <li key={option.id}>
                  {option.durationMinutes} minutes
                  {option.id === eventData.defaultOptionId && ' (default)'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
