"use client";

import { Clock } from "lucide-react";
import { formatDuration } from "@/src/utils/booking/date-utils";

interface DurationSelectorProps {
  value: number; // Duration in minutes
  onChange: (value: number) => void;
  durationOptions: number[];
}

export default function DurationSelector({
  value,
  onChange,
  durationOptions,
}: DurationSelectorProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-zinc-300">
      <Clock className="h-4 w-4 shrink-0" />
      <div className="relative inline-flex rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-0.5">
        {durationOptions.map((option, index) => {
          const isSelected = option === value;
          const isFirst = index === 0;
          const isLast = index === durationOptions.length - 1;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`whitespace-nowrap cursor-pointer px-3 py-1.5 text-sm text-white transition-all ${
                isSelected
                  ? "rounded-md bg-zinc-700/90 text-white"
                  : "bg-transparent text-zinc-400 hover:text-zinc-300"
              } ${isFirst ? "rounded-l-md" : ""} ${isLast ? "rounded-r-md" : ""}`}
            >
              {formatDuration(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
