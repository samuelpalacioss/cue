export interface TimeSlot {
    startTime: string;
    endTime: string;
    available: boolean;
}

export interface EventData {
    id: string;
    slug: string;
    title: string;
    durationMinutes: number;
    meetingType: 'google_meet' | 'zoom' | 'phone' | 'in_person';
    requiresConfirmation: boolean;
    owners: Array<{ name: string; avatarUrl?: string; role?: string }>;
}