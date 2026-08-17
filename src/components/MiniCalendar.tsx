import { useEffect, useRef, useState } from 'react'
import { isSameDay } from '../lib/time'

interface Anchor {
  left: number
  right: number
  bottom: number
}

interface MiniCalendarProps {
  selected: Date
  anchor: Anchor
  onPick: (date: Date) => void
  onClose: () => void
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function buildGrid(viewMonth: Date): Date[] {
  const first = startOfMonth(viewMonth)
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - first.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

export function MiniCalendar({ selected, anchor, onPick, onClose }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected))
  const ref = useRef<HTMLDivElement>(null)
  const today = new Date()
  const [pos, setPos] = useState({ left: anchor.right - 288, top: anchor.bottom + 6 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const left = Math.min(anchor.right - rect.width, window.innerWidth - rect.width - 8)
    const top = Math.min(anchor.bottom + 6, window.innerHeight - rect.height - 8)
    setPos({ left: Math.max(8, left), top: Math.max(8, top) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const id = setTimeout(() => {
      window.addEventListener('pointerdown', handlePointerDown)
      window.addEventListener('keydown', handleKey)
    }, 0)
    return () => {
      clearTimeout(id)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const grid = buildGrid(viewMonth)
  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div
      ref={ref}
      style={{ left: pos.left, top: pos.top }}
      className="fixed z-50 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          aria-label="Previous month"
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[13px] font-semibold text-slate-800">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          aria-label="Next month"
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={i} className="text-[10px] font-medium text-slate-400">
            {w}
          </div>
        ))}
        {grid.map((d) => {
          const inMonth = d.getMonth() === viewMonth.getMonth()
          const isToday = isSameDay(d, today)
          const isSelected = isSameDay(d, selected)
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => {
                onPick(d)
                onClose()
              }}
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[12px] transition-colors ${
                isSelected
                  ? 'bg-slate-900 font-semibold text-white'
                  : isToday
                    ? 'font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-300'
                    : inMonth
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-slate-50'
              }`}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          onPick(new Date())
          onClose()
        }}
        className="mt-2 w-full rounded-lg py-1.5 text-center text-[12px] font-medium text-slate-500 hover:bg-slate-100"
      >
        Today
      </button>
    </div>
  )
}
