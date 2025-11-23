import { PractitionerCalendar } from "@/components/calendar/PractitionerCalendar";
import { getTranslations } from 'next-intl/server';

export default async function CalendarPage() {
    const t = await getTranslations('dashboard.calendar');

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
                 <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            </div>
            <div className="flex-1">
                 <PractitionerCalendar />
            </div>
        </div>
    )
}
