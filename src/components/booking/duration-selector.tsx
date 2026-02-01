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
  const segmentBase = "cursor-pointer px-4 py-2 text-sm font-medium transition-colors";

  return (
    <div className="flex items-center gap-3 text-sm text-zinc-700">
      <Clock className="h-4 w-4 shrink-0 text-cue-deep-green" />
      <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden bg-cue-off-white">
        {durationOptions.map((option, index) => {
          const isSelected = option === value;
          const isFirst = index === 0;
          const isLast = index === durationOptions.length - 1;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`${segmentBase} whitespace-nowrap ${
                isSelected
                  ? "bg-cue-deep-green text-white"
                  : "text-zinc-500 hover:bg-gray-50 hover:text-zinc-900"
              } ${isFirst ? "rounded-l-lg" : ""} ${isLast ? "rounded-r-lg" : ""}`}
            >
              {formatDuration(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
