import type { BookingWithPerson } from "@/src/types/schema";
import { formatTime } from "@/src/utils/calendar/booking-grid";

interface WeekBookingItemProps {
  booking: BookingWithPerson;
  date: string;
  rowStart: number;
  rowSpan: number;
  heightRem: number;
  colStart: number;
}

// Map column number to Tailwind class
const colStartClasses = [
  "", // 0 - not used
  "sm:col-start-1",
  "sm:col-start-2",
  "sm:col-start-3",
  "sm:col-start-4",
  "sm:col-start-5",
  "sm:col-start-6",
  "sm:col-start-7",
];

export default function WeekBookingItem({
  booking,
  date,
  rowStart,
  rowSpan,
  heightRem,
  colStart,
}: WeekBookingItemProps) {
  // Determine color based on booking status
  const colorClass =
    booking.status === "confirmed"
      ? "bg-teal-500/30 hover:bg-teal-500/40 text-teal-900"
      : booking.status === "pending"
        ? "bg-yellow-300/40 hover:bg-yellow-300/50 text-yellow-900"
        : booking.status === "cancelled"
          ? "bg-red-300 hover:bg-red-400 text-gray-900"
          : "bg-gray-300 hover:bg-gray-400 text-gray-900";

  const personName = booking.person
    ? `${booking.person.firstName} ${booking.person.lastName}`
    : "Desconocido";

  return (
    <li
      style={{
        gridRow: `${rowStart} / span ${rowSpan}`,
      }}
      className={`relative flex ${colStartClasses[colStart]}`}
    >
      <div style={{ height: `${heightRem}rem` }} className="relative w-full mx-0.5">
        <a
          href={`/dashboard/bookings/${booking.id}`}
          className={`group absolute inset-0 flex flex-col overflow-y-auto rounded-lg p-2 text-xs/5 ${colorClass}`}
        >
          <p className="order-1 font-semibold">{personName}</p>
          <p className="group-hover:opacity-80">
            <time dateTime={`${date}T${booking.timeSlot}`}>{formatTime(booking.timeSlot)}</time>
          </p>
        </a>
      </div>
    </li>
  );
}
