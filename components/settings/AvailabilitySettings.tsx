"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateUserProfile } from "@/app/actions/user"
import { Loader2 } from "lucide-react"

export function AvailabilitySettings({ initialData }: { initialData?: any }) {
    const queryClient = useQueryClient()
    const [jsonConfig, setJsonConfig] = useState(initialData ? JSON.stringify(initialData, null, 2) : `{
  "mon": ["09:00-12:00", "14:00-18:00"],
  "tue": ["09:00-12:00", "14:00-18:00"]
}`)

    const mutation = useMutation({
        mutationFn: async () => {
            try {
                const parsed = JSON.parse(jsonConfig)
                await updateUserProfile({ openingHours: parsed } as any) // Cast as any for now since types might mismatch slightly
            } catch (e) {
                alert("Invalid JSON format")
                throw e
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] })
            alert("Availability updated")
        }
    })

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Label>Opening Hours (JSON Configuration)</Label>
                <p className="text-xs text-muted-foreground">Define your weekly slots. Format: Day: [Start-End]</p>
                <Textarea 
                    className="font-mono h-48" 
                    value={jsonConfig} 
                    onChange={(e) => setJsonConfig(e.target.value)} 
                />
            </div>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Save Availability
            </Button>
        </div>
    )
}
