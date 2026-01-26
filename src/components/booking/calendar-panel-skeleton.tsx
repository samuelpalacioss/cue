import { Skeleton } from "@/src/components/ui/skeleton";
import { getLocalTimeZone, today } from "@internationalized/date";
import { Button } from "../ui/button";

// **OPTIMIZATION (Rule 6.3): Hoist static JSX to module level**
// These skeleton elements don't change, so we create them once and reuse
// Spanish weekday abbreviations matching calendar-panel.tsx
const WEEKDAY_LABELS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

const WEEKDAY_HEADERS = WEEKDAY_LABELS.map((label, i) => (
  <th key={i} className="pb-2 text-center text-sm font-medium uppercase text-zinc-400 font-normal">
    {label}
  </th>
));

// Create 5 rows of 7 cells each to mimic the calendar grid
const SKELETON_ROWS = Array.from({ length: 5 }).map((_, rowIndex) => (
  <tr key={rowIndex}>
    {Array.from({ length: 7 }).map((_, colIndex) => (
      <td key={colIndex}>
        <Skeleton className="h-13 w-13 md:h-14 md:w-14 rounded-lg" />
      </td>
    ))}
  </tr>
));

export default function CalendarPanelSkeleton({
  locale = "es-ES",
  year: targetYear,
  month: targetMonth,
}: {
  locale?: string;
  year?: number;
  month?: number;
}) {
  // Use provided year/month or fall back to current date
  const currentDate =
    targetYear && targetMonth
      ? new Date(targetYear, targetMonth - 1, 15)
      : today(getLocalTimeZone()).toDate(getLocalTimeZone());

  const monthName = currentDate.toLocaleDateString(locale, {
    month: "long",
  });
  const year = currentDate.toLocaleDateString(locale, {
    year: "numeric",
  });

  return (
    <div className="bg-transparent p-5 md:border-r md:border-zinc-800 md:bg-zinc-900 md:p-6">
      {/* Header with actual heading, skeleton buttons */}
      <header className="-mx-5 mb-4 flex items-center justify-between border-b border-t border-zinc-800 px-5 py-4 md:mx-0 md:border-0 md:px-0 md:py-0">
        {/* Previous button skeleton */}
        <Button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          ‹
        </Button>

        {/* Actual month and year heading */}
        <h2 className="text-lg text-white">
          <span className="font-bold">{monthName}</span>{" "}
          <span className="font-medium text-zinc-400">{year}</span>
        </h2>

        {/* Next button */}
        <Button className="flex h-10 w-10  cursor-pointer  items-center justify-center rounded-md text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          ›
        </Button>
      </header>

      <div className="h-[384px]">
        {/* Calendar grid skeleton - using table to match React Aria CalendarGrid structure */}
        <table className="w-full border-separate border-spacing-0.5 md:border-spacing-1">
          <thead>
            <tr>{WEEKDAY_HEADERS}</tr>
          </thead>
          <tbody>{SKELETON_ROWS}</tbody>
        </table>
      </div>
    </div>
  );
}
