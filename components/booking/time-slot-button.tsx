"use client";

import { Button } from "@/components/ui/button"
import { TimeSlot } from "@/src/types/schema";

interface TimeSlotButtonProps {
    slot: TimeSlot;
    isSelected: boolean;
    onClick: () => void;
    displayTime: string;
}


export default function TimeSlotButton({ slot, isSelected, onClick, displayTime }: TimeSlotButtonProps) {

    // If the time slot is not available, don't render anything
    if (!slot.available) {
        return null;
    }

    return (
        <Button size="sm" variant="outline" onClick={onClick} className={`w-full cursor-pointer rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white hover:border-zinc-100 hover:bg-zinc-700 ${isSelected
            ? ' text-emerald-600'
            : ' text-zinc-300'
            }`}>
            {displayTime}
        </Button>
    )
}