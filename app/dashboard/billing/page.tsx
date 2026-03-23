"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, MoreHorizontal, Eye, Send, CheckCircle, Trash2 } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createInvoice, getInvoices, updateInvoiceStatus, deleteInvoice, getInvoiceDetails } from "@/app/actions/billing"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { getPatients } from "@/app/actions/patients"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { InvoicePreview } from "@/components/billing/InvoicePreview"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'

export default function BillingPage() {
  const t = useTranslations('dashboard.billing')
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [newInvoice, setNewInvoice] = useState({ patientId: "", amount: 60 })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Awaited<ReturnType<typeof getInvoiceDetails>> | null>(null)

  const { data: invoices, isLoading } = useQuery({ queryKey: ['invoices'], queryFn: () => getInvoices() })
  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: () => getPatients() })

  const mutation = useMutation({
      mutationFn: createInvoice,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] })
          setOpen(false)
          toast.success(t('toasts.invoiceCreated'))
      },
      onError: (error: Error) => {
          toast.error(error.message || t('toasts.invoiceCreateError'))
      }
  })

  const updateStatusMutation = useMutation({
      mutationFn: ({ id, status }: { id: string, status: 'DRAFT' | 'SENT' | 'PAID' }) =>
          updateInvoiceStatus(id, status),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] })
          toast.success(t('toasts.statusUpdated'))
      },
      onError: (error: Error) => {
          toast.error(error.message || t('toasts.statusUpdateError'))
      }
  })

  const deleteMutation = useMutation({
      mutationFn: deleteInvoice,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] })
          toast.success(t('toasts.invoiceDeleted'))
      },
      onError: (error: Error) => {
          toast.error(error.message || t('toasts.invoiceDeleteError'))
      }
  })

  const handlePreview = async (invoiceId: string) => {
      try {
          const details = await getInvoiceDetails(invoiceId)
          setSelectedInvoice(details)
          setPreviewOpen(true)
      } catch (error) {
          const message = error instanceof Error ? error.message : t('toasts.previewError')
          toast.error(message)
      }
  }

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> {t('newInvoice')}</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>{t('createInvoice')}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>{t('form.patient')}</Label>
                        <Select onValueChange={(v) => setNewInvoice({...newInvoice, patientId: v})}>
                            <SelectTrigger><SelectValue placeholder={t('form.selectPatient')} /></SelectTrigger>
                            <SelectContent>
                                {patients?.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>{t('form.amount')}</Label>
                        <Input
                          type="number"
                          value={newInvoice.amount}
                          onChange={(e) => {
                            const nextAmount = Number.parseFloat(e.target.value)
                            setNewInvoice({
                              ...newInvoice,
                              amount: Number.isNaN(nextAmount) ? 0 : nextAmount
                            })
                          }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                      onClick={() => mutation.mutate(newInvoice)}
                      disabled={mutation.isPending || !newInvoice.patientId || newInvoice.amount <= 0}
                    >
                      {t('form.create')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
          <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('stats.totalRevenue')}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">€{invoices?.reduce((acc, inv) => acc + Number(inv.amount), 0).toFixed(2)}</div></CardContent>
          </Card>
          <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('stats.pendingPayment')}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">€{invoices?.filter(i => i.status === 'SENT').reduce((acc, inv) => acc + Number(inv.amount), 0).toFixed(2)}</div></CardContent>
          </Card>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('table.number')}</TableHead>
                    <TableHead>{t('table.patient')}</TableHead>
                    <TableHead>{t('table.date')}</TableHead>
                    <TableHead>{t('table.amount')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('table.noInvoices')}</TableCell></TableRow>}
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{t('actions.actions')}</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handlePreview(invoice.id)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        {t('actions.preview')}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {invoice.status === 'DRAFT' && (
                                        <DropdownMenuItem
                                            onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'SENT' })}
                                        >
                                            <Send className="mr-2 h-4 w-4" />
                                            {t('actions.send')}
                                        </DropdownMenuItem>
                                    )}
                                    {invoice.status === 'SENT' && (
                                        <DropdownMenuItem
                                            onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'PAID' })}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            {t('actions.markAsPaid')}
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => deleteMutation.mutate(invoice.id)}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t('actions.delete')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>

      <InvoicePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        invoice={selectedInvoice}
      />
    </div>
  )
}
