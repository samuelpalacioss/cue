import { EventData } from "@/src/types/schema";
import { formatDuration } from "@/src/utils/booking/date-utils";
import { CheckSquare, Clock, MapPin, Phone, Video } from "lucide-react";
import TimeZoneSelector from "./time-zone-selector";

interface EventInfoPanelProps {
    event: EventData;
    timezone: string;
    onTimezoneChange: (tz: string) => void;
}

const MEETING_TYPE_ICONS = {
    google_meet: Video,
    zoom: Video,
    phone: Phone,
    in_person: MapPin,
};

const MEETING_TYPE_LABELS = {
    google_meet: 'Google Meet',
    zoom: 'Zoom',
    phone: 'Teléfono',
    in_person: 'Presencial',
};

export default function EventInfoPanel({ event, timezone, onTimezoneChange }: EventInfoPanelProps) {
    const MeetingIcon = MEETING_TYPE_ICONS[event.meetingType];
    const meetingLabel = MEETING_TYPE_LABELS[event.meetingType];


    return (
        <div className="p-6 md:rounded-l-lg md:border-b-0 md:border-r md:border-zinc-800 md:bg-zinc-900">
            <div className="space-y-4">
                { /* Event owner and its image*/}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                    <p className="text-sm font-medium text-white">
                        {event.owners[0]?.name?.charAt(0)}
                    </p>
                </div>
                <p className="text-sm font-semibold text-zinc-300">
                    {event.owners[0]?.name}
                </p>

                { /* Event's title */}
                <h1 className="text-xl font-semibold text-white">{event.title}</h1>

                { /* Requires confirmation ? */}
                {event.requiresConfirmation && (
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                        <CheckSquare className="h-4 w-4" />
                        <span>Requiere confirmación</span>
                    </div>
                )}

                {/* Duration */}
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(event.durationMinutes)}</span>
                </div>

                {/* Meeting type */}
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <MeetingIcon className="h-4 w-4" />
                    <span>{meetingLabel}</span>
                </div>

                {/* Timezone selector */}
                <TimeZoneSelector value={timezone} onChange={onTimezoneChange} />
            </div>
        </div>
    )

}