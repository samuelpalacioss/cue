import { CalendarDate } from "@internationalized/date";
import { formatCalendarDate } from "@/src/utils/booking/date-utils";
import { TimeFormat } from "@/src/utils/booking/date-utils";
import { TimeFormatToggle } from "./time-format-toggle";

interface TimeSlotPanelHeaderProps {
  selectedDate: CalendarDate;
  timeFormat: TimeFormat;
  setTimeFormat: (timeFormat: TimeFormat) => void;
}

export default function TimeSlotPanelHeader({
  selectedDate,
  timeFormat,
  setTimeFormat,
}: TimeSlotPanelHeaderProps) {
  const formattedDate = formatCalendarDate(selectedDate);
  const day = formattedDate.split(" ")[0];
  const date = formattedDate.split(" ")[1];

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-cue-deep-green capitalize">
          {day} {date}
        </span>
      </div>
      <TimeFormatToggle value={timeFormat} onChange={setTimeFormat} />
    </div>
  );
}
