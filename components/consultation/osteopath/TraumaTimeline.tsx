"use client"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useTranslations } from "next-intl"

interface TraumaTimelineProps {
    history: unknown
}

interface TraumaEvent {
    date: string
    title: string
    type: 'TRAUMA' | 'ACCIDENT' | 'SURGERY'
}

export function TraumaTimeline({ history }: TraumaTimelineProps) {
    const t = useTranslations('consultation.osteopath.timeline')

    // Parse history data - expect array of events or use empty array
    let events: TraumaEvent[] = []

    if (history && Array.isArray(history)) {
        events = history
    } else if (history && typeof history === 'object' && history.events) {
        events = history.events
    }

    // If no events, show empty state
    if (events.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-sm text-slate-400">{t('noEvents')}</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 w-full whitespace-nowrap">
                <div className="flex w-max space-x-12 py-6 px-4">
                    {events.map((event, i) => (
                        <div key={i} className="relative flex flex-col items-center group min-w-[140px]">
                            {/* Line connector */}
                            {i < events.length - 1 && (
                                <div className="absolute top-[28px] left-1/2 w-[calc(100%+3rem)] h-0.5 bg-slate-200 -z-10" />
                            )}

                            <div className="mb-3 text-xs font-semibold text-slate-500">{event.date}</div>
                            <div className={`w-5 h-5 rounded-full border-2 z-10 transition-transform group-hover:scale-110 ${
                                event.type === 'SURGERY' ? 'bg-red-100 border-red-500' :
                                event.type === 'ACCIDENT' ? 'bg-orange-100 border-orange-500' :
                                'bg-blue-100 border-blue-500'
                            }`} />
                            <div className="mt-3 text-sm font-medium text-slate-700 text-center">{event.title}</div>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    )
}
