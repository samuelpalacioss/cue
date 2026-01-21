import TimeSlotPanel from "@/components/booking/time-slots-panel";
import TimeSlotList from "@/components/booking/time-slot-list";
import { getLocalTimeZone, today } from "@internationalized/date";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <h1 className="text-4xl">Cue! MVP!</h1>
      <TimeSlotPanel selectedDate={today(getLocalTimeZone())}>
        <TimeSlotList
          slots={[{ startTime: "2026-01-20T10:00:00", endTime: "2026-01-20T11:00:00", available: true }]}
        />
      </TimeSlotPanel>
    </>
  );
}
