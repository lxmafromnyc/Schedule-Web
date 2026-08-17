import { useEffect, useMemo, useRef } from 'react'
import type { Block, CategoryId } from '../lib/types'
import { CATEGORIES } from '../lib/types'
import {
  MINUTES_IN_DAY,
  addDays,
  blockHeight,
  clampStart,
  dateKey,
  formatHourLabel,
  formatTime,
  isSameDay,
  layoutBlocks,
  minutesNow,
  minutesToY,
  snapMinutes,
  yToMinutes,
} from '../lib/time'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]))
function categoryFor(id: CategoryId) {
  return categoryMap.get(id) ?? CATEGORIES[CATEGORIES.length - 1]
}

interface WeekViewProps {
  weekStart: Date
  blocksByDate: Record<string, Block[]>
  onOpenBlock: (date: Date, block: Block) => void
  onCreateAt: (date: Date, startMinutes: number) => void
  scrollToNowSignal: number
}

function DayColumn({
  date,
  blocks,
  onOpenBlock,
  onCreateAt,
}: {
  date: Date
  blocks: Block[]
  onOpenBlock: (block: Block) => void
  onCreateAt: (startMinutes: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<{ y: number; pointerId: number } | null>(null)
  const laidOut = useMemo(() => layoutBlocks(blocks), [blocks])
  const isToday = isSameDay(date, new Date())
  const now = minutesNow()

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target !== trackRef.current) return
    startRef.current = { y: e.clientY, pointerId: e.pointerId }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = startRef.current
    startRef.current = null
    if (!start || start.pointerId !== e.pointerId) return
    if (Math.abs(e.clientY - start.y) > 6) return
    const rect = trackRef.current!.getBoundingClientRect()
    const minutes = clampStart(snapMinutes(yToMinutes(e.clientY - rect.top)))
    onCreateAt(minutes)
  }

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="relative flex-1 cursor-crosshair border-l border-slate-100 first:border-l-0"
    >
      {HOURS.map((h) => (
        <div
          key={h}
          className="pointer-events-none absolute inset-x-0 border-t border-slate-100"
          style={{ top: minutesToY(h * 60) }}
        />
      ))}

      {isToday && (
        <div
          className="pointer-events-none absolute inset-x-0 z-20 flex items-center gap-1"
          style={{ top: minutesToY(now) }}
        >
          <div className="-ml-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
          <div className="h-px flex-1 bg-rose-500" />
        </div>
      )}

      {laidOut.map(({ block, column, columnCount }) => {
        const category = categoryFor(block.category)
        const color = block.customColor || category.color
        const height = blockHeight(block.durationMinutes)
        const widthPct = 100 / columnCount
        return (
          <button
            key={block.id}
            type="button"
            onClick={() => onOpenBlock(block)}
            title={`${block.title} · ${formatTime(block.startMinutes)}`}
            className="absolute overflow-hidden rounded-md border px-1.5 py-0.5 text-left shadow-sm hover:shadow"
            style={{
              top: minutesToY(block.startMinutes),
              height,
              left: `${column * widthPct}%`,
              width: `${widthPct}%`,
              backgroundColor: color + '1a',
              borderColor: color + '55',
            }}
          >
            <p className="truncate text-[11px] font-medium leading-tight text-slate-800">
              {block.title}
            </p>
            {height >= 28 && (
              <p className="truncate text-[10px] leading-tight text-slate-500">
                {formatTime(block.startMinutes)}
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function WeekView({ weekStart, blocksByDate, onOpenBlock, onCreateAt, scrollToNowSignal }: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const today = new Date()

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const targetY = minutesToY(minutesNow())
    el.scrollTo({ top: Math.max(targetY - el.clientHeight / 3, 0), behavior: 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToNowSignal])

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-slate-200 bg-white">
        <div className="w-14 shrink-0 sm:w-16" />
        {days.map((d) => {
          const isToday = isSameDay(d, today)
          return (
            <div key={d.toISOString()} className="flex-1 border-l border-slate-100 py-2 text-center first:border-l-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {d.toLocaleDateString(undefined, { weekday: 'short' })}
              </p>
              <p
                className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-semibold ${
                  isToday ? 'bg-slate-900 text-white' : 'text-slate-700'
                }`}
              >
                {d.getDate()}
              </p>
            </div>
          )
        })}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="relative flex" style={{ height: minutesToY(MINUTES_IN_DAY) }}>
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
          {days.map((d) => {
            const key = dateKey(d)
            return (
              <DayColumn
                key={key}
                date={d}
                blocks={blocksByDate[key] ?? []}
                onOpenBlock={(block) => onOpenBlock(d, block)}
                onCreateAt={(minutes) => onCreateAt(d, minutes)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
