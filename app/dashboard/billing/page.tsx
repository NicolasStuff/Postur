"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Loader2 } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createInvoice, getInvoices } from "@/app/actions/billing"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { getPatients } from "@/app/actions/patients"

export default function BillingPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [newInvoice, setNewInvoice] = useState({ patientId: "", amount: 60 })

  const { data: invoices, isLoading } = useQuery({ queryKey: ['invoices'], queryFn: () => getInvoices() })
  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: () => getPatients() })

  const mutation = useMutation({
      mutationFn: createInvoice,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] })
          setOpen(false)
      }
  })

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> New Invoice</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Patient</Label>
                        <Select onValueChange={(v) => setNewInvoice({...newInvoice, patientId: v})}>
                            <SelectTrigger><SelectValue placeholder="Select Patient" /></SelectTrigger>
                            <SelectContent>
                                {patients?.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Amount (€)</Label>
                        <Input type="number" value={newInvoice.amount} onChange={(e) => setNewInvoice({...newInvoice, amount: parseFloat(e.target.value)})} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => mutation.mutate(newInvoice)} disabled={mutation.isPending || !newInvoice.patientId}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
          <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Revenue (Year)</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">€{invoices?.reduce((acc, inv) => acc + Number(inv.amount), 0).toFixed(2)}</div></CardContent>
          </Card>
          <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending Payment</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">€{invoices?.filter(i => i.status === 'SENT').reduce((acc, inv) => acc + Number(inv.amount), 0).toFixed(2)}</div></CardContent>
          </Card>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No invoices found.</TableCell></TableRow>}
                {invoices?.map((invoice) => (
                    <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.number}</TableCell>
                        <TableCell>{invoice.patient.firstName} {invoice.patient.lastName}</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                        <TableCell>€{Number(invoice.amount).toFixed(2)}</TableCell>
                        <TableCell>
                            <Badge variant={invoice.status === 'PAID' ? 'default' : 'outline'}>{invoice.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon"><FileText className="h-4 w-4"/></Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  )
}
