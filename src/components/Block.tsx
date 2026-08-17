import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Block as BlockType, Category } from '../lib/types'
import { formatDuration, formatTime, yToMinutes } from '../lib/time'

export type DragPhase = 'move' | 'end'
export type DragType = 'move' | 'resize'

interface BlockProps {
  block: BlockType
  category: Category
  top: number
  height: number
  column: number
  columnCount: number
  isDragging: boolean
  previewLabel?: string
  onOpen: (block: BlockType) => void
  onDrag: (id: string, type: DragType, deltaMinutes: number, phase: DragPhase) => void
  onContextMenu?: (block: BlockType, x: number, y: number) => void
}

const CLICK_THRESHOLD_PX = 4
const LONG_PRESS_MS = 480

export function ScheduleBlock({
  block,
  category,
  top,
  height,
  column,
  columnCount,
  isDragging,
  previewLabel,
  onOpen,
  onDrag,
  onContextMenu,
}: BlockProps) {
  const dragOrigin = useRef<{ y: number; type: DragType } | null>(null)
  const [moved, setMoved] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const startDrag = (e: ReactPointerEvent, type: DragType) => {
    if (e.button !== undefined && e.button !== 0) return
    e.stopPropagation()
    dragOrigin.current = { y: e.clientY, type }
    setMoved(false)
    longPressFired.current = false
    ;(e.target as Element).setPointerCapture(e.pointerId)

    if (type === 'move' && e.pointerType === 'touch' && onContextMenu) {
      const { clientX, clientY } = e
      longPressTimer.current = setTimeout(() => {
        longPressFired.current = true
        dragOrigin.current = null
        onContextMenu(block, clientX, clientY)
      }, LONG_PRESS_MS)
    }
  }

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (!dragOrigin.current) return
    e.stopPropagation()
    const deltaY = e.clientY - dragOrigin.current.y
    if (Math.abs(deltaY) > CLICK_THRESHOLD_PX) {
      setMoved(true)
      clearLongPress()
    }
    const deltaMinutes = yToMinutes(deltaY)
    onDrag(block.id, dragOrigin.current.type, deltaMinutes, 'move')
  }

  const handlePointerUp = (e: ReactPointerEvent) => {
    clearLongPress()
    if (longPressFired.current) {
      longPressFired.current = false
      return
    }
    if (!dragOrigin.current) return
    e.stopPropagation()
    const deltaY = e.clientY - dragOrigin.current.y
    const deltaMinutes = yToMinutes(deltaY)
    const type = dragOrigin.current.type
    const wasMoved = moved
    dragOrigin.current = null
    onDrag(block.id, type, deltaMinutes, 'end')
    if (!wasMoved) {
      onOpen(block)
    }
    setMoved(false)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onContextMenu) return
    e.preventDefault()
    e.stopPropagation()
    dragOrigin.current = null
    onContextMenu(block, e.clientX, e.clientY)
  }

  const tiny = height < 34
  const widthPct = 100 / columnCount
  const leftPct = column * widthPct
  const color = block.customColor || category.color

  return (
    <div
      className="absolute px-[2px] outline-none"
      style={{
        top,
        height,
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        zIndex: isDragging ? 30 : 10,
      }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`${block.title}, ${formatTime(block.startMinutes)} to ${formatTime(
          block.startMinutes + block.durationMinutes,
        )}`}
        onPointerDown={(e) => startDrag(e, 'move')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={handleContextMenu}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen(block)
          }
        }}
        className={`group relative h-full w-full touch-none cursor-grab select-none overflow-hidden rounded-lg border shadow-sm transition-shadow active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-offset-1 ${
          isDragging ? 'shadow-lg' : 'hover:shadow-md'
        }`}
        style={{
          backgroundColor: color + '1a',
          borderColor: color + '55',
          // Tailwind ring color can't be dynamic via class, set via CSS var.
          ['--tw-ring-color' as string]: color,
        }}
      >
        <div
          className="absolute inset-y-0 left-0 w-[3px] rounded-l-lg"
          style={{ backgroundColor: color }}
        />
        <div
          className={`flex h-full flex-col gap-0 pl-2.5 pr-1.5 ${
            tiny ? 'justify-center py-0' : 'py-1'
          }`}
        >
          <p
            className="truncate text-[13px] font-medium leading-tight text-slate-800"
            title={block.title}
          >
            {block.title}
          </p>
          {!tiny && (
            <p className="truncate text-[11px] leading-tight text-slate-500">
              {formatTime(block.startMinutes)} · {formatDuration(block.durationMinutes)}
            </p>
          )}
        </div>

        {isDragging && previewLabel && (
          <div className="pointer-events-none absolute -top-7 left-0 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg">
            {previewLabel}
          </div>
        )}

        {height >= 26 && (
          <div
            onPointerDown={(e) => startDrag(e, 'resize')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute inset-x-0 bottom-0 flex h-3.5 cursor-ns-resize touch-none items-end justify-center pb-0.5 opacity-60 group-hover:opacity-100"
            aria-label="Resize block"
            role="separator"
          >
            <div className="h-1 w-8 rounded-full bg-slate-400/80" />
          </div>
        )}
      </div>
    </div>
  )
}
