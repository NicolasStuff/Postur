import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface TraumaTimelineProps {
    history: any
}

export function TraumaTimeline({ history }: TraumaTimelineProps) {
    // Mock data if history is empty or not in expected format
    const events = [
        { date: '2015', title: 'Entorse Cheville G', type: 'TRAUMA' },
        { date: '2018', title: 'Accident Voiture', type: 'ACCIDENT' },
        { date: '2020', title: 'Opération Genou D', type: 'SURGERY' },
        { date: '2023', title: 'Chute Escalier', type: 'TRAUMA' },
    ]

    return (
        <Card className="h-full border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
            <CardHeader className="pb-3 border-b shrink-0">
                <CardTitle className="text-sm font-bold text-slate-900">Timeline Traumatique</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 flex items-center min-h-0">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max space-x-12 py-2">
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
            </CardContent>
        </Card>
    )
}
