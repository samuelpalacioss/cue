import { Skeleton } from "@/components/ui/skeleton"

// **OPTIMIZATION (Rule 6.3): Hoist static JSX to module level**
// These skeleton time slot buttons don't change, so we create them once and reuse
const SKELETON_TIME_SLOTS = Array.from({ length: 4 }).map((_, index) => (
    <Skeleton
        key={index}
        className="w-full rounded-lg h-9 mb-2"
    />
))

export default function TimeSlotsPanelSkeleton() {
    return (
        <div className="border-t border-zinc-800 bg-transparent p-6 md:rounded-r-lg md:border-t-0 md:bg-zinc-900">
            {/* Header space reserved but empty */}
            <div className="mb-4 flex items-center gap-2 h-7">
                {/* Reserved space for header - no skeleton elements */}
            </div>

            <div className="max-h-96 space-y-2 overflow-y-auto">
                {SKELETON_TIME_SLOTS}
            </div>
        </div>
    )
}
