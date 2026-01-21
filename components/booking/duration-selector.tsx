"use client"

import { Clock } from "lucide-react";
import { formatDuration } from "@/src/utils/booking/date-utils";

interface DurationSelectorProps {
    value: number; // Duration in minutes
    onChange: (value: number) => void;
    durationOptions: number[];
}

export default function DurationSelector({ value, onChange, durationOptions }: DurationSelectorProps) {

    return (
        <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Clock className="h-4 w-4 shrink-0" />
            <div className="relative flex rounded-lg border border-white/20 bg-transparent p-0.5">
                {durationOptions.map((option) => {
                    const isSelected = option === value;
                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onChange(option)}
                            className={`flex-1 px-3 py-1.5 text-sm text-white transition-all ${isSelected
                                ? 'rounded-md bg-zinc-700/80'
                                : 'bg-transparent hover:bg-zinc-800/30'
                                }`}
                        >
                            {formatDuration(option)}
                        </button>
                    );
                })}
            </div>
        </div>
    )



}