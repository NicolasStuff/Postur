import { useDroppable } from '@dnd-kit/core'
import type { ScheduleWindow } from './types'
import { SLOT_HEIGHT_PX } from './types'
import { getSlotBg } from './utils'

interface DroppableSlotProps {
  dayIndex: number
  slot: number
  window: ScheduleWindow | null
  isSelected: boolean
  selectionType: 'ADDED' | 'BLOCKED'
  isDropPreview: boolean
  isDndActive: boolean
  isHourStart: boolean
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>, dayIndex: number, slot: number) => void
  onMouseEnter: (dayIndex: number, slot: number) => void
}

export default function DroppableSlot({
  dayIndex,
  slot,
  window,
  isSelected,
  selectionType,
  isDropPreview,
  isDndActive,
  isHourStart,
  onMouseDown,
  onMouseEnter,
}: DroppableSlotProps) {
  const { setNodeRef } = useDroppable({
    id: `slot-${dayIndex}-${slot}`,
    data: { dayIndex, slot },
  })

  const bg = getSlotBg(window, isSelected, selectionType, isDropPreview)
  const hasBackground = bg !== ''

  return (
    <div
      ref={setNodeRef}
      data-testid={`slot-${dayIndex}-${slot}`}
      className={`${hasBackground ? 'px-0.5' : ''} ${isHourStart ? 'border-t border-gray-100' : ''}`}
      style={{ height: SLOT_HEIGHT_PX, cursor: isDndActive ? 'grabbing' : 'crosshair' }}
      onMouseDown={(event) => onMouseDown(event, dayIndex, slot)}
      onMouseEnter={() => onMouseEnter(dayIndex, slot)}
    >
      <div className={`h-full transition-colors ${bg}`} />
    </div>
  )
}
