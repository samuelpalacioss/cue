"use client";

import { useState } from "react";
import TimeSlotPanel from "@/components/booking/time-slots-panel";
import TimeSlotList from "@/components/booking/time-slot-list";
import { getLocalTimeZone, today } from "@internationalized/date";
import Image from "next/image";
import EventInfoPanel from "@/components/booking/event-info-panel";
import { EventData } from "@/src/types/schema";

// Mock event data for testing
const mockEvent: EventData = {
  id: "1",
  slug: "mock-event",
  title: "Consulta de 30 minutos",
  durationMinutes: 30,
  meetingType: "google_meet",
  requiresConfirmation: true,
  owners: [
    {
      name: "Juan Pérez",
      avatarUrl: undefined,
      role: "Consultor"
    }
  ]
};

export default function Home() {
  const [timezone, setTimezone] = useState(getLocalTimeZone());

  return (
    <>
      <h1 className="text-4xl">Cue! MVP!</h1>
      {/* <TimeSlotPanel selectedDate={today(getLocalTimeZone())}>
        <TimeSlotList
          slots={[{ startTime: "2026-01-20T10:00:00", endTime: "2026-01-20T11:00:00", available: true }]}
        />
      </TimeSlotPanel> */}
      <EventInfoPanel
        event={mockEvent}
        timezone={timezone}
        onTimezoneChange={setTimezone}
      />
    </>
  );
}
