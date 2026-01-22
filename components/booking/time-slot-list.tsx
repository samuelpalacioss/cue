"use client";

import { TimeSlot } from "@/src/types/schema";
import TimeSlotButton from "./time-slot-button";
import { TimeFormat } from "@/src/utils/booking/date-utils";
import { formatTime } from "@/src/utils/booking/date-utils";

interface TimeSlotListProps {
    slots: TimeSlot[];
    selectedSlotTime?: string;
    onSlotSelect?: (slot: TimeSlot | undefined) => void;
    timeFormat: TimeFormat;
}

export default function TimeSlotList({
    slots,
    selectedSlotTime,
    onSlotSelect,
    timeFormat,
}: TimeSlotListProps) {
    if (slots.length === 0) {
        return (
            <p className="py-8 text-center text-sm text-zinc-400">
                No hay horarios disponibles para esta fecha
            </p>
        );
    }

    return (
        <>
            {slots.map((slot) => {
                const isCurrentlySelected = selectedSlotTime === slot.startTime;
                const formattedTime = formatTime(slot.startTime, timeFormat);

                return (
                    <TimeSlotButton
                        key={slot.startTime}
                        slot={slot}
                        isSelected={isCurrentlySelected}
                        onClick={() => {
                            if (!onSlotSelect) return;

                            if (isCurrentlySelected) {
                                onSlotSelect(undefined);
                            } else {
                                onSlotSelect(slot);
                            }
                        }}
                        displayTime={formattedTime}
                    />
                );
            })}
        </>
    );
}

