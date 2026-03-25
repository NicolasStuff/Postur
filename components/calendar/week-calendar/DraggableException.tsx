import { useDraggable } from '@dnd-kit/core'
import type { ExceptionEvent } from './types'
import { SLOT_HEIGHT_PX } from './types'

interface DraggableExceptionProps {
  event: ExceptionEvent
  isDndActive: boolean
  onDelete: (id: string) => void
}

export default function DraggableException({
  event,
  isDndActive,
  onDelete,
}: DraggableExceptionProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `exception-${event.id}`,
    data: {
      kind: 'exception' as const,
      id: event.id,
      exceptionType: event.exceptionType,
      durationSlots: event.durationSlots,
    },
  })

  const top = event.startSlot * SLOT_HEIGHT_PX
  const height = Math.max(SLOT_HEIGHT_PX, event.durationSlots * SLOT_HEIGHT_PX)
  const isBlocked = event.exceptionType === 'BLOCKED'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-testid={`exception-${event.id}`}
      onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      className={`absolute left-0.5 right-0.5 z-10 overflow-hidden rounded border px-1 py-0.5 text-[10px] font-semibold ${
        isBlocked
          ? 'border-orange-700 bg-orange-500 text-white shadow-[inset_3px_0_0_0_rgb(154_52_18)]'
          : 'border-cyan-800 bg-cyan-500 text-slate-950 shadow-[inset_3px_0_0_0_rgb(14_116_144)]'
      } ${isDragging ? 'opacity-40' : ''} ${isDndActive && !isDragging ? 'pointer-events-none' : ''}`}
      style={{ top, height, cursor: isDragging ? 'grabbing' : 'grab' }}
      title={isBlocked ? 'Fermeture exceptionnelle' : 'Ouverture exceptionnelle'}
    >
      <div className="flex items-center justify-between gap-1">
        <span>{isBlocked ? 'Fermeture' : 'Ouverture'}</span>
        <button
          onClick={(clickEvent) => {
            clickEvent.preventDefault()
            clickEvent.stopPropagation()
            onDelete(event.id)
          }}
          onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
          className="rounded px-1 leading-none hover:bg-white/60"
          title="Supprimer ce creneau exceptionnel"
        >
          x
        </button>
      </div>
    </div>
  )
}
