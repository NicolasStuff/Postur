import { PractitionerCalendar } from "@/components/calendar/PractitionerCalendar";

export default function CalendarPage() {
    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
                 <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            </div>
            <div className="flex-1">
                 <PractitionerCalendar />
            </div>
        </div>
    )
}
