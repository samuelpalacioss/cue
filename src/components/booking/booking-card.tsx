import { CalendarDate } from "@internationalized/date";
import CalendarPanel from "./calendar-panel";
import CalendarPanelSkeleton from "./calendar-panel-skeleton";
import EventInfoPanel from "./event-info-panel";
import TimeSlotsPanel from "./time-slots-panel";
import TimeSlotsPanelSkeleton from "./time-slots-panel-skeleton";
import TimeSlotList from "./time-slot-list";
import { EventData, TimeSlot } from "@/src/types/schema";
import { TimeFormat } from "@/src/utils/booking/date-utils";

interface BookingCardProps {
  event: EventData;
  selectedDate: CalendarDate;
  focusedDate: CalendarDate;
  timezone: string;
  selectedDuration: number;
  availableDates?: Set<string>;
  availabilityCount?: Map<string, number>;
  timeSlots?: TimeSlot[];
  selectedSlotTime?: string;
  isLoadingAvailability?: boolean;
  isLoadingSlots?: boolean;
  isSlotsFetched?: boolean;
  onDateChange: (date: CalendarDate) => void;
  onTimezoneChange: (tz: string) => void;
  onMonthChange?: (year: number, month: number) => void;
  onSlotSelect?: (slot: TimeSlot | undefined) => void;
  onDurationChange: (duration: number) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
}

export default function BookingCard({
  event,
  selectedDate,
  focusedDate,
  timezone,
  selectedDuration,
  availableDates = new Set(),
  availabilityCount = new Map(),
  timeSlots = [],
  selectedSlotTime,
  isLoadingAvailability = false,
  isLoadingSlots = false,
  isSlotsFetched = false,
  onDateChange,
  onTimezoneChange,
  onMonthChange,
  onSlotSelect,
  onDurationChange,
  timeFormat,
  setTimeFormat,
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
                selectedDuration={selectedDuration}
                onTimezoneChange={onTimezoneChange}
                onDurationChange={onDurationChange}
              />

              {/* Center Panel: Calendar - Show skeleton while loading */}
              {isLoadingAvailability ||
              isLoadingSlots ||
              selectedDate.month !== focusedDate.month ||
              !isSlotsFetched ? (
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

              {/* Right Panel: Time Slots - Show skeleton while loading */}
              {/* Also show skeleton if selected date's month doesn't match focused month (pending update) */}
              {/* Or if slots haven't been fetched yet (query might be disabled if no date in URL) */}
              {isLoadingAvailability ||
              isLoadingSlots ||
              selectedDate.month !== focusedDate.month ||
              !isSlotsFetched ? (
                <TimeSlotsPanelSkeleton />
              ) : (
                <TimeSlotsPanel
                  selectedDate={selectedDate}
                  timeFormat={timeFormat}
                  setTimeFormat={setTimeFormat}
                >
                  <TimeSlotList
                    slots={timeSlots}
                    selectedSlotTime={selectedSlotTime}
                    onSlotSelect={onSlotSelect}
                    timeFormat={timeFormat}
                    timezone={timezone}
                    selectedDate={selectedDate}
                  />
                </TimeSlotsPanel>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
