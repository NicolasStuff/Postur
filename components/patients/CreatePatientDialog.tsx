"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createPatient } from "@/app/actions/patients"
import { useRouter } from "next/navigation"

export function CreatePatientDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  })

  const mutation = useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      setOpen(false)
      setFormData({ firstName: "", lastName: "", email: "", phone: "" })
    },
    onError: (error) => {
      alert("Failed to create patient: " + error.message)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4"/> New Patient</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
            <DialogHeader>
            <DialogTitle>Add Patient</DialogTitle>
            <DialogDescription>
                Create a new patient record. Click save when you're done.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">
                First Name
                </Label>
                <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="col-span-3"
                required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">
                Last Name
                </Label>
                <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="col-span-3"
                required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                Email
                </Label>
                <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="col-span-3"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                Phone
                </Label>
                <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="col-span-3"
                />
            </div>
            </div>
            <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
