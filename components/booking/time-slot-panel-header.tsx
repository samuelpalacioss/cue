import { CalendarDate } from '@internationalized/date';
import { formatCalendarDate } from '@/src/utils/booking/date-utils';

interface TimeSlotPanelHeaderProps {
    selectedDate: CalendarDate;
}

export default function TimeSlotPanelHeader({ selectedDate }: TimeSlotPanelHeaderProps) {
    const formattedDate = formatCalendarDate(selectedDate);
    const day = formattedDate.split(" ")[0];
    const date = formattedDate.split(" ")[1];

    return (
        <div className="mb-4 flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{day}</h3>
            <span className="text-md text-zinc-300">{date}</span>
            {/* <TimeFormatToggle value={timeFormat} onChange={setTimeFormat} /> */}
        </div>
    );
}

