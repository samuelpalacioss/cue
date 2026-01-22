"use client"

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { COMMON_TIMEZONES } from "@/src/utils/constants";

interface TimeZoneSelectorProps {
    value: string;
    onChange: (timezone: string) => void;
}

export default function TimeZoneSelector({ value, onChange }: TimeZoneSelectorProps) {
    // Only render Select after client-side hydration to avoid SSR/client ID mismatch
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Globe className="h-4 w-4 shrink-0" />
            {mounted ? (
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="h-auto border-none bg-transparent p-0 shadow-none hover:text-white">
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
            ) : (
                // Fallback during SSR to maintain layout
                <span className="text-zinc-300">{COMMON_TIMEZONES.find(tz => tz.value === value)?.label || value}</span>
            )}
        </div>
    );
}