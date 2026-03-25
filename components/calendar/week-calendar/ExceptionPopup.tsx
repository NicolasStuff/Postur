import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { slotToTime } from './utils'
import { SLOT_HEIGHT_PX } from './types'

interface ExceptionPopupProps {
  selection: { dayIndex: number; startSlot: number; endSlot: number }
  weekDays: Date[]
  reason: string
  onReasonChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
  exceptionType: 'ADDED' | 'BLOCKED'
}

export default function ExceptionPopup({
  selection,
  weekDays,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
  isPending,
  exceptionType,
}: ExceptionPopupProps) {
  const day = weekDays[selection.dayIndex]
  if (!day) return null

  const start = slotToTime(selection.startSlot)
  const endSlotPlusOne = selection.endSlot + 1
  const end = slotToTime(endSlotPlusOne)

  const dateLabel = format(day, 'EEEE d MMMM', { locale: fr })
  const startLabel = `${start.hour.toString().padStart(2, '0')}h${start.minute.toString().padStart(2, '0')}`
  const endLabel = `${end.hour.toString().padStart(2, '0')}h${end.minute.toString().padStart(2, '0')}`

  const topPx = selection.startSlot * SLOT_HEIGHT_PX + 16
  const colStart = ((selection.dayIndex + 1) / 8) * 100
  const showLeft = selection.dayIndex >= 5
  const popupStyle: React.CSSProperties = showLeft
    ? { right: `${100 - colStart}%`, top: `${topPx}px` }
    : { left: `${colStart}%`, top: `${topPx}px` }

  const isBlocked = exceptionType === 'BLOCKED'

  return (
    <div
      className={`absolute z-30 bg-white rounded-xl shadow-xl p-4 w-64 border-2 ${
        isBlocked ? 'border-red-500' : 'border-blue-500'
      }`}
      style={popupStyle}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          isBlocked
            ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
            : 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
        }`}>
          {isBlocked ? 'Fermeture' : 'Ouverture'}
        </span>
      </div>
      <p className="text-xs font-medium text-gray-700 capitalize mb-1">{dateLabel}</p>
      <p className={`text-base font-bold mb-3 ${isBlocked ? 'text-red-700' : 'text-blue-700'}`}>
        {startLabel} - {endLabel}
      </p>
      <input
        type="text"
        placeholder="Raison (optionnel)"
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary mb-3"
      />
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={isPending}
          className={`flex-1 px-3 py-2 text-white text-sm rounded-lg disabled:opacity-50 font-medium transition-colors ${
            isBlocked
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isPending ? 'Envoi...' : 'Confirmer'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
