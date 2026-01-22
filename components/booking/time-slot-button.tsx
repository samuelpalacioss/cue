"use client";

import { Button } from "@/components/ui/button";
import { TimeSlot } from "@/src/types/schema";

interface TimeSlotButtonProps {
  slot: TimeSlot;
  isSelected: boolean;
  onClick: () => void;
  displayTime: string;
}

export default function TimeSlotButton({
  slot,
  isSelected,
  onClick,
  displayTime,
}: TimeSlotButtonProps) {
  // If the time slot is not available, don't render anything
  if (!slot.available) {
    return null;
  }

  return (
    <Button
      size="sm"
      onClick={onClick}
      className={`w-full cursor-pointer rounded-lg border border-zinc-700 text-zinc-200 bg-zinc-950 px-2.5 py-2 mb-2 min-h-9 text-sm leading-none font-medium text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-zinc-800 ${
        isSelected
          ? " bg-zinc-800 shadow-md text-zinc-200"
          : " hover:bg-zinc-800 hover:border-zinc-600 hover:text-zinc-200 hover:shadow-md active:shadow-sm text-zinc-200"
      }`}
    >
      {displayTime}
    </Button>
  );
}
