import { Skeleton } from "@/src/components/ui/skeleton";
import { getLocalTimeZone, today } from "@internationalized/date";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// 5 rows × 7 columns = 35 cells to mimic the calendar grid
const SKELETON_CELL_COUNT = 35;

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
    <div className="bg-cue-off-white p-5 md:border-r md:border-gray-200 md:bg-cue-off-white md:p-6">
      {/* Header with actual heading, skeleton buttons */}
      <header className="-mx-5 mb-4 flex items-center justify-between border-b border-t border-gray-200 px-5 py-4 md:mx-0 md:border-0 md:px-0 md:py-0">
        <h2 className="text-lg font-bold text-cue-deep-green capitalize">
          {monthName} {year}
        </h2>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </header>

      <div className="h-[430px]">
        {/* Day headers */}
        <div className="grid w-full grid-cols-7">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={`header-${i}`}
              className="pb-5 text-center text-sm font-semibold text-cue-deep-green"
            >
              {label}
            </div>
          ))}
        </div>
        {/* Calendar grid skeleton - 7 columns to match calendar day layout */}
        <div className="grid w-full grid-cols-7 gap-1">
          {/* Calendar cells - 5 rows of 7 */}
          {Array.from({ length: SKELETON_CELL_COUNT }).map((_, i) => (
            <Skeleton
              key={i}
              className="aspect-square min-h-13 w-full rounded-sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
