import { useEffect, useMemo, useRef, useState } from 'react'
import type { Block, CategoryId } from '../lib/types'
import { CATEGORIES } from '../lib/types'
import {
  MINUTES_IN_DAY,
  MIN_BLOCK_MINUTES,
  blockHeight,
  clampDuration,
  clampStart,
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

interface TimelineProps {
  blocks: Block[]
  isToday: boolean
  onCreateAt: (startMinutes: number) => void
  onOpenBlock: (block: Block) => void
  onCommitBlock: (id: string, patch: { startMinutes: number; durationMinutes: number }) => void
  scrollToNowSignal: number
}

export function Timeline({
  blocks,
  isToday,
  onCreateAt,
  onOpenBlock,
  onCommitBlock,
  scrollToNowSignal,
}: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
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

  const handleTrackClick = (e: React.MouseEvent) => {
    if (e.target !== trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const minutes = clampStart(snapMinutes(yToMinutes(y)))
    onCreateAt(minutes)
  }

  const previewLabel = (b: Block) =>
    `${formatTime(b.startMinutes)} – ${formatTime(b.startMinutes + b.durationMinutes)}`

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
          onClick={handleTrackClick}
          className="relative flex-1 cursor-crosshair border-l border-slate-200"
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
            />
          ))}
        </div>
      </div>
    </div>
  )
}
