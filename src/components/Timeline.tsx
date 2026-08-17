import { useEffect, useMemo, useRef, useState } from 'react'
import type { Block, CategoryId } from '../lib/types'
import { CATEGORIES } from '../lib/types'
import {
  DEFAULT_DURATION_MINUTES,
  MINUTES_IN_DAY,
  MIN_BLOCK_MINUTES,
  SNAP_MINUTES,
  blockHeight,
  clampDuration,
  clampStart,
  formatDuration,
  formatHourLabel,
  formatTime,
  layoutBlocks,
  minutesNow,
  minutesToY,
  snapMinutes,
  yToMinutes,
} from '../lib/time'
import { ScheduleBlock } from './Block'
import type { DragPhase, DragType } from './Block'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]))
function categoryFor(id: CategoryId) {
  return categoryMap.get(id) ?? CATEGORIES[CATEGORIES.length - 1]
}

interface DragState {
  id: string
  type: DragType
  previewStart: number
  previewDuration: number
}

interface CreateState {
  anchorMinutes: number
  currentMinutes: number
  pointerId: number
}

interface TimelineProps {
  blocks: Block[]
  isToday: boolean
  onCreateAt: (startMinutes: number, durationMinutes?: number) => void
  onOpenBlock: (block: Block) => void
  onContextMenuBlock?: (block: Block, x: number, y: number) => void
  onContextMenuEmpty?: (startMinutes: number, x: number, y: number) => void
  onCommitBlock: (id: string, patch: { startMinutes: number; durationMinutes: number }) => void
  scrollToNowSignal: number
}

export function Timeline({
  blocks,
  isToday,
  onCreateAt,
  onOpenBlock,
  onContextMenuBlock,
  onContextMenuEmpty,
  onCommitBlock,
  scrollToNowSignal,
}: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [creating, setCreating] = useState<CreateState | null>(null)
  const [hoverMinutes, setHoverMinutes] = useState<number | null>(null)
  const [now, setNow] = useState(() => minutesNow())

  useEffect(() => {
    const id = setInterval(() => setNow(minutesNow()), 15_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const targetY = minutesToY(isToday ? now : 8 * 60)
    el.scrollTo({ top: Math.max(targetY - el.clientHeight / 3, 0), behavior: 'auto' })
    // Only run on mount / explicit signal, not on every `now` tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToNowSignal])

  const displayBlocks = useMemo(() => {
    if (!drag) return blocks
    return blocks.map((b) =>
      b.id === drag.id
        ? { ...b, startMinutes: drag.previewStart, durationMinutes: drag.previewDuration }
        : b,
    )
  }, [blocks, drag])

  const laidOut = useMemo(() => layoutBlocks(displayBlocks), [displayBlocks])

  const handleDrag = (
    id: string,
    type: DragType,
    deltaMinutes: number,
    phase: DragPhase,
  ) => {
    const original = blocks.find((b) => b.id === id)
    if (!original) return

    let previewStart = original.startMinutes
    let previewDuration = original.durationMinutes

    if (type === 'move') {
      previewStart = clampStart(snapMinutes(original.startMinutes + deltaMinutes))
      previewDuration = clampDuration(previewStart, original.durationMinutes)
    } else {
      const rawDuration = original.durationMinutes + deltaMinutes
      previewDuration = Math.max(
        snapMinutes(rawDuration),
        MIN_BLOCK_MINUTES,
      )
      previewDuration = clampDuration(original.startMinutes, previewDuration)
    }

    if (phase === 'end') {
      setDrag(null)
      if (previewStart !== original.startMinutes || previewDuration !== original.durationMinutes) {
        onCommitBlock(id, { startMinutes: previewStart, durationMinutes: previewDuration })
      }
    } else {
      setDrag({ id, type, previewStart, previewDuration })
    }
  }

  const yToSnappedMinutes = (clientY: number) => {
    const rect = trackRef.current!.getBoundingClientRect()
    return clampStart(snapMinutes(yToMinutes(clientY - rect.top)))
  }

  const handleTrackPointerDown = (e: React.PointerEvent) => {
    if (e.target !== trackRef.current) return
    if (e.button !== undefined && e.button !== 0) return
    const minutes = yToSnappedMinutes(e.clientY)
    setHoverMinutes(null)
    setCreating({ anchorMinutes: minutes, currentMinutes: minutes, pointerId: e.pointerId })
    // Only capture for mouse/pen so touch keeps its native scroll gesture available.
    if (e.pointerType !== 'touch') {
      trackRef.current?.setPointerCapture(e.pointerId)
    }
  }

  const handleTrackPointerMove = (e: React.PointerEvent) => {
    if (creating && creating.pointerId === e.pointerId) {
      const minutes = yToSnappedMinutes(e.clientY)
      setCreating((c) => (c ? { ...c, currentMinutes: minutes } : c))
      return
    }
    if (!drag && !creating && e.pointerType === 'mouse') {
      setHoverMinutes(yToSnappedMinutes(e.clientY))
    }
  }

  const finishCreating = (e: React.PointerEvent) => {
    if (!creating || creating.pointerId !== e.pointerId) return
    const start = Math.min(creating.anchorMinutes, creating.currentMinutes)
    const end = Math.max(creating.anchorMinutes, creating.currentMinutes)
    const dragged = end - start
    setCreating(null)
    if (dragged >= SNAP_MINUTES * 2) {
      onCreateAt(start, dragged)
    } else {
      onCreateAt(creating.anchorMinutes)
    }
  }

  const handleTrackPointerLeave = () => {
    if (!creating) setHoverMinutes(null)
  }

  const handleTrackContextMenu = (e: React.MouseEvent) => {
    if (e.target !== trackRef.current || !onContextMenuEmpty) return
    e.preventDefault()
    const rect = trackRef.current!.getBoundingClientRect()
    const minutes = clampStart(snapMinutes(yToMinutes(e.clientY - rect.top)))
    onContextMenuEmpty(minutes, e.clientX, e.clientY)
  }

  const previewLabel = (b: Block) =>
    `${formatTime(b.startMinutes)} – ${formatTime(b.startMinutes + b.durationMinutes)}`

  const createStart = creating ? Math.min(creating.anchorMinutes, creating.currentMinutes) : 0
  const createEnd = creating ? Math.max(creating.anchorMinutes, creating.currentMinutes) : 0
  const showCreateGhost = creating && createEnd - createStart >= SNAP_MINUTES * 2
  const showHover = hoverMinutes !== null && !drag && !creating

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto overscroll-contain">
      <div className="relative flex" style={{ height: minutesToY(MINUTES_IN_DAY) }}>
        {/* Hour label gutter */}
        <div className="relative w-14 shrink-0 select-none sm:w-16">
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-slate-400"
              style={{ top: minutesToY(h * 60) }}
            >
              {h === 0 ? '' : formatHourLabel(h * 60)}
            </div>
          ))}
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={finishCreating}
          onPointerCancel={() => setCreating(null)}
          onPointerLeave={handleTrackPointerLeave}
          onContextMenu={handleTrackContextMenu}
          className="relative flex-1 cursor-crosshair touch-pan-y select-none border-l border-slate-200"
        >
          {HOURS.map((h) => (
            <div
              key={h}
              className="pointer-events-none absolute inset-x-0 border-t border-slate-100"
              style={{ top: minutesToY(h * 60) }}
            />
          ))}
          {HOURS.map((h) => (
            <div
              key={`half-${h}`}
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-100"
              style={{ top: minutesToY(h * 60 + 30) }}
            />
          ))}

          {isToday && now >= 0 && now <= MINUTES_IN_DAY && (
            <div
              className="pointer-events-none absolute inset-x-0 z-20 flex items-center gap-1.5"
              style={{ top: minutesToY(now) }}
            >
              <div className="-ml-1 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500 shadow-sm" />
              <div className="h-px flex-1 bg-rose-500" />
            </div>
          )}

          {showHover && hoverMinutes !== null && (
            <div
              className="pointer-events-none absolute inset-x-1 z-0 rounded-md border border-dashed border-slate-300 bg-slate-100/70"
              style={{
                top: minutesToY(hoverMinutes),
                height: minutesToY(DEFAULT_DURATION_MINUTES),
              }}
            >
              <span className="ml-2 mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                {formatTime(hoverMinutes)}
              </span>
            </div>
          )}

          {showCreateGhost && (
            <div
              className="pointer-events-none absolute inset-x-1 z-30 rounded-md border-2 border-indigo-400 bg-indigo-100/80"
              style={{ top: minutesToY(createStart), height: minutesToY(createEnd - createStart) }}
            >
              <div className="px-2 py-1 text-[11px] font-semibold text-indigo-700">
                {formatTime(createStart)} – {formatTime(createEnd)} ·{' '}
                {formatDuration(createEnd - createStart)}
              </div>
            </div>
          )}

          {laidOut.map(({ block, column, columnCount }) => (
            <ScheduleBlock
              key={block.id}
              block={block}
              category={categoryFor(block.category)}
              top={minutesToY(block.startMinutes)}
              height={blockHeight(block.durationMinutes)}
              column={column}
              columnCount={columnCount}
              isDragging={drag?.id === block.id}
              previewLabel={drag?.id === block.id ? previewLabel(block) : undefined}
              onOpen={onOpenBlock}
              onDrag={handleDrag}
              onContextMenu={onContextMenuBlock}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
