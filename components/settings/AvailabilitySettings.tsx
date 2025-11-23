"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getUserProfile, updateUserProfile } from "@/app/actions/user"
import { Loader2, Plus, Trash2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const DAYS = [
    { id: 'mon', label: 'Monday' },
    { id: 'tue', label: 'Tuesday' },
    { id: 'wed', label: 'Wednesday' },
    { id: 'thu', label: 'Thursday' },
    { id: 'fri', label: 'Friday' },
    { id: 'sat', label: 'Saturday' },
    { id: 'sun', label: 'Sunday' },
]

interface TimeSlot {
    start: string
    end: string
}

interface DaySchedule {
    isOpen: boolean
    slots: TimeSlot[]
}

type WeeklySchedule = Record<string, DaySchedule>

export function AvailabilitySettings() {
    const queryClient = useQueryClient()
    const { data: user, isLoading } = useQuery({ queryKey: ['userProfile'], queryFn: () => getUserProfile() })

    // Initialize state from JSON
    const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
        const initial: WeeklySchedule = {}
        DAYS.forEach(day => {
            initial[day.id] = { isOpen: false, slots: [{ start: "09:00", end: "17:00" }] }
        })
        return initial
    })

    // Update schedule when user data loads
    useEffect(() => {
        if (user?.openingHours) {
            const openingHours = user.openingHours as Record<string, string[]>
            const newSchedule: WeeklySchedule = {}

            DAYS.forEach(day => {
                const daySlots = openingHours[day.id]
                if (daySlots && Array.isArray(daySlots) && daySlots.length > 0) {
                    newSchedule[day.id] = {
                        isOpen: true,
                        slots: daySlots.map((slot: string) => {
                            const [start, end] = slot.split('-')
                            return { start, end }
                        })
                    }
                } else {
                    newSchedule[day.id] = { isOpen: false, slots: [{ start: "09:00", end: "17:00" }] }
                }
            })

            setSchedule(newSchedule)
        }
    }, [user])

    const mutation = useMutation({
        mutationFn: async () => {
            // Convert state back to JSON
            const jsonConfig: Record<string, string[]> = {}

            Object.entries(schedule).forEach(([dayId, dayData]) => {
                if (dayData.isOpen && dayData.slots.length > 0) {
                    jsonConfig[dayId] = dayData.slots.map(slot => `${slot.start}-${slot.end}`)
                }
            })

            await updateUserProfile({ openingHours: jsonConfig } as any)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] })
            toast.success("Availability updated successfully!")
        },
        onError: (err) => {
            toast.error("Failed to update: " + err.message)
        }
    })

    const toggleDay = (dayId: string) => {
        setSchedule(prev => ({
            ...prev,
            [dayId]: {
                ...prev[dayId],
                isOpen: !prev[dayId].isOpen
            }
        }))
    }

    const addSlot = (dayId: string) => {
        setSchedule(prev => ({
            ...prev,
            [dayId]: {
                ...prev[dayId],
                slots: [...prev[dayId].slots, { start: "09:00", end: "17:00" }]
            }
        }))
    }

    const removeSlot = (dayId: string, index: number) => {
        setSchedule(prev => {
            const newSlots = [...prev[dayId].slots]
            newSlots.splice(index, 1)
            return {
                ...prev,
                [dayId]: {
                    ...prev[dayId],
                    slots: newSlots
                }
            }
        })
    }

    const updateSlot = (dayId: string, index: number, field: 'start' | 'end', value: string) => {
        setSchedule(prev => {
            const newSlots = [...prev[dayId].slots]
            newSlots[index] = { ...newSlots[index], [field]: value }
            return {
                ...prev,
                [dayId]: {
                    ...prev[dayId],
                    slots: newSlots
                }
            }
        })
    }

    if (isLoading) return <div className="p-4"><Loader2 className="animate-spin"/></div>

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {DAYS.map(day => {
                    const daySchedule = schedule[day.id]
                    return (
                        <div key={day.id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 border rounded-lg bg-card">
                            <div className="flex items-center justify-between sm:w-40 pt-2">
                                <Label className="font-medium text-base">{day.label}</Label>
                                <div 
                                    className={cn(
                                        "w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out",
                                        daySchedule.isOpen ? "bg-primary" : "bg-muted"
                                    )}
                                    onClick={() => toggleDay(day.id)}
                                >
                                    <div className={cn(
                                        "w-4 h-4 bg-background rounded-full shadow-sm transition-transform duration-200 ease-in-out",
                                        daySchedule.isOpen ? "translate-x-4" : "translate-x-0"
                                    )} />
                                </div>
                            </div>

                            <div className="flex-1 space-y-3">
                                {!daySchedule.isOpen ? (
                                    <div className="text-muted-foreground text-sm pt-2">Unavailable</div>
                                ) : (
                                    <div className="space-y-3">
                                        {daySchedule.slots.map((slot, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                                    <Input 
                                                        type="time" 
                                                        value={slot.start} 
                                                        onChange={(e) => updateSlot(day.id, index, 'start', e.target.value)}
                                                        className="w-32"
                                                    />
                                                    <span className="text-muted-foreground">-</span>
                                                    <Input 
                                                        type="time" 
                                                        value={slot.end} 
                                                        onChange={(e) => updateSlot(day.id, index, 'end', e.target.value)}
                                                        className="w-32"
                                                    />
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => removeSlot(day.id, index)}
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => addSlot(day.id)}
                                            className="mt-2"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Hours
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="flex justify-end">
                <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} size="lg">
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Availability
                </Button>
            </div>
        </div>
    )
}
