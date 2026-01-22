import { CalendarDate } from "@internationalized/date";
import CalendarPanel from "./calendar-panel";
import CalendarPanelSkeleton from "./calendar-panel-skeleton";
import EventInfoPanel from "./event-info-panel";
import TimeSlotsPanel from "./time-slots-panel";
import TimeSlotList from "./time-slot-list";
import { EventData, TimeSlot } from "@/src/types/schema";

interface BookingCardProps {
    event: EventData;
    selectedDate: CalendarDate;
    focusedDate: CalendarDate;
    timezone: string;
    availableDates?: Set<string>;
    availabilityCount?: Map<string, number>;
    timeSlots?: TimeSlot[];
    selectedSlotTime?: string;
    isLoadingAvailability?: boolean;
    isLoadingSlots?: boolean;
    onDateChange: (date: CalendarDate) => void;
    onTimezoneChange: (tz: string) => void;
    onMonthChange?: (year: number, month: number) => void;
    onSlotSelect?: (slot: TimeSlot | undefined) => void;
}

export default function BookingCard({
    event,
    selectedDate,
    focusedDate,
    timezone,
    availableDates = new Set(),
    availabilityCount = new Map(),
    timeSlots = [],
    selectedSlotTime,
    isLoadingAvailability = false,
    isLoadingSlots = false,
    onDateChange,
    onTimezoneChange,
    onMonthChange,
    onSlotSelect,
}: BookingCardProps) {
    return (
        <div>
            <div className="min-h-screen bg-zinc-950">
                <div className="mx-auto max-w-7xl">
                    {/* Mobile: Stack vertically in unified card */}
                    {/* Tablet (md): Two columns - info+calendar, slots below */}
                    {/* Desktop (lg): Three columns - narrower left, wider calendar, narrow time slots */}
                    <div className="md:rounded-lg bg-zinc-900 md:bg-transparent">
                        <div className="flex flex-col md:grid md:grid-cols-[300px_1fr] lg:grid-cols-[280px_500px_260px]">
                            {/* Left Panel: Event Info */}
                            <EventInfoPanel
                                event={event}
                                timezone={timezone}
                                onTimezoneChange={onTimezoneChange}
                            />

                            {/* Center Panel: Calendar - Show skeleton while loading */}
                            {isLoadingAvailability ? (
                                <CalendarPanelSkeleton
                                    locale="es-ES"
                                    year={focusedDate.year}
                                    month={focusedDate.month}
                                />
                            ) : (
                                <CalendarPanel
                                    selectedDate={selectedDate}
                                    focusedDate={focusedDate}
                                    onDateChange={onDateChange}
                                    availableDates={availableDates}
                                    availabilityCount={availabilityCount}
                                    showAvailabilityDots={true}
                                    locale="es-ES"
                                    onVisibleMonthChange={onMonthChange}
                                />
                            )}

                            {/* Right Panel: Time Slots */}
                            <TimeSlotsPanel selectedDate={selectedDate}>
                                <TimeSlotList
                                    slots={timeSlots}
                                    selectedSlotTime={selectedSlotTime}
                                    onSlotSelect={onSlotSelect}
                                />
                            </TimeSlotsPanel>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}