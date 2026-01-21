"use client";

import { useState } from "react";
import { TimeSlot } from "@/src/types/schema";
import TimeSlotButton from "./time-slot-button";

interface TimeSlotListProps {
    slots: TimeSlot[];
}

export default function TimeSlotList({ slots }: TimeSlotListProps) {
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | undefined>(undefined);

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
                // Check if the slot is currently selected
                const isCurrentlySelected = selectedSlot?.startTime === slot.startTime;

                return (
                    <TimeSlotButton
                        key={slot.startTime}
                        slot={slot}
                        isSelected={isCurrentlySelected}
                        onClick={() => {
                            // If clicking the already-selected slot, deselect it
                            // Otherwise, select it
                            if (isCurrentlySelected) {
                                console.log(`Deselecting slot: ${slot.startTime}`);
                                setSelectedSlot(undefined);
                            } else {
                                console.log(`Selecting slot: ${slot.startTime}`);
                                setSelectedSlot(slot);
                            }
                        }}
                        displayTime={slot.startTime}
                    />
                );
            })}
        </>
    );
}

