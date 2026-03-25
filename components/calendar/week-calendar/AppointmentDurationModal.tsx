import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const SELECT_CLASS =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary'

interface AppointmentDurationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientName: string
  serviceName: string
  appointmentId: string
  value: number
  onValueChange: (value: number) => void
  onConfirm: () => void
  isPending?: boolean
}

export default function AppointmentDurationModal({
  open,
  onOpenChange,
  patientName,
  serviceName,
  appointmentId,
  value,
  onValueChange,
  onConfirm,
  isPending = false,
}: AppointmentDurationModalProps) {
  const hours = Math.floor(value / 60)
  const mins = value % 60

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la durée</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">{patientName}</p>
            <p className="text-xs text-gray-600">{serviceName}</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">Durée</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="duration-hours" className="mb-1 block text-xs text-gray-400">
                  Heures
                </label>
                <select
                  id="duration-hours"
                  value={hours}
                  onChange={(e) => onValueChange(Number(e.target.value) * 60 + mins)}
                  className={SELECT_CLASS}
                >
                  {Array.from({ length: 9 }, (_, i) => (
                    <option key={i} value={i}>
                      {i}h
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="duration-mins" className="mb-1 block text-xs text-gray-400">
                  Minutes
                </label>
                <select
                  id="duration-mins"
                  value={mins}
                  onChange={(e) => onValueChange(hours * 60 + Number(e.target.value))}
                  className={SELECT_CLASS}
                >
                  {MINUTE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')} min
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">Modification manuelle, indépendante du service.</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              Enregistrer
            </button>
            <Link
              href={`/dashboard/consultation/${appointmentId}?from=calendar`}
              className="rounded-lg border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Ouvrir la fiche complète
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
