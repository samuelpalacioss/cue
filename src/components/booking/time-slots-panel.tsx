import { CalendarDate } from "@internationalized/date";
import TimeSlotPanelHeader from "./time-slot-panel-header";
import { TimeFormat } from "@/src/utils/booking/date-utils";

interface TimeSlotPanelProps {
  selectedDate: CalendarDate;
  children: React.ReactNode;
  timeFormat: TimeFormat;
  setTimeFormat: (timeFormat: TimeFormat) => void;
}

export default function TimeSlotPanel({
  selectedDate,
  children,
  timeFormat,
  setTimeFormat,
}: TimeSlotPanelProps) {
  return (
    <div className="border-t border-zinc-800 bg-cue-off-white p-5 md:rounded-r-lg md:border-t-0 md:bg-cue-off-white">
      <TimeSlotPanelHeader
        selectedDate={selectedDate}
        timeFormat={timeFormat}
        setTimeFormat={setTimeFormat}
      />

      <div className="max-h-96 space-y-2 overflow-y-auto">{children}</div>
    </div>
  );
}
