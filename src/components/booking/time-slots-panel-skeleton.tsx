import { Skeleton } from "@/src/components/ui/skeleton";

const SKELETON_TIME_SLOTS = Array.from({ length: 5 }).map((_, index) => (
  <Skeleton key={index} className="h-[38px] w-full rounded-lg" />
));

export default function TimeSlotsPanelSkeleton() {
  return (
    <div className="border-t border-zinc-800 bg-cue-off-white p-5 md:rounded-r-lg md:border-t-0 md:bg-cue-off-white">
      {/* Header matching TimeSlotPanelHeader: date left, time format toggle right */}
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-7 w-14" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto">{SKELETON_TIME_SLOTS}</div>
    </div>
  );
}
