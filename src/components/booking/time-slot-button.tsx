"use client";

import { Button } from "@/src/components/ui/button";
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
      variant={isSelected ? "outline" : "default"}
      onClick={onClick}
      style={isSelected ? { background: "var(--cue-slot-gradient)" } : undefined}
      className={`w-full cursor-pointer rounded-lg border border-zinc-400 text-zinc-200 px-2.5 py-4.5 mb-2 text-sm leading-none font-medium text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-zinc-800 ${
        isSelected
          ? "border-cue-deep-green/50 shadow-md text-cue-deep-green"
          : "bg-cue-off-white hover:bg-cue-muted-teal hover:border-cue-deep-green hover:text-white hover:shadow-md active:shadow-sm text-cue-deep-green"
      }`}
    >
      {displayTime}
    </Button>
  );
}
