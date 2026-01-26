export interface TimeSlot {
    startTime: string;
    endTime: string;
    available: boolean;
    sourceTimezone: string; // IANA timezone identifier (e.g., 'America/Caracas')
}

export interface SlotsRangeResponse {
    slotsByDate: Record<string, TimeSlot[]>;
}

export interface EventOption {
    id: number;
    durationMinutes: number;
    capacity: number;
}

export interface EventData {
    id: string;
    slug: string;
    title: string;
    defaultOptionId: number; // ID of the default event option
    meetingType: 'google_meet' | 'zoom' | 'phone' | 'in_person';
    requiresConfirmation: boolean;
    owners: Array<{ name: string; avatarUrl?: string; role?: string }>;
    eventOptions: EventOption[]; // All available booking options
}

export interface BookingWithPerson {
    id: number;
    eventOptionId: number;
    date: string;
    timeSlot: string; // HH:MM format
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    person: {
        firstName: string;
        lastName: string;
    } | null;
}