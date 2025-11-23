"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createService, getServices } from "@/app/actions/services"

export function ServicesSettings() {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({ name: "", duration: 30, price: 50 })

    const { data: services } = useQuery({ queryKey: ['services'], queryFn: () => getServices() })

    const mutation = useMutation({
        mutationFn: createService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] })
            setOpen(false)
            setFormData({ name: "", duration: 30, price: 50 })
        }
    })

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">My Services</h3>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4"/> Add Service</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Name</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Duration (min)</Label>
                                    <Input type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Price (€)</Label>
                                    <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => mutation.mutate(formData)}>Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services?.length === 0 && (
                             <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">No services added yet.</TableCell>
                             </TableRow>
                        )}
                        {services?.map((service) => (
                            <TableRow key={service.id}>
                                <TableCell className="font-medium">{service.name}</TableCell>
                                <TableCell>{service.duration} min</TableCell>
                                <TableCell>€{Number(service.price)}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
