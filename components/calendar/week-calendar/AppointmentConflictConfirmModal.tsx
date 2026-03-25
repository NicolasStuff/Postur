import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AppointmentConflictConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending?: boolean
}

export default function AppointmentConflictConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: AppointmentConflictConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conflit de planning</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            La nouvelle plage horaire chevauche un autre rendez-vous. Voulez-vous forcer la
            modification malgré tout ?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              Forcer
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
