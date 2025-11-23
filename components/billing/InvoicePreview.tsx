"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface InvoicePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: {
    id: string
    number: string
    date: Date | string
    amount: number
    status: string
    patient: {
      firstName: string
      lastName: string
      address?: string | null
      email?: string | null
      phone?: string | null
    }
    user: {
      name: string | null
      email: string
      practitionerType: string | null
      siret: string | null
      companyName: string | null
      companyAddress: string | null
      isVatExempt: boolean
    }
  } | null
}

const getPractitionerTitle = (type: string | null) => {
  switch (type) {
    case 'OSTEOPATH':
      return 'Ostéopathe D.O.'
    case 'NATUROPATH':
      return 'Naturopathe'
    case 'SOPHROLOGIST':
      return 'Sophrologue'
    default:
      return 'Praticien'
  }
}

const getPractitionerSpecialty = (type: string | null) => {
  switch (type) {
    case 'OSTEOPATH':
      return 'Spécialisé en ostéopathie structurelle et tissulaire.'
    case 'NATUROPATH':
      return 'Spécialisé en naturopathie et médecines naturelles.'
    case 'SOPHROLOGIST':
      return 'Spécialisé en sophrologie et relaxation.'
    default:
      return ''
  }
}

const getServiceDescription = (type: string | null) => {
  switch (type) {
    case 'OSTEOPATH':
      return 'Consultation Ostéopathie'
    case 'NATUROPATH':
      return 'Consultation Naturopathie'
    case 'SOPHROLOGIST':
      return 'Consultation Sophrologie'
    default:
      return 'Consultation'
  }
}

export function InvoicePreview({ open, onOpenChange, invoice }: InvoicePreviewProps) {
  if (!invoice) return null

  const formattedDate = new Date(invoice.date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prévisualisation de la facture</DialogTitle>
        </DialogHeader>

        {/* Invoice Preview */}
        <div className="bg-white border-4 border-gray-800 p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">{invoice.user.name || 'Praticien'}</h2>
              <p className="text-sm font-medium">{getPractitionerTitle(invoice.user.practitionerType)}</p>
              <p className="text-sm">{getPractitionerSpecialty(invoice.user.practitionerType)}</p>
              <p className="text-sm">Tél : {invoice.user.email}</p>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold">
                {invoice.patient.lastName?.charAt(0).toUpperCase()}. {invoice.patient.firstName}
              </h1>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Invoice Details */}
          <div className="flex justify-end space-x-12 text-sm">
            <div className="text-right space-y-1">
              <p className="font-semibold">N° facture: {invoice.number}</p>
              <p>Date: {formattedDate}</p>
            </div>
          </div>

          {/* Patient Info */}
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Patient</p>
            <p>
              {invoice.patient.firstName} {invoice.patient.lastName}
            </p>
            {invoice.patient.address && <p>{invoice.patient.address}</p>}
            {invoice.patient.email && <p>{invoice.patient.email}</p>}
            {invoice.patient.phone && <p>{invoice.patient.phone}</p>}
          </div>

          {/* Services Table */}
          <div className="mt-8">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                    Description
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold w-24">
                    Qte
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold w-32">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    {getServiceDescription(invoice.user.practitionerType)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-sm">1</td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                    {invoice.amount.toFixed(2)}€
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Total */}
            <div className="flex justify-end mt-4">
              <div className="w-64 space-y-2">
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-lg">{invoice.amount.toFixed(2)}€</span>
                </div>
              </div>
            </div>
          </div>

          {/* VAT Notice */}
          <div className="mt-6 text-xs text-gray-600">
            <p>TVA non applicable, art. 293 B du CGI</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
