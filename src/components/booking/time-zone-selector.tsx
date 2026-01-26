"use client";

import { useEffect, useState } from "react";
import { Globe, ChevronDown } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

import { COMMON_TIMEZONES } from "@/src/utils/constants";

interface TimeZoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
}

export default function TimeZoneSelector({ value, onChange }: TimeZoneSelectorProps) {
  // Only render Select after client-side hydration to avoid SSR/client ID mismatch
  const [mounted, setMounted] = useState(false);
  // Only compute label after mounting to avoid hydration mismatch
  // During SSR, use empty string to ensure consistent rendering
  const [timezoneLabel, setTimezoneLabel] = useState("");

  useEffect(() => {
    setMounted(true);
    // Compute label after mount to match client-side value
    setTimezoneLabel(COMMON_TIMEZONES.find((tz) => tz.value === value)?.label || value);
  }, [value]);

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-300">
      <Globe className="h-4 w-4 shrink-0" />
      <div className="relative inline-flex w-fit">
        {/* Fallback during SSR - always rendered to reserve space, invisible when mounted */}
        <div
          className={`flex w-fit items-center justify-between gap-2 text-sm whitespace-nowrap h-auto border-none bg-transparent p-0 ${
            mounted ? "invisible" : "visible"
          }`}
          aria-hidden={mounted}
        >
          <span className="flex items-center gap-2 text-zinc-300 line-clamp-1 min-w-[140px]">
            {timezoneLabel}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50 pointer-events-none" />
        </div>
        {/* Select - rendered when mounted, positioned absolutely to overlay fallback */}
        {mounted && (
          <div className="absolute inset-0 flex items-center">
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger className="h-auto border-none bg-transparent p-0 shadow-none hover:text-white w-fit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
