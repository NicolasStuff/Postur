"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Search, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useQuery } from "@tanstack/react-query"
import { getPatients } from "@/app/actions/patients"
import { useState } from "react"

export function PatientList() {
  const [search, setSearch] = useState("")
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => getPatients()
  })

  const filteredPatients = patients?.filter(p => 
    p.lastName.toLowerCase().includes(search.toLowerCase()) || 
    p.firstName.toLowerCase().includes(search.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  )

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-4">
       <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                type="search" 
                placeholder="Search patients..." 
                className="pl-8" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredPatients?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                            No patients found.
                        </TableCell>
                    </TableRow>
                )}
                {filteredPatients?.map((patient) => (
                    <TableRow key={patient.id}>
                        <TableCell className="flex items-center gap-3 font-medium">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>{patient.firstName[0]}{patient.lastName[0]}</AvatarFallback>
                            </Avatar>
                            {patient.firstName} {patient.lastName}
                        </TableCell>
                        <TableCell>
                            {patient.email && <div>{patient.email}</div>}
                            {patient.phone && <div className="text-xs text-muted-foreground">{patient.phone}</div>}
                        </TableCell>
                        <TableCell>{new Date(patient.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>View History</DropdownMenuItem>
                                    <DropdownMenuItem>New Appointment</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  )
}
