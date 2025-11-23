"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getUserProfile, updateUserProfile } from "@/app/actions/user"
import { useEffect, useState } from "react"
import { Loader2, Activity, Leaf, Brain } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PractitionerType } from "@prisma/client"
import { toast } from "sonner"

export function ProfileSettings() {
    const queryClient = useQueryClient()
    const { data: user, isLoading } = useQuery({ queryKey: ['userProfile'], queryFn: () => getUserProfile() })
    
    const [formData, setFormData] = useState({
        companyName: "",
        companyAddress: "",
        siret: "",
        slug: "",
        practitionerType: "" as PractitionerType | ""
    })

    useEffect(() => {
        if (user) {
            setFormData({
                companyName: user.companyName || "",
                companyAddress: user.companyAddress || "",
                siret: user.siret || "",
                slug: user.slug || "",
                practitionerType: user.practitionerType || ""
            })
        }
    }, [user])

    const mutation = useMutation({
        mutationFn: updateUserProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] })
            toast.success("Profile updated successfully!")
        },
        onError: (err) => {
            toast.error("Failed to update: " + err.message)
        }
    })

    if (isLoading) return <div className="p-4"><Loader2 className="animate-spin"/></div>

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Label>Public Booking URL (Slug)</Label>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">theraflow.com/</span>
                    <Input value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} placeholder="dr-martin" />
                </div>
            </div>
            <div className="grid gap-2">
                <Label>Practitioner Type</Label>
                <Select 
                    value={formData.practitionerType} 
                    onValueChange={(value) => setFormData({...formData, practitionerType: value as PractitionerType})}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select your profession" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="OSTEOPATH">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" />
                                <span>Osteopath</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="NATUROPATH">
                            <div className="flex items-center gap-2">
                                <Leaf className="w-4 h-4 text-green-500" />
                                <span>Naturopath</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="SOPHROLOGIST">
                            <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-purple-500" />
                                <span>Sophrologist</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label>Company Name</Label>
                <Input value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} placeholder="Cabinet Dr. Martin" />
            </div>
            <div className="grid gap-2">
                <Label>Address</Label>
                <Input value={formData.companyAddress} onChange={(e) => setFormData({...formData, companyAddress: e.target.value})} placeholder="123 Rue de Paris" />
            </div>
                <div className="grid gap-2">
                <Label>SIRET</Label>
                <Input value={formData.siret} onChange={(e) => setFormData({...formData, siret: e.target.value})} placeholder="123 456 789 00012" />
            </div>
            <Button onClick={() => mutation.mutate({
                ...formData,
                practitionerType: formData.practitionerType === "" ? undefined : formData.practitionerType
            })} disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Save Changes
            </Button>
        </div>
    )
}
