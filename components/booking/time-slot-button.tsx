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
      variant="ghost"
      onClick={onClick}
      className={`w-full cursor-pointer rounded-lg border-zinc-600 text-zinc-200 bg-zinc-900 px-2.5 py-2 mb-2 min-h-9 text-sm leading-none font-medium text-center border  transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-zinc-800 ${
        isSelected
          ? "border-zinc-600 bg-zinc-800 text-white shadow-md"
          : "border-zinc-800 bg-zinc-950  hover:border-zinc-600 hover:bg-zinc-900 hover:shadow-md active:shadow-sm"
      }`}
    >
      {displayTime}
    </Button>
  );
}
