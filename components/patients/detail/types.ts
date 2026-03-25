export interface PatientDetail {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  medicalHistory: unknown
  createdAt: Date | string
  updatedAt: Date | string
  appointments: Array<{
    id: string
    start: Date | string
    end: Date | string
    status: string
    completedAt: Date | string | null
    billedAt: Date | string | null
    service: {
      name: string
      price: number
      duration: number
    }
    note: { id: string } | null
    invoice: {
      id: string
      number: string
      status: string
    } | null
  }>
  invoices: Array<{
    id: string
    number: string
    date: Date | string
    amount: number
    vatAmount: number
    status: string
    serviceName: string | null
    appointmentId: string | null
  }>
}
