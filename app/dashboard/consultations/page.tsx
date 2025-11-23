"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Loader2, FileText } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getConsultations } from "@/app/actions/consultation"
import Link from "next/link"
import { useTranslations } from 'next-intl'

export default function ConsultationsPage() {
  const t = useTranslations('dashboard.consultationsPage')
  const { data: consultations, isLoading } = useQuery({
    queryKey: ['consultations'],
    queryFn: () => getConsultations()
  })

  if (isLoading) return <div className="p-8"><Loader2 className="animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('table.date')}</TableHead>
                    <TableHead>{t('table.patient')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead>{t('table.note')}</TableHead>
                    <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {consultations?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t('table.noConsultations')}</TableCell></TableRow>}
                {consultations?.map((consultation) => (
                    <TableRow key={consultation.id}>
                        <TableCell>{new Date(consultation.start).toLocaleDateString()} {new Date(consultation.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TableCell>
                        <TableCell className="font-medium">{consultation.patient.firstName} {consultation.patient.lastName}</TableCell>
                        <TableCell>
                             <Badge variant={consultation.status === 'COMPLETED' ? 'default' : 'secondary'}>{consultation.status}</Badge>
                        </TableCell>
                        <TableCell>
                            {consultation.note ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t('table.noteSaved')}</Badge> : <span className="text-muted-foreground text-xs">{t('table.noNote')}</span>}
                        </TableCell>
                        <TableCell className="text-right">
                            <Link href={`/dashboard/consultation/${consultation.id}`}>
                                <Button variant="ghost" size="sm"><Eye className="mr-2 h-4 w-4"/> {t('table.open')}</Button>
                            </Link>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  )
}
