import { useState, useEffect } from "react";
import { TimeFormat } from "@/src/utils/booking/date-utils";
import { DEFAULT_TIME_FORMAT } from "@/src/utils/constants";

const TIME_FORMAT_STORAGE_KEY = "booking-time-format";

interface TimeFormatToggleProps {
  value?: TimeFormat;
  onChange?: (format: TimeFormat) => void;
}

export function TimeFormatToggle({ value, onChange }: TimeFormatToggleProps) {
  const [format, setFormat] = useState<TimeFormat>(() => {
    if (value) return value;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(TIME_FORMAT_STORAGE_KEY);
      if (stored === "12h" || stored === "24h") {
        return stored;
      }
    }
    return DEFAULT_TIME_FORMAT;
  });

  useEffect(() => {
    if (value && value !== format) {
      setFormat(value);
    }
  }, [value, format]);

  const handleToggle = (newFormat: TimeFormat): void => {
    setFormat(newFormat);
    if (typeof window !== "undefined") {
      localStorage.setItem(TIME_FORMAT_STORAGE_KEY, newFormat);
    }
    onChange?.(newFormat);
  };

  // Single pill-shaped container: one border, rounded-full, segments only round on outer edges
  const segmentBase = "cursor-pointer px-4 py-2 text-sm font-medium transition-colors";

  return (
    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden bg-cue-off-white">
      <button
        onClick={() => handleToggle("12h")}
        className={`${segmentBase} rounded-l-lg ${
          format === "12h"
            ? "bg-cue-deep-green text-white"
            : "text-zinc-500 hover:bg-gray-50 hover:text-zinc-900"
        }`}
      >
        12h
      </button>
      <button
        onClick={() => handleToggle("24h")}
        className={`${segmentBase} rounded-r-lg ${
          format === "24h"
            ? "bg-cue-deep-green text-white"
            : "text-zinc-500 hover:bg-gray-50 hover:text-zinc-900"
        }`}
      >
        24h
      </button>
    </div>
  );
}
