import { Skeleton } from "@/components/ui/skeleton"

// **OPTIMIZATION (Rule 6.3): Hoist static JSX to module level**
// These skeleton elements don't change, so we create them once and reuse
const WEEKDAY_SKELETONS = Array.from({ length: 7 }).map((_, i) => (
    <div key={i} className="pb-2 text-center">
        <Skeleton className="mx-auto h-4 w-8" />
    </div>
))

const DATE_CELL_SKELETONS = Array.from({ length: 35 }).map((_, i) => (
    <Skeleton
        key={i}
        className="h-13 w-13 md:h-14 md:w-14 rounded-lg"
    />
))

export default function CalendarPanelSkeleton() {
    return (
        <div className="bg-transparent p-5 md:border-r md:border-zinc-800 md:bg-zinc-900 md:p-6">
            {/* Header skeleton */}
            <header className="-mx-5 mb-4 flex items-center justify-between border-b border-t border-zinc-800 px-5 py-4 md:mx-0 md:border-0 md:px-0 md:py-0">
                {/* Previous button skeleton */}
                <Skeleton className="h-10 w-10 rounded-md" />

                {/* Month and year skeleton */}
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                </div>

                {/* Next button skeleton */}
                <Skeleton className="h-10 w-10 rounded-md" />
            </header>

            <div className="h-[384px]">
                {/* Calendar grid skeleton */}
                <div className="w-full border-separate border-spacing-0.5 md:border-spacing-1">
                    {/* Weekday headers skeleton */}
                    <div className="grid grid-cols-7 gap-0.5 md:gap-1">
                        {WEEKDAY_SKELETONS}
                    </div>

                    {/* Date cells skeleton */}
                    <div className="mt-2 grid grid-cols-7 gap-0.5 md:gap-1">
                        {DATE_CELL_SKELETONS}
                    </div>
                </div>
            </div>
        </div>
    )
}
