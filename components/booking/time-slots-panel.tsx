import { CalendarDate } from '@internationalized/date';
import TimeSlotPanelHeader from "./time-slot-panel-header";

interface TimeSlotPanelProps {
    selectedDate: CalendarDate;
    children: React.ReactNode;
}

export default function TimeSlotPanel({ selectedDate, children }: TimeSlotPanelProps) {
    return (
        <div className="border-t border-zinc-800 bg-transparent p-6 md:rounded-r-lg md:border-t-0 md:bg-zinc-900">
            <TimeSlotPanelHeader selectedDate={selectedDate} />

            <div className="max-h-96 space-y-2 overflow-y-auto">
                {children}
            </div>
        </div>
    )
}